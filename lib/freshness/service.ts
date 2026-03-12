import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { and, desc, eq, inArray, isNull, lt, ne, or } from 'drizzle-orm';
import { DateTime } from 'luxon';

import type { SourceCadence, SourceRegistryEntry } from '@/lib/catalog/types';
import { getDb, isDatabaseConfigured } from '@/lib/data/db';
import { discoveryLeads, freshnessRuns, sessions, sourceRecords, sourceRegistry } from '@/lib/data/schema';
import { buildSessionTimeSignature, evaluateAdapterAutoReverify, getAdapterForSource, parseSourceWithAdapter } from '@/lib/freshness/adapters';
import { cadenceIncludes, getSeedSourceRegistry, getSourceUrlsForCadence } from '@/lib/freshness/source-registry';

const SOURCE_HEALTH_ENTITY = 'source_health';
const SOURCE_PARSE_ENTITY = 'source_parse';
const TMP_DIR = '/tmp/kinelo-fit-freshness';
const TMP_FILE = join(TMP_DIR, 'source-health.json');
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_CADENCE: SourceCadence = 'daily';

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
  cadence: SourceCadence;
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
  registrySourcesSeeded: number;
  discoveryLeadsDiscovered: number;
  mode: 'database' | 'ephemeral';
  impactedSourceUrls: string[];
};

export type FreshnessRunOptions = {
  citySlug: string;
  cadence?: SourceCadence;
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

export const getCitySourceUrls = (citySlug: string) => getSourceUrlsForCadence(getSeedSourceRegistry(citySlug), 'daily');

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

const isSourceCadence = (value: string | null | undefined): value is SourceCadence =>
  value === 'daily' || value === 'weekly' || value === 'quarterly';

const resolveRunCadence = (value: SourceCadence | undefined) => (isSourceCadence(value) ? value : DEFAULT_CADENCE);

const isSupportedSourceType = (value: string): SourceRegistryEntry['sourceType'] =>
  value === 'official_site' || value === 'events_calendar' || value === 'directory' || value === 'social' || value === 'community_board'
    ? value
    : 'official_site';

const isSupportedSourcePurpose = (value: string): SourceRegistryEntry['purpose'] => (value === 'discovery' ? 'discovery' : 'catalog');

const isSupportedTrustTier = (value: string): SourceRegistryEntry['trustTier'] =>
  value === 'tier_a' || value === 'tier_b' || value === 'tier_c' ? value : 'tier_b';

const toSourceRegistryEntry = (
  row: typeof sourceRegistry.$inferSelect
): SourceRegistryEntry => ({
  citySlug: row.citySlug,
  sourceUrl: row.sourceUrl,
  sourceType: isSupportedSourceType(row.sourceType),
  cadence: row.cadence as SourceCadence,
  trustTier: isSupportedTrustTier(row.trustTier),
  purpose: isSupportedSourcePurpose(row.purpose),
  parserAdapter: row.parserAdapter ?? undefined,
  tags: row.tags,
  active: row.active,
  notes: row.notes ?? undefined,
  lastCheckedAt: row.lastCheckedAt?.toISOString(),
  nextCheckAt: row.nextCheckAt?.toISOString()
});

const ensureSourceRegistrySeed = async (citySlug: string) => {
  const db = getDb();
  if (!db) return 0;

  const existing = await db
    .select({ id: sourceRegistry.id })
    .from(sourceRegistry)
    .where(eq(sourceRegistry.citySlug, citySlug))
    .limit(1);
  if (existing.length > 0) return 0;

  const seed = getSeedSourceRegistry(citySlug);
  if (seed.length === 0) return 0;
  const now = new Date();
  const inserted = await db
    .insert(sourceRegistry)
    .values(
      seed.map((entry) => ({
        citySlug: entry.citySlug,
        sourceUrl: entry.sourceUrl,
        sourceType: entry.sourceType,
        cadence: entry.cadence,
        trustTier: entry.trustTier,
        purpose: entry.purpose,
        parserAdapter: entry.parserAdapter ?? null,
        tags: entry.tags,
        active: entry.active,
        notes: entry.notes ?? null,
        lastCheckedAt: null,
        nextCheckAt: null,
        createdAt: now,
        updatedAt: now
      }))
    )
    .onConflictDoNothing()
    .returning({ id: sourceRegistry.id });

  return inserted.length;
};

const loadSourcesForRun = async (citySlug: string, runCadence: SourceCadence, useDb: boolean) => {
  if (!useDb) {
    const fallback = getSeedSourceRegistry(citySlug);
    return {
      sourceEntries: fallback,
      sourceUrls: getSourceUrlsForCadence(fallback, runCadence),
      registrySourcesSeeded: 0
    };
  }

  const registrySourcesSeeded = await ensureSourceRegistrySeed(citySlug);
  const db = getDb();
  if (!db) {
    const fallback = getSeedSourceRegistry(citySlug);
    return {
      sourceEntries: fallback,
      sourceUrls: getSourceUrlsForCadence(fallback, runCadence),
      registrySourcesSeeded
    };
  }

  const rows = await db
    .select()
    .from(sourceRegistry)
    .where(and(eq(sourceRegistry.citySlug, citySlug), eq(sourceRegistry.active, true)))
    .orderBy(sourceRegistry.sourceUrl);

  const sourceEntries = rows.map(toSourceRegistryEntry);
  if (sourceEntries.length === 0) {
    const fallback = getSeedSourceRegistry(citySlug);
    return {
      sourceEntries: fallback,
      sourceUrls: getSourceUrlsForCadence(fallback, runCadence),
      registrySourcesSeeded
    };
  }

  return {
    sourceEntries,
    sourceUrls: getSourceUrlsForCadence(sourceEntries, runCadence),
    registrySourcesSeeded
  };
};

type DiscoveryCandidate = {
  sourceUrl: string;
  title: string;
  snippet: string;
  discoveredFromUrl: string;
  confidence: number;
  tags: string[];
  lastSeenAt: string;
};

const discoveryKeywords: Record<string, string> = {
  kids: 'kids',
  bimbi: 'kids',
  bambini: 'kids',
  yoga: 'yoga',
  circo: 'circo',
  circomotricita: 'circo',
  danza: 'dance',
  capoeira: 'capoeira',
  teatro: 'theater',
  palermo: 'palermo',
  martial: 'martial',
  marzial: 'martial'
};

const stripHtml = (value: string) =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseTitleFromHtml = (html: string) => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]) : 'Untitled source';
};

const extractDiscoveryCandidates = (html: string, discoveredFromUrl: string): DiscoveryCandidate[] => {
  const candidates = new Map<string, DiscoveryCandidate>();
  const linkRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]?.trim();
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;

    const resolved = normalizeSourceUrl(new URL(href, discoveredFromUrl).toString());
    if (!resolved || resolved === normalizeSourceUrl(discoveredFromUrl)) continue;
    if (resolved.includes('/wp-content/') || resolved.includes('/wp-json/')) continue;

    const anchor = stripHtml(match[2] ?? '');
    const key = `${resolved} ${anchor}`.toLowerCase();
    const matchedTags = new Set<string>();

    for (const [needle, tag] of Object.entries(discoveryKeywords)) {
      if (key.includes(needle)) matchedTags.add(tag);
    }

    // Keep quarterly sweep scoped to Palermo and activity-like signals.
    if (!matchedTags.has('palermo')) continue;
    if (![...matchedTags].some((tag) => tag !== 'palermo')) continue;

    const confidence = Math.min(0.99, 0.25 + matchedTags.size * 0.12);
    const title = anchor.length > 0 ? anchor.slice(0, 200) : resolved;
    const snippet = `Quarterly sweep candidate from ${new URL(discoveredFromUrl).hostname}`;
    const previous = candidates.get(resolved);

    if (!previous || previous.confidence < confidence) {
      candidates.set(resolved, {
        sourceUrl: resolved,
        title,
        snippet,
        discoveredFromUrl,
        confidence,
        tags: [...matchedTags],
        lastSeenAt: new Date().toISOString()
      });
    }
  }

  return Array.from(candidates.values());
};

const runQuarterlyDiscoverySweep = async (
  citySlug: string,
  sourceEntries: SourceRegistryEntry[],
  timeoutMs: number,
  useDb: boolean,
  dryRun: boolean
) => {
  const quarterlyDiscoverySources = sourceEntries
    .filter((entry) => entry.active && entry.purpose === 'discovery' && cadenceIncludes('quarterly', entry.cadence))
    .map((entry) => entry.sourceUrl);

  if (quarterlyDiscoverySources.length === 0) return 0;

  const candidateBatches = await runWithConcurrency(
    quarterlyDiscoverySources,
    async (sourceUrl) => {
      try {
        const response = await timeoutFetch(
          sourceUrl,
          {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-store',
            headers: {
              'user-agent': 'kinelo.fit-discovery/1.0'
            }
          },
          timeoutMs
        );
        if (!response.ok) return [] as DiscoveryCandidate[];
        const html = await response.text();
        const baseCandidate: DiscoveryCandidate = {
          sourceUrl: normalizeSourceUrl(response.url || sourceUrl) ?? sourceUrl,
          title: parseTitleFromHtml(html),
          snippet: `Quarterly source scanned for ${citySlug}.`,
          discoveredFromUrl: sourceUrl,
          confidence: 0.55,
          tags: ['palermo', 'quarterly-source'],
          lastSeenAt: new Date().toISOString()
        };
        return [baseCandidate, ...extractDiscoveryCandidates(html, sourceUrl)];
      } catch {
        return [] as DiscoveryCandidate[];
      }
    },
    2
  );

  const flattened = candidateBatches.flat();
  if (flattened.length === 0 || dryRun) return flattened.length;
  if (!useDb) return flattened.length;

  const db = getDb();
  if (!db) return flattened.length;

  const inserted = await db
    .insert(discoveryLeads)
    .values(
      flattened.map((candidate) => ({
        citySlug,
        sourceUrl: candidate.sourceUrl,
        title: candidate.title,
        snippet: candidate.snippet,
        discoveredFromUrl: candidate.discoveredFromUrl,
        status: 'new' as const,
        confidence: candidate.confidence.toFixed(3),
        tags: candidate.tags,
        lastSeenAt: new Date(candidate.lastSeenAt),
        createdAt: new Date()
      }))
    )
    .onConflictDoNothing()
    .returning({ id: discoveryLeads.id });

  return inserted.length;
};

export const getCitySourceUrlsForCadence = (citySlug: string, cadence: SourceCadence) =>
  getSourceUrlsForCadence(getSeedSourceRegistry(citySlug), cadence);

export const runDailyFreshnessCheck = async (options: FreshnessRunOptions): Promise<FreshnessRunReport> => {
  const citySlug = toLowerSafe(options.citySlug);
  const cadence = resolveRunCadence(options.cadence);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const db = getDb();
  const useDb = isDatabaseConfigured && Boolean(db);
  const { sourceEntries, sourceUrls, registrySourcesSeeded } = await loadSourcesForRun(citySlug, cadence, useDb);
  const slicedSources = typeof options.maxSources === 'number' ? sourceUrls.slice(0, options.maxSources) : sourceUrls;
  const sourceSlugs = slicedSources.map((url) => buildSourceSlug(url));

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
  let discoveryLeadsDiscovered = 0;
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

    if (slicedSources.length > 0) {
      const checkedAt = new Date();
      await db
        .update(sourceRegistry)
        .set({
          lastCheckedAt: checkedAt,
          updatedAt: checkedAt
        })
        .where(and(eq(sourceRegistry.citySlug, citySlug), inArray(sourceRegistry.sourceUrl, slicedSources)));
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

    if (cadence === 'quarterly') {
      discoveryLeadsDiscovered = await runQuarterlyDiscoverySweep(citySlug, sourceEntries, timeoutMs, useDb, Boolean(options.dryRun));
    }

    const reportTimestamp = new Date();
    await db.insert(freshnessRuns).values({
      citySlug,
      cadence,
      totalSessions: String(totalSessionsTracked),
      staleSessions: String(stalePromoted),
      brokenLinks: String(brokenLinks),
      notes: JSON.stringify({
        cadence,
        totalSources: slicedSources.length,
        changedSources: changedSourceUrls.length,
        unreachableSources: unreachableSourceUrls.length,
        impactedSources: impactedSourceUrls.length,
        adapterSourcesChecked,
        adapterSignals,
        autoReverified,
        staleByAge,
        registrySourcesSeeded,
        discoveryLeadsDiscovered,
        checkedAt: reportTimestamp.toISOString()
      }),
      createdAt: reportTimestamp
    });

    runStored = true;
  } else if (!options.dryRun) {
    await writeLocalSignals(checkedSignals);
    if (cadence === 'quarterly') {
      discoveryLeadsDiscovered = await runQuarterlyDiscoverySweep(citySlug, sourceEntries, timeoutMs, useDb, Boolean(options.dryRun));
    }
    runStored = true;
  }

  return {
    citySlug,
    cadence,
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
    registrySourcesSeeded,
    discoveryLeadsDiscovered,
    runStored,
    mode: useDb ? 'database' : 'ephemeral',
    impactedSourceUrls
  };
};

export type FreshnessRunSnapshot = {
  citySlug: string;
  cadence: SourceCadence;
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
  registrySourcesSeeded: number;
  discoveryLeadsDiscovered: number;
  createdAt: string;
};

export type SourceRegistrySnapshot = {
  citySlug: string;
  totalSources: number;
  byCadence: Record<SourceCadence, number>;
  byPurpose: { catalog: number; discovery: number };
  entries: SourceRegistryEntry[];
  mode: 'database' | 'seed';
};

export type DiscoveryLeadSummary = {
  id: string;
  citySlug: string;
  sourceUrl: string;
  title: string;
  snippet?: string;
  discoveredFromUrl: string;
  status: 'new' | 'reviewed' | 'imported' | 'rejected';
  confidence: number;
  tags: string[];
  lastSeenAt: string;
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
  let registrySourcesSeeded = 0;
  let discoveryLeadsDiscovered = 0;

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
    registrySourcesSeeded = parseNumber(
      typeof notes.registrySourcesSeeded === 'number'
        ? String(notes.registrySourcesSeeded)
        : (notes.registrySourcesSeeded as string | undefined)
    );
    discoveryLeadsDiscovered = parseNumber(
      typeof notes.discoveryLeadsDiscovered === 'number'
        ? String(notes.discoveryLeadsDiscovered)
        : (notes.discoveryLeadsDiscovered as string | undefined)
    );
  } catch {
    totalSources = 0;
    changedSources = 0;
    unreachableSources = 0;
    impactedSources = 0;
    adapterSourcesChecked = 0;
    adapterSignals = 0;
    autoReverified = 0;
    registrySourcesSeeded = 0;
    discoveryLeadsDiscovered = 0;
  }

  return {
    citySlug: row.citySlug,
    cadence: row.cadence as SourceCadence,
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
    registrySourcesSeeded,
    discoveryLeadsDiscovered,
    createdAt: row.createdAt.toISOString()
  };
};

const summarizeRegistry = (entries: SourceRegistryEntry[]) => {
  const byCadence: Record<SourceCadence, number> = { daily: 0, weekly: 0, quarterly: 0 };
  const byPurpose = { catalog: 0, discovery: 0 };

  for (const entry of entries) {
    byCadence[entry.cadence] += 1;
    byPurpose[entry.purpose] += 1;
  }

  return { byCadence, byPurpose };
};

export const getSourceRegistrySnapshot = async (citySlug: string): Promise<SourceRegistrySnapshot> => {
  const normalizedCity = toLowerSafe(citySlug);
  const db = getDb();

  if (db) {
    await ensureSourceRegistrySeed(normalizedCity);
    const rows = await db
      .select()
      .from(sourceRegistry)
      .where(and(eq(sourceRegistry.citySlug, normalizedCity), eq(sourceRegistry.active, true)))
      .orderBy(sourceRegistry.cadence, sourceRegistry.sourceUrl);

    const entries = rows.map(toSourceRegistryEntry);
    const summary = summarizeRegistry(entries);

    return {
      citySlug: normalizedCity,
      totalSources: entries.length,
      byCadence: summary.byCadence,
      byPurpose: summary.byPurpose,
      entries,
      mode: 'database'
    };
  }

  const entries = getSeedSourceRegistry(normalizedCity).filter((entry) => entry.active);
  const summary = summarizeRegistry(entries);
  return {
    citySlug: normalizedCity,
    totalSources: entries.length,
    byCadence: summary.byCadence,
    byPurpose: summary.byPurpose,
    entries,
    mode: 'seed'
  };
};

export const listDiscoveryLeadSummaries = async (citySlug: string, limit = 300): Promise<DiscoveryLeadSummary[]> => {
  const normalizedCity = toLowerSafe(citySlug);
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(discoveryLeads)
    .where(eq(discoveryLeads.citySlug, normalizedCity))
    .orderBy(desc(discoveryLeads.lastSeenAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    citySlug: row.citySlug,
    sourceUrl: row.sourceUrl,
    title: row.title,
    snippet: row.snippet ?? undefined,
    discoveredFromUrl: row.discoveredFromUrl,
    status: row.status,
    confidence: parseNumber(row.confidence),
    tags: row.tags,
    lastSeenAt: row.lastSeenAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  }));
};
