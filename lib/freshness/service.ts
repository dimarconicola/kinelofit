import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { and, desc, eq, inArray, isNull, lt, ne, or } from 'drizzle-orm';
import { DateTime } from 'luxon';

import { sessions as seedSessions, venues as seedVenues } from '@/lib/catalog/seed';
import { getDb, isDatabaseConfigured } from '@/lib/data/db';
import { freshnessRuns, sessions, sourceRecords } from '@/lib/data/schema';
import { buildSessionTimeSignature, evaluateAdapterAutoReverify, getAdapterForSource, parseSourceWithAdapter } from '@/lib/freshness/adapters';

const SOURCE_HEALTH_ENTITY = 'source_health';
const SOURCE_PARSE_ENTITY = 'source_parse';
const TMP_DIR = '/tmp/kinelo-fit-freshness';
const TMP_FILE = join(TMP_DIR, 'source-health.json');
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_CONCURRENCY = 4;

type PriorSourceSignal = {
  hash: string;
  reachable: boolean;
};

export type SourceSignal = {
  sourceUrl: string;
  finalUrl: string;
  status: number;
  reachable: boolean;
  etag: string | null;
  lastModified: string | null;
  contentLength: string | null;
  checkedAt: string;
  hash: string;
  error: string | null;
};

export type FreshnessRunReport = {
  citySlug: string;
  checkedAt: string;
  totalSources: number;
  changedSources: number;
  unreachableSources: number;
  impactedSources: number;
  adapterSourcesChecked: number;
  adapterSignals: number;
  autoReverified: number;
  stalePromoted: number;
  hiddenPromoted: number;
  staleByAge: number;
  brokenLinks: number;
  runStored: boolean;
  mode: 'database' | 'ephemeral';
  impactedSourceUrls: string[];
};

export type FreshnessRunOptions = {
  citySlug: string;
  dryRun?: boolean;
  timeoutMs?: number;
  maxSources?: number;
};

const stableHash = (value: string) => createHash('sha256').update(value).digest('hex');

const toLowerSafe = (value: string) => value.trim().toLowerCase();

const normalizeSourceUrl = (raw: string) => {
  try {
    const url = new URL(raw.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    const normalized = url.toString();
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return null;
  }
};

export const buildSourceSlug = (sourceUrl: string) => {
  const normalized = normalizeSourceUrl(sourceUrl) ?? sourceUrl.trim();
  return `source-${stableHash(normalized).slice(0, 20)}`;
};

export const buildSourceSignalHash = (signal: Omit<SourceSignal, 'hash' | 'checkedAt' | 'error'>) => {
  const basis = [
    signal.status,
    signal.finalUrl,
    signal.etag ?? '',
    signal.lastModified ?? '',
    signal.contentLength ?? '',
    signal.reachable ? '1' : '0'
  ].join('|');
  return stableHash(basis);
};

export const getCitySourceUrls = (citySlug: string) => {
  const sourceSet = new Set<string>();

  for (const venue of seedVenues) {
    if (venue.citySlug !== citySlug) continue;
    const normalized = normalizeSourceUrl(venue.sourceUrl);
    if (normalized) sourceSet.add(normalized);
  }

  for (const session of seedSessions) {
    if (session.citySlug !== citySlug) continue;
    const normalized = normalizeSourceUrl(session.sourceUrl);
    if (normalized) sourceSet.add(normalized);
  }

  return Array.from(sourceSet).sort();
};

const timeoutFetch = async (input: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
};

const extractSignal = (sourceUrl: string, response: Response): SourceSignal => {
  const base: Omit<SourceSignal, 'checkedAt' | 'hash' | 'error'> = {
    sourceUrl,
    finalUrl: response.url || sourceUrl,
    status: response.status,
    reachable: response.status > 0 && response.status < 400,
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
    contentLength: response.headers.get('content-length')
  };

  return {
    ...base,
    checkedAt: new Date().toISOString(),
    hash: buildSourceSignalHash(base),
    error: null
  };
};

const fetchSourceSignal = async (sourceUrl: string, timeoutMs: number): Promise<SourceSignal> => {
  const requestInit: RequestInit = {
    method: 'HEAD',
    redirect: 'follow',
    cache: 'no-store',
    headers: {
      'user-agent': 'kinelo.fit-freshness/1.0'
    }
  };

  try {
    const headResponse = await timeoutFetch(sourceUrl, requestInit, timeoutMs);
    if (headResponse.status !== 405 && headResponse.status !== 501) {
      return extractSignal(sourceUrl, headResponse);
    }

    const getResponse = await timeoutFetch(
      sourceUrl,
      {
        ...requestInit,
        method: 'GET'
      },
      timeoutMs
    );

    // We only need headers for low-resource checking.
    await getResponse.body?.cancel();
    return extractSignal(sourceUrl, getResponse);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'network_error';
    const fallback: Omit<SourceSignal, 'checkedAt' | 'hash'> = {
      sourceUrl,
      finalUrl: sourceUrl,
      status: 0,
      reachable: false,
      etag: null,
      lastModified: null,
      contentLength: null,
      error: reason
    };

    return {
      ...fallback,
      checkedAt: new Date().toISOString(),
      hash: stableHash(`0|${sourceUrl}|${reason}`)
    };
  }
};

const mapFromLocalFile = async (): Promise<Map<string, PriorSourceSignal>> => {
  try {
    const payload = JSON.parse(await readFile(TMP_FILE, 'utf8')) as Record<string, PriorSourceSignal>;
    const map = new Map<string, PriorSourceSignal>();
    for (const [key, value] of Object.entries(payload)) {
      if (value?.hash) {
        map.set(key, { hash: value.hash, reachable: Boolean(value.reachable) });
      }
    }
    return map;
  } catch {
    return new Map<string, PriorSourceSignal>();
  }
};

const writeLocalSignals = async (signals: SourceSignal[]) => {
  const payload = Object.fromEntries(
    signals.map((signal) => [buildSourceSlug(signal.sourceUrl), { hash: signal.hash, reachable: signal.reachable }])
  );
  await mkdir(TMP_DIR, { recursive: true });
  await writeFile(TMP_FILE, JSON.stringify(payload, null, 2));
};

const loadPriorSignalsFromDatabase = async (sourceSlugs: string[]) => {
  const db = getDb();
  const map = new Map<string, PriorSourceSignal>();
  if (!db || sourceSlugs.length === 0) return map;

  const rows = await db
    .select({
      entitySlug: sourceRecords.entitySlug,
      sourcePayload: sourceRecords.sourcePayload,
      lastVerifiedAt: sourceRecords.lastVerifiedAt
    })
    .from(sourceRecords)
    .where(and(eq(sourceRecords.entityType, SOURCE_HEALTH_ENTITY), inArray(sourceRecords.entitySlug, sourceSlugs)))
    .orderBy(desc(sourceRecords.lastVerifiedAt));

  for (const row of rows) {
    if (map.has(row.entitySlug)) continue;
    const hash = typeof row.sourcePayload?.hash === 'string' ? row.sourcePayload.hash : null;
    if (!hash) continue;

    map.set(row.entitySlug, {
      hash,
      reachable: Boolean(row.sourcePayload?.reachable)
    });
  }

  return map;
};

const runWithConcurrency = async <T, R>(items: T[], worker: (item: T) => Promise<R>, concurrency: number) => {
  const queue = [...items];
  const output: R[] = [];

  const runners = Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      output.push(await worker(item));
    }
  });

  await Promise.all(runners);
  return output;
};

const parseNumber = (value: string | null | undefined) => {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const runDailyFreshnessCheck = async (options: FreshnessRunOptions): Promise<FreshnessRunReport> => {
  const citySlug = toLowerSafe(options.citySlug);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const sourceUrls = getCitySourceUrls(citySlug);
  const slicedSources = typeof options.maxSources === 'number' ? sourceUrls.slice(0, options.maxSources) : sourceUrls;
  const sourceSlugs = slicedSources.map((url) => buildSourceSlug(url));
  const db = getDb();
  const useDb = isDatabaseConfigured && Boolean(db);

  const priorSignals = useDb ? await loadPriorSignalsFromDatabase(sourceSlugs) : await mapFromLocalFile();

  const checkedSignals = await runWithConcurrency(slicedSources, (sourceUrl) => fetchSourceSignal(sourceUrl, timeoutMs), DEFAULT_CONCURRENCY);

  const changedSourceUrls: string[] = [];
  const unreachableSourceUrls: string[] = [];
  const signalsToPersist: SourceSignal[] = [];

  for (const signal of checkedSignals) {
    const slug = buildSourceSlug(signal.sourceUrl);
    const prior = priorSignals.get(slug);

    const changed = !prior || prior.hash !== signal.hash || prior.reachable !== signal.reachable;
    if (changed) changedSourceUrls.push(signal.sourceUrl);
    if (!signal.reachable) unreachableSourceUrls.push(signal.sourceUrl);
    if (changed || !prior) signalsToPersist.push(signal);
  }

  const impactedSourceUrls = Array.from(new Set([...changedSourceUrls, ...unreachableSourceUrls]));
  const changedSourceSet = new Set(changedSourceUrls);

  let adapterSourcesChecked = 0;
  let adapterSignals = 0;
  let autoReverified = 0;
  let stalePromoted = 0;
  let hiddenPromoted = 0;
  let staleByAge = 0;
  let brokenLinks = 0;
  let totalSessionsTracked = 0;
  let runStored = false;

  if (!options.dryRun && useDb && db) {
    if (signalsToPersist.length > 0) {
      await db.insert(sourceRecords).values(
        signalsToPersist.map((signal) => ({
          entityType: SOURCE_HEALTH_ENTITY,
          entitySlug: buildSourceSlug(signal.sourceUrl),
          sourceUrl: signal.sourceUrl,
          sourcePayload: {
            finalUrl: signal.finalUrl,
            status: signal.status,
            reachable: signal.reachable,
            etag: signal.etag,
            lastModified: signal.lastModified,
            contentLength: signal.contentLength,
            hash: signal.hash,
            error: signal.error
          },
          lastVerifiedAt: new Date(signal.checkedAt)
        }))
      );
    }

    if (impactedSourceUrls.length > 0) {
      const promotableRows = await db
        .select({ id: sessions.id, verificationStatus: sessions.verificationStatus })
        .from(sessions)
        .where(
          and(
            eq(sessions.citySlug, citySlug),
            inArray(sessions.sourceUrl, impactedSourceUrls),
            eq(sessions.verificationStatus, 'verified')
          )
        );

      stalePromoted += promotableRows.length;

      await db
        .update(sessions)
        .set({ verificationStatus: 'stale' })
        .where(
          and(
            eq(sessions.citySlug, citySlug),
            inArray(sessions.sourceUrl, impactedSourceUrls),
            ne(sessions.verificationStatus, 'hidden')
          )
        );
    }

    const citySessions = await db
      .select({
        id: sessions.id,
        sourceUrl: sessions.sourceUrl,
        startAt: sessions.startAt
      })
      .from(sessions)
      .where(eq(sessions.citySlug, citySlug));

    const normalizeForCompare = (value: string) => normalizeSourceUrl(value) ?? value.trim().replace(/\/+$/, '');

    for (const signal of checkedSignals) {
      if (!signal.reachable) continue;
      if (!changedSourceSet.has(signal.sourceUrl)) continue;

      const adapter = getAdapterForSource(signal.sourceUrl);
      if (!adapter) continue;

      let html = '';
      try {
        const response = await timeoutFetch(
          signal.sourceUrl,
          {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-store',
            headers: {
              'user-agent': 'kinelo.fit-freshness/1.0'
            }
          },
          timeoutMs
        );
        if (!response.ok) continue;
        html = await response.text();
      } catch {
        continue;
      }

      const parsed = parseSourceWithAdapter(signal.sourceUrl, html);
      if (!parsed.adapterId || parsed.sessions.length === 0) continue;

      adapterSourcesChecked += 1;
      adapterSignals += parsed.sessions.length;

      const signatureSet = new Set(parsed.sessions.map((entry) => buildSessionTimeSignature(entry.weekday, entry.startTime)));
      const sourceCandidates = new Set([
        normalizeForCompare(signal.sourceUrl),
        normalizeForCompare(signal.finalUrl),
        normalizeForCompare(`${signal.sourceUrl}/`)
      ]);

      const matchingRows = citySessions.filter((row) => sourceCandidates.has(normalizeForCompare(row.sourceUrl)));
      const matchedSignatures = new Set<string>();
      const idsToReverify = matchingRows
        .filter((row) => {
          const start = DateTime.fromJSDate(row.startAt).setZone('Europe/Rome').setLocale('en');
          const weekday = start.toFormat('cccc');
          const startTime = start.toFormat('HH:mm');
          const signature = buildSessionTimeSignature(weekday, startTime);
          if (!signatureSet.has(signature)) return false;
          matchedSignatures.add(signature);
          return true;
        })
        .map((row) => row.id);

      const confidenceEvaluation = parsed.thresholds
        ? evaluateAdapterAutoReverify(parsed.thresholds, signatureSet.size, matchedSignatures.size)
        : null;
      const allowAutoReverify = confidenceEvaluation ? confidenceEvaluation.accepted : true;

      if (allowAutoReverify && idsToReverify.length > 0) {
        await db
          .update(sessions)
          .set({
            verificationStatus: 'verified',
            lastVerifiedAt: new Date(signal.checkedAt)
          })
          .where(inArray(sessions.id, idsToReverify));
        autoReverified += idsToReverify.length;
      }

      await db.insert(sourceRecords).values({
        entityType: SOURCE_PARSE_ENTITY,
        entitySlug: `${buildSourceSlug(signal.sourceUrl)}-${parsed.adapterId}`,
        sourceUrl: signal.sourceUrl,
        sourcePayload: {
          adapterId: parsed.adapterId,
          thresholds: parsed.thresholds,
          confidenceEvaluation: confidenceEvaluation
            ? {
                accepted: confidenceEvaluation.accepted,
                reason: confidenceEvaluation.reason,
                parsedSignals: confidenceEvaluation.parsedSignals,
                matchedSignals: confidenceEvaluation.matchedSignals,
                matchRatio: Number(confidenceEvaluation.matchRatio.toFixed(4))
              }
            : null,
          matchedSessionCount: idsToReverify.length,
          signals: parsed.sessions.map((entry) => ({
            title: entry.title,
            weekday: entry.weekday,
            startTime: entry.startTime,
            endTime: entry.endTime,
            confidence: entry.confidence,
            signature: entry.signature
          }))
        },
        lastVerifiedAt: new Date(signal.checkedAt)
      });
    }

    const now = DateTime.now().setZone('Europe/Rome');
    const staleThreshold = now.minus({ days: 7 }).toJSDate();
    const hiddenThreshold = now.minus({ days: 14 }).toJSDate();

    const staleAgingRows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.citySlug, citySlug), eq(sessions.verificationStatus, 'verified'), lt(sessions.lastVerifiedAt, staleThreshold)));

    staleByAge = staleAgingRows.length;
    stalePromoted += staleAgingRows.length;

    if (staleAgingRows.length > 0) {
      await db
        .update(sessions)
        .set({ verificationStatus: 'stale' })
        .where(and(eq(sessions.citySlug, citySlug), eq(sessions.verificationStatus, 'verified'), lt(sessions.lastVerifiedAt, staleThreshold)));
    }

    const hiddenRows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.citySlug, citySlug), ne(sessions.verificationStatus, 'hidden'), lt(sessions.lastVerifiedAt, hiddenThreshold)));

    hiddenPromoted = hiddenRows.length;

    if (hiddenRows.length > 0) {
      await db
        .update(sessions)
        .set({ verificationStatus: 'hidden' })
        .where(and(eq(sessions.citySlug, citySlug), ne(sessions.verificationStatus, 'hidden'), lt(sessions.lastVerifiedAt, hiddenThreshold)));
    }

    const brokenRows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.citySlug, citySlug), or(isNull(sessions.bookingTargetSlug), eq(sessions.bookingTargetSlug, ''))));

    brokenLinks = brokenRows.length;

    const citySessionRows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.citySlug, citySlug));
    totalSessionsTracked = citySessionRows.length;

    const reportTimestamp = new Date();
    await db.insert(freshnessRuns).values({
      citySlug,
      totalSessions: String(totalSessionsTracked),
      staleSessions: String(stalePromoted),
      brokenLinks: String(brokenLinks),
      notes: JSON.stringify({
        totalSources: slicedSources.length,
        changedSources: changedSourceUrls.length,
        unreachableSources: unreachableSourceUrls.length,
        impactedSources: impactedSourceUrls.length,
        adapterSourcesChecked,
        adapterSignals,
        autoReverified,
        staleByAge,
        checkedAt: reportTimestamp.toISOString()
      }),
      createdAt: reportTimestamp
    });

    runStored = true;
  } else if (!options.dryRun) {
    await writeLocalSignals(checkedSignals);
    runStored = true;
  }

  return {
    citySlug,
    checkedAt: new Date().toISOString(),
    totalSources: slicedSources.length,
    changedSources: changedSourceUrls.length,
    unreachableSources: unreachableSourceUrls.length,
    impactedSources: impactedSourceUrls.length,
    adapterSourcesChecked,
    adapterSignals,
    autoReverified,
    stalePromoted,
    hiddenPromoted,
    staleByAge,
    brokenLinks,
    runStored,
    mode: useDb ? 'database' : 'ephemeral',
    impactedSourceUrls
  };
};

export type FreshnessRunSnapshot = {
  citySlug: string;
  totalSources: number;
  totalSessions: number;
  staleSessions: number;
  brokenLinks: number;
  changedSources: number;
  unreachableSources: number;
  impactedSources: number;
  adapterSourcesChecked: number;
  adapterSignals: number;
  autoReverified: number;
  createdAt: string;
};

export const getLatestFreshnessSnapshot = async (citySlug: string): Promise<FreshnessRunSnapshot | null> => {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(freshnessRuns)
    .where(eq(freshnessRuns.citySlug, citySlug))
    .orderBy(desc(freshnessRuns.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  let changedSources = 0;
  let unreachableSources = 0;
  let impactedSources = 0;
  let adapterSourcesChecked = 0;
  let adapterSignals = 0;
  let autoReverified = 0;
  let totalSources = 0;

  try {
    const notes = row.notes ? (JSON.parse(row.notes) as Record<string, unknown>) : {};
    totalSources = parseNumber(typeof notes.totalSources === 'number' ? String(notes.totalSources) : (notes.totalSources as string | undefined));
    changedSources = parseNumber(typeof notes.changedSources === 'number' ? String(notes.changedSources) : (notes.changedSources as string | undefined));
    unreachableSources = parseNumber(typeof notes.unreachableSources === 'number' ? String(notes.unreachableSources) : (notes.unreachableSources as string | undefined));
    impactedSources = parseNumber(typeof notes.impactedSources === 'number' ? String(notes.impactedSources) : (notes.impactedSources as string | undefined));
    adapterSourcesChecked = parseNumber(
      typeof notes.adapterSourcesChecked === 'number'
        ? String(notes.adapterSourcesChecked)
        : (notes.adapterSourcesChecked as string | undefined)
    );
    adapterSignals = parseNumber(typeof notes.adapterSignals === 'number' ? String(notes.adapterSignals) : (notes.adapterSignals as string | undefined));
    autoReverified = parseNumber(typeof notes.autoReverified === 'number' ? String(notes.autoReverified) : (notes.autoReverified as string | undefined));
  } catch {
    totalSources = 0;
    changedSources = 0;
    unreachableSources = 0;
    impactedSources = 0;
    adapterSourcesChecked = 0;
    adapterSignals = 0;
    autoReverified = 0;
  }

  return {
    citySlug: row.citySlug,
    totalSources,
    totalSessions: parseNumber(row.totalSessions),
    staleSessions: parseNumber(row.staleSessions),
    brokenLinks: parseNumber(row.brokenLinks),
    changedSources,
    unreachableSources,
    impactedSources,
    adapterSourcesChecked,
    adapterSignals,
    autoReverified,
    createdAt: row.createdAt.toISOString()
  };
};
