import { createHash } from 'node:crypto';

import { DateTime } from 'luxon';

import { sessions as seedSessions, venues as seedVenues } from '@/lib/catalog/seed';
import type {
  AttendanceModel,
  KidsAgeBand,
  Level,
  LocalizedText,
  Session,
  SessionAudience,
  SessionFormat
} from '@/lib/catalog/types';

export type SourceEventCandidatePayload = Session & {
  confidence: number;
  detectedText: string;
};

type SourceEventDefaults = {
  citySlug: string;
  venueSlug: string;
  instructorSlug: string;
  categorySlug: string;
  styleSlug: string;
  bookingTargetSlug: string;
  level: Level;
  language: string;
  format: SessionFormat;
  audience: SessionAudience;
  attendanceModel: AttendanceModel;
  durationMinutes: number;
  ageMin?: number;
  ageMax?: number;
  ageBand?: KidsAgeBand;
  guardianRequired?: boolean;
  title: LocalizedText;
  keywords: string[];
};

type SourceEventOverride = Partial<Omit<SourceEventDefaults, 'citySlug' | 'venueSlug' | 'instructorSlug' | 'categorySlug' | 'styleSlug' | 'bookingTargetSlug' | 'level' | 'language' | 'format' | 'audience' | 'attendanceModel' | 'title'>> & {
  title?: LocalizedText;
  keywords?: string[];
  bookingTargetSlug?: string;
};

const monthMap: Record<string, number> = {
  january: 1,
  jan: 1,
  gennaio: 1,
  february: 2,
  feb: 2,
  febbraio: 2,
  march: 3,
  mar: 3,
  marzo: 3,
  april: 4,
  apr: 4,
  aprile: 4,
  may: 5,
  maggio: 5,
  june: 6,
  jun: 6,
  giugno: 6,
  july: 7,
  jul: 7,
  luglio: 7,
  august: 8,
  aug: 8,
  agosto: 8,
  september: 9,
  sep: 9,
  settembre: 9,
  october: 10,
  oct: 10,
  ottobre: 10,
  november: 11,
  nov: 11,
  novembre: 11,
  december: 12,
  dec: 12,
  dicembre: 12
};

const sourceEventOverrides: Record<string, SourceEventOverride> = {
  'https://www.facebook.com/spazioterrapalermo': {
    bookingTargetSlug: 'spazio-terra-facebook',
    durationMinutes: 60,
    title: {
      it: 'Yoga bimbi in volo',
      en: 'Kids aerial yoga'
    },
    keywords: ['yoga bimbi', 'bimbi', 'in volo', 'yoga in volo', 'bambini']
  }
};

const normalizeSourceUrl = (raw: string) => {
  try {
    const url = new URL(raw.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return raw.trim();
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw.trim().replace(/\/$/, '');
  }
};

const stripAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const canonicalText = (value: string) =>
  stripAccents(value)
    .toLowerCase()
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, '\n')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const searchText = (value: string) =>
  canonicalText(value)
    .replace(/[^a-z0-9\s/:.-]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractLines = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, '\n')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\n+/)
    .map((line) => stripAccents(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const normalizeTime = (raw: string) => {
  const match = raw.match(/([0-2]?\d)\s*[:.,h]\s*([0-5]\d)/i);
  if (!match) return null;
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
};

const parseDateFromChunk = (raw: string, reference: DateTime) => {
  const text = canonicalText(raw);
  const monthMatch = text.match(/(\d{1,2})\s+(january|jan|gennaio|february|feb|febbraio|march|mar|marzo|april|apr|aprile|may|maggio|june|jun|giugno|july|jul|luglio|august|aug|agosto|september|sep|settembre|october|oct|ottobre|november|nov|novembre|december|dec|dicembre)(?:\s+(\d{4}))?/i);
  if (monthMatch) {
    const day = Number(monthMatch[1]);
    const month = monthMap[monthMatch[2]];
    const explicitYear = monthMatch[3] ? Number(monthMatch[3]) : null;
    const year = explicitYear ?? reference.year;
    let candidate = DateTime.fromObject({ year, month, day }, { zone: 'Europe/Rome' });
    if (!explicitYear && candidate < reference.minus({ days: 45 })) {
      candidate = candidate.plus({ years: 1 });
    }
    return candidate.isValid ? candidate : null;
  }

  const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const explicitYear = slashMatch[3] ? Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]) : null;
    const year = explicitYear ?? reference.year;
    let candidate = DateTime.fromObject({ year, month, day }, { zone: 'Europe/Rome' });
    if (!explicitYear && candidate < reference.minus({ days: 45 })) {
      candidate = candidate.plus({ years: 1 });
    }
    return candidate.isValid ? candidate : null;
  }

  return null;
};

const parseTimeRange = (raw: string, fallbackMinutes: number) => {
  const match = raw.match(/([0-2]?\d\s*[:.,h]\s*[0-5]\d)(?:\s*(?:-|–|a|to)\s*([0-2]?\d\s*[:.,h]\s*[0-5]\d))?/i);
  const start = match ? normalizeTime(match[1]) : null;
  if (!start) return null;
  const end = match?.[2] ? normalizeTime(match[2]) : null;
  const startDate = DateTime.fromFormat(start, 'HH:mm', { zone: 'Europe/Rome' });
  const endDate = end ? DateTime.fromFormat(end, 'HH:mm', { zone: 'Europe/Rome' }) : startDate.plus({ minutes: fallbackMinutes });
  return {
    start,
    end: endDate.toFormat('HH:mm')
  };
};

const buildCandidateId = (sourceUrl: string, startAt: string, title: LocalizedText) =>
  `oneoff-${createHash('sha256').update(`${normalizeSourceUrl(sourceUrl)}|${startAt}|${canonicalText(title.it)}`).digest('hex').slice(0, 18)}`;

const hasKeyword = (text: string, keywords: string[]) => {
  const normalized = searchText(text);
  return keywords.some((keyword) => normalized.includes(searchText(keyword)));
};

const uniqueStrings = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const buildSeedKeywords = (title: LocalizedText, audience: SessionAudience, venueName: string) => {
  const keywords = [title.it, title.en, venueName];

  if (audience === 'kids') {
    keywords.push('bimbi', 'bambini', 'kids', 'laboratorio bambini');
  }

  const normalizedTitle = searchText(`${title.it} ${title.en}`);
  if (normalizedTitle.includes('volo') || normalizedTitle.includes('aerial')) {
    keywords.push('in volo', 'aerial');
  }

  return uniqueStrings(keywords);
};

const sourceEventDefaults = new Map<string, SourceEventDefaults>();

for (const [rawSourceUrl, override] of Object.entries(sourceEventOverrides)) {
  const sourceUrl = normalizeSourceUrl(rawSourceUrl);
  if (!sourceUrl) continue;

  const matchingSession = seedSessions.find((session) => normalizeSourceUrl(session.sourceUrl) === sourceUrl);
  if (!matchingSession) continue;

  const venue = seedVenues.find((entry) => entry.slug === matchingSession.venueSlug);
  const start = DateTime.fromISO(matchingSession.startAt, { zone: 'Europe/Rome' });
  const end = DateTime.fromISO(matchingSession.endAt, { zone: 'Europe/Rome' });
  const durationMinutes =
    override.durationMinutes ??
    (start.isValid && end.isValid ? Math.max(30, Math.round(end.diff(start, 'minutes').minutes)) : 60);

  sourceEventDefaults.set(sourceUrl, {
    citySlug: matchingSession.citySlug,
    venueSlug: matchingSession.venueSlug,
    instructorSlug: matchingSession.instructorSlug,
    categorySlug: matchingSession.categorySlug,
    styleSlug: matchingSession.styleSlug,
    bookingTargetSlug: override.bookingTargetSlug ?? matchingSession.bookingTargetSlug,
    level: matchingSession.level,
    language: matchingSession.language,
    format: matchingSession.format,
    audience: matchingSession.audience,
    attendanceModel: matchingSession.attendanceModel,
    durationMinutes,
    ageMin: override.ageMin ?? matchingSession.ageMin,
    ageMax: override.ageMax ?? matchingSession.ageMax,
    ageBand: override.ageBand ?? matchingSession.ageBand,
    guardianRequired: override.guardianRequired ?? matchingSession.guardianRequired,
    title: override.title ?? matchingSession.title,
    keywords: uniqueStrings(override.keywords ?? buildSeedKeywords(override.title ?? matchingSession.title, matchingSession.audience, venue?.name ?? ''))
  });
}

export const extractSourceEventCandidates = (sourceUrl: string, html: string, referenceIso = new Date().toISOString()): SourceEventCandidatePayload[] => {
  const defaults = sourceEventDefaults.get(normalizeSourceUrl(sourceUrl));
  if (!defaults) return [];

  const reference = DateTime.fromISO(referenceIso, { zone: 'Europe/Rome' });
  const lines = extractLines(html);
  const candidates = new Map<string, SourceEventCandidatePayload>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const windowText = [lines[index - 1], line, lines[index + 1], lines[index + 2]].filter(Boolean).join(' ');
    if (!hasKeyword(windowText, defaults.keywords)) continue;

    const date = parseDateFromChunk(windowText, reference);
    const timeRange = parseTimeRange(windowText, defaults.durationMinutes);
    if (!date || !timeRange) continue;

    const startAt = date.set({
      hour: Number(timeRange.start.slice(0, 2)),
      minute: Number(timeRange.start.slice(3, 5)),
      second: 0,
      millisecond: 0
    });
    const endAt = date.set({
      hour: Number(timeRange.end.slice(0, 2)),
      minute: Number(timeRange.end.slice(3, 5)),
      second: 0,
      millisecond: 0
    });

    const titleLine = /yoga bimbi|in volo/i.test(windowText) ? defaults.title : defaults.title;
    const sessionId = buildCandidateId(sourceUrl, startAt.toISO() ?? startAt.toString(), titleLine);

    candidates.set(sessionId, {
      id: sessionId,
      citySlug: defaults.citySlug,
      venueSlug: defaults.venueSlug,
      instructorSlug: defaults.instructorSlug,
      categorySlug: defaults.categorySlug,
      styleSlug: defaults.styleSlug,
      title: titleLine,
      startAt: startAt.toISO() ?? '',
      endAt: endAt.toISO() ?? '',
      level: defaults.level,
      language: defaults.language,
      format: defaults.format,
      bookingTargetSlug: defaults.bookingTargetSlug,
      sourceUrl,
      lastVerifiedAt: reference.toISO() ?? new Date().toISOString(),
      verificationStatus: 'verified',
      audience: defaults.audience,
      attendanceModel: defaults.attendanceModel,
      ageMin: defaults.ageMin,
      ageMax: defaults.ageMax,
      ageBand: defaults.ageBand,
      guardianRequired: defaults.guardianRequired,
      confidence: 0.88,
      detectedText: windowText
    });
  }

  return Array.from(candidates.values()).filter((candidate) => Boolean(candidate.startAt && candidate.endAt));
};

export const mapSourceEventCandidateToSession = (payload: SourceEventCandidatePayload): Session => ({
  id: payload.id,
  citySlug: payload.citySlug,
  venueSlug: payload.venueSlug,
  instructorSlug: payload.instructorSlug,
  categorySlug: payload.categorySlug,
  styleSlug: payload.styleSlug,
  title: payload.title,
  startAt: payload.startAt,
  endAt: payload.endAt,
  level: payload.level,
  language: payload.language,
  format: payload.format,
  bookingTargetSlug: payload.bookingTargetSlug,
  sourceUrl: payload.sourceUrl,
  lastVerifiedAt: payload.lastVerifiedAt,
  verificationStatus: payload.verificationStatus,
  audience: payload.audience,
  attendanceModel: payload.attendanceModel,
  ageMin: payload.ageMin,
  ageMax: payload.ageMax,
  ageBand: payload.ageBand,
  guardianRequired: payload.guardianRequired,
  priceNote: undefined
});
