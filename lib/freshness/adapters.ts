import { createHash } from 'node:crypto';

export type ParsedSessionSignal = {
  title: string;
  weekday: string;
  startTime: string;
  endTime: string | null;
  confidence: 'high' | 'medium';
  signature: string;
};

export type AdapterAutoReverifyThresholds = {
  minSignals: number;
  minMatches: number;
  minMatchRatio: number;
};

export type AdapterAutoReverifyEvaluation = {
  accepted: boolean;
  reason: 'accepted' | 'insufficient_signals' | 'insufficient_matches' | 'low_match_ratio';
  parsedSignals: number;
  matchedSignals: number;
  matchRatio: number;
  thresholds: AdapterAutoReverifyThresholds;
};

type SourceAdapter = {
  id: string;
  matches: (sourceUrl: string) => boolean;
  parse: (html: string) => ParsedSessionSignal[];
  thresholds: AdapterAutoReverifyThresholds;
};

const htmlEntityMap: Record<string, string> = {
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&#8211;': '-',
  '&#8212;': '-',
  '&#8217;': "'",
  '&#8220;': '"',
  '&#8221;': '"',
  '&#8242;': "'",
  '&#8243;': '"',
  '&#8230;': '...',
  '&agrave;': 'a',
  '&Agrave;': 'A',
  '&egrave;': 'e',
  '&Egrave;': 'E',
  '&igrave;': 'i',
  '&Igrave;': 'I',
  '&ograve;': 'o',
  '&Ograve;': 'O',
  '&ugrave;': 'u',
  '&Ugrave;': 'U',
  '&euro;': 'EUR'
};

const decodeHtml = (value: string) => {
  let output = value;
  for (const [key, replacement] of Object.entries(htmlEntityMap)) {
    output = output.split(key).join(replacement);
  }
  output = output.replace(/&#(\d+);/g, (_raw, code) => {
    const numeric = Number(code);
    return Number.isFinite(numeric) ? String.fromCharCode(numeric) : '';
  });
  return output;
};

const normalizeText = (value: string) =>
  decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripAccents = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const canonicalLower = (value: string) => stripAccents(value).toLowerCase().trim();

const normalizeTime = (raw: string) => {
  const match = canonicalLower(raw).match(/([0-2]?\d)\s*[:.,h]\s*([0-5]\d)/);
  if (!match) return null;
  const hours = String(Number(match[1])).padStart(2, '0');
  const minutes = match[2];
  return `${hours}:${minutes}`;
};

const extractTimes = (value: string) => {
  const matches = value.match(/([0-2]?\d)\s*[:.,h]\s*([0-5]\d)/g) ?? [];
  return matches
    .map((chunk) => normalizeTime(chunk))
    .filter((item): item is string => Boolean(item));
};

const weekdayAliases: Record<string, string> = {
  lun: 'Monday',
  lunedi: 'Monday',
  monday: 'Monday',
  mar: 'Tuesday',
  martedi: 'Tuesday',
  tuesday: 'Tuesday',
  mer: 'Wednesday',
  mercoledi: 'Wednesday',
  wednesday: 'Wednesday',
  gio: 'Thursday',
  giovedi: 'Thursday',
  thursday: 'Thursday',
  ven: 'Friday',
  venerdi: 'Friday',
  friday: 'Friday',
  sab: 'Saturday',
  sabato: 'Saturday',
  saturday: 'Saturday',
  dom: 'Sunday',
  domenica: 'Sunday',
  sunday: 'Sunday'
};

const normalizeWeekday = (raw: string) => {
  const key = canonicalLower(raw).replace(/[^a-z]/g, '');
  return weekdayAliases[key] ?? null;
};

const stripScriptsAndStyles = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

const buildSignature = (title: string, weekday: string, startTime: string, endTime: string | null) =>
  createHash('sha256')
    .update(`${canonicalLower(title)}|${weekday}|${startTime}|${endTime ?? ''}`)
    .digest('hex')
    .slice(0, 24);

const pushSignal = (
  out: ParsedSessionSignal[],
  payload: Omit<ParsedSessionSignal, 'signature'>
) => {
  out.push({
    ...payload,
    signature: buildSignature(payload.title, payload.weekday, payload.startTime, payload.endTime)
  });
};

const dedupeSignals = (signals: ParsedSessionSignal[]) => {
  const dedup = new Map<string, ParsedSessionSignal>();
  for (const signal of signals) {
    dedup.set(signal.signature, signal);
  }
  return Array.from(dedup.values());
};

const parseRishiTable = (html: string): ParsedSessionSignal[] => {
  const signals: ParsedSessionSignal[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      const text = normalizeText(cellMatch[1]);
      cells.push(text);
    }

    if (cells.length < 6) continue;

    const title = cells[0];
    const titleKey = canonicalLower(title);
    if (!title || titleKey.includes('corso') || titleKey.includes('sessione') || titleKey.includes('legenda')) continue;

    for (let i = 1; i <= 5; i += 1) {
      const cell = cells[i];
      const normalized = canonicalLower(cell);
      if (!cell || normalized === '-' || normalized === '–') continue;

      const times = extractTimes(cell);
      if (times.length === 0) continue;

      const startTime = times[0];
      const endTime = times[1] ?? null;
      pushSignal(signals, {
        title,
        weekday: days[i - 1],
        startTime,
        endTime,
        confidence: 'high'
      });
    }
  }

  return dedupeSignals(signals);
};

const parseTaijiHomepage = (html: string): ParsedSessionSignal[] => {
  const text = canonicalLower(normalizeText(html));
  const signals: ParsedSessionSignal[] = [];

  const mainLine = text.match(
    /lunedi\s*,?\s*mercoledi\s*e\s*venerdi\s*h?\s*([0-2]?\d[,:.][0-5]\d)\s*e\s*([0-2]?\d[,:.][0-5]\d)\s*oppure\s*lunedi\s*e\s*venerdi\s*h?\s*([0-2]?\d[,:.][0-5]\d)/
  );
  if (mainLine) {
    const primaryA = normalizeTime(mainLine[1]);
    const primaryB = normalizeTime(mainLine[2]);
    const secondary = normalizeTime(mainLine[3]);
    const primaryDays = ['Monday', 'Wednesday', 'Friday'] as const;
    const secondaryDays = ['Monday', 'Friday'] as const;

    if (primaryA) {
      for (const day of primaryDays) {
        pushSignal(signals, {
          title: 'Taijiquan',
          weekday: day,
          startTime: primaryA,
          endTime: null,
          confidence: 'high'
        });
      }
    }

    if (primaryB) {
      for (const day of primaryDays) {
        pushSignal(signals, {
          title: 'Taijiquan',
          weekday: day,
          startTime: primaryB,
          endTime: null,
          confidence: 'high'
        });
      }
    }

    if (secondary) {
      for (const day of secondaryDays) {
        pushSignal(signals, {
          title: 'Taijiquan',
          weekday: day,
          startTime: secondary,
          endTime: null,
          confidence: 'high'
        });
      }
    }
  }

  const villaMatch = text.match(/villa trabia\s*[^\n]{0,80}sabato\s*h?\s*([0-2]?\d[,:.][0-5]\d)/);
  const villaTime = villaMatch ? normalizeTime(villaMatch[1]) : null;
  if (villaTime) {
    pushSignal(signals, {
      title: 'Qi Gong',
      weekday: 'Saturday',
      startTime: villaTime,
      endTime: null,
      confidence: 'high'
    });
  }

  const studioQiMatch = text.match(/taiji studio\s*[^\n]{0,140}lunedi\s*e\s*venerdi\s*([0-2]?\d[,:.][0-5]\d)/);
  const studioQiTime = studioQiMatch ? normalizeTime(studioQiMatch[1]) : null;
  if (studioQiTime) {
    for (const day of ['Monday', 'Friday'] as const) {
      pushSignal(signals, {
        title: 'Qi Gong',
        weekday: day,
        startTime: studioQiTime,
        endTime: null,
        confidence: 'high'
      });
    }
  }

  return dedupeSignals(signals);
};

const extractTextBlocks = (html: string) => {
  const cleaned = stripScriptsAndStyles(html);
  const blocks: string[] = [];
  const blockRegex = /<(?:p|h[1-6]|li)[^>]*>([\s\S]*?)<\/(?:p|h[1-6]|li)>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleaned)) !== null) {
    const text = normalizeText(match[1]);
    if (text) blocks.push(text);
  }

  return blocks;
};

const extractScriptContentById = (html: string, scriptId: string) => {
  const escapedId = scriptId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const scriptRegex = new RegExp(`<script[^>]*id=["']${escapedId}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
  const match = html.match(scriptRegex);
  return match?.[1] ?? null;
};

const stripInstructorSuffix = (title: string) =>
  title.replace(/\s+con\s+[a-zA-Z\u00C0-\u017F.'\s-]+$/i, '').trim();

const parseBarbaraScheduleBlocks = (blocks: string[]) => {
  const signals: ParsedSessionSignal[] = [];
  let currentWeekday: string | null = null;

  for (const block of blocks) {
    const text = normalizeText(block);
    if (!text) continue;

    const maybeWeekday = normalizeWeekday(text);
    if (maybeWeekday) {
      currentWeekday = maybeWeekday;
      continue;
    }

    const marker = canonicalLower(text);
    if (
      marker.includes('nuovo corso') ||
      marker.includes('lo staff') ||
      marker.includes('iscriviti') ||
      marker.includes('benefici')
    ) {
      currentWeekday = null;
      continue;
    }

    if (!currentWeekday) continue;

    const lineMatch = text.match(
      /^([0-2]?\d\s*[:.,h]\s*[0-5]\d)(?:\s*[-–]\s*([0-2]?\d\s*[:.,h]\s*[0-5]\d))?\s*(.+)$/i
    );
    if (!lineMatch) continue;

    const startTime = normalizeTime(lineMatch[1]);
    const endTime = lineMatch[2] ? normalizeTime(lineMatch[2]) : null;
    if (!startTime) continue;

    const rawTitle = lineMatch[3].replace(/\s+/g, ' ').trim();
    if (!rawTitle) continue;

    const title = stripInstructorSuffix(rawTitle) || rawTitle;
    pushSignal(signals, {
      title,
      weekday: currentWeekday,
      startTime,
      endTime,
      confidence: 'high'
    });
  }

  return dedupeSignals(signals);
};

const parseBarbaraWixSchedule = (html: string): ParsedSessionSignal[] => {
  const parsedFromMarkup = parseBarbaraScheduleBlocks(extractTextBlocks(html));
  if (parsedFromMarkup.length > 0) return parsedFromMarkup;

  const warmupData = extractScriptContentById(html, 'wix-warmup-data');
  if (!warmupData) return [];

  const warmupText = normalizeText(warmupData);
  if (!warmupText) return [];

  const splitByDay = warmupText
    .replace(/\b(luned\w*|marted\w*|mercoled\w*|gioved\w*|venerd\w*|sabato|domenica)\b/gi, '\n$1\n')
    .split('\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return parseBarbaraScheduleBlocks(splitByDay);
};

const normalizeThresholds = (thresholds: AdapterAutoReverifyThresholds): AdapterAutoReverifyThresholds => ({
  minSignals: Math.max(1, Math.floor(thresholds.minSignals)),
  minMatches: Math.max(1, Math.floor(thresholds.minMatches)),
  minMatchRatio: Math.min(1, Math.max(0, thresholds.minMatchRatio))
});

export const evaluateAdapterAutoReverify = (
  thresholds: AdapterAutoReverifyThresholds,
  parsedSignals: number,
  matchedSignals: number
): AdapterAutoReverifyEvaluation => {
  const safeThresholds = normalizeThresholds(thresholds);
  const safeParsedSignals = Math.max(0, Math.floor(parsedSignals));
  const safeMatchedSignals = Math.max(0, Math.floor(matchedSignals));
  const matchRatio = safeParsedSignals > 0 ? safeMatchedSignals / safeParsedSignals : 0;

  if (safeParsedSignals < safeThresholds.minSignals) {
    return {
      accepted: false,
      reason: 'insufficient_signals',
      parsedSignals: safeParsedSignals,
      matchedSignals: safeMatchedSignals,
      matchRatio,
      thresholds: safeThresholds
    };
  }

  if (safeMatchedSignals < safeThresholds.minMatches) {
    return {
      accepted: false,
      reason: 'insufficient_matches',
      parsedSignals: safeParsedSignals,
      matchedSignals: safeMatchedSignals,
      matchRatio,
      thresholds: safeThresholds
    };
  }

  if (matchRatio < safeThresholds.minMatchRatio) {
    return {
      accepted: false,
      reason: 'low_match_ratio',
      parsedSignals: safeParsedSignals,
      matchedSignals: safeMatchedSignals,
      matchRatio,
      thresholds: safeThresholds
    };
  }

  return {
    accepted: true,
    reason: 'accepted',
    parsedSignals: safeParsedSignals,
    matchedSignals: safeMatchedSignals,
    matchRatio,
    thresholds: safeThresholds
  };
};

const adapters: SourceAdapter[] = [
  {
    id: 'rishi-corsi',
    matches: (sourceUrl) => canonicalLower(sourceUrl).includes('centroculturarishi.it/corsi'),
    parse: parseRishiTable,
    thresholds: {
      minSignals: 6,
      minMatches: 4,
      minMatchRatio: 0.3
    }
  },
  {
    id: 'taiji-home',
    matches: (sourceUrl) => canonicalLower(sourceUrl).includes('taijistudiopalermo.it'),
    parse: parseTaijiHomepage,
    thresholds: {
      minSignals: 4,
      minMatches: 2,
      minMatchRatio: 0.25
    }
  },
  {
    id: 'barbara-wix',
    matches: (sourceUrl) => canonicalLower(sourceUrl).includes('barbarafaludiyoga.com/corsi-in-studio'),
    parse: parseBarbaraWixSchedule,
    thresholds: {
      minSignals: 12,
      minMatches: 8,
      minMatchRatio: 0.5
    }
  }
];

export const getAdapterForSource = (sourceUrl: string) =>
  adapters.find((adapter) => adapter.matches(sourceUrl)) ?? null;

export const parseSourceWithAdapter = (sourceUrl: string, html: string) => {
  const adapter = getAdapterForSource(sourceUrl);
  if (!adapter) {
    return {
      adapterId: null,
      thresholds: null as AdapterAutoReverifyThresholds | null,
      sessions: [] as ParsedSessionSignal[]
    };
  }

  return {
    adapterId: adapter.id,
    thresholds: adapter.thresholds,
    sessions: adapter.parse(html)
  };
};

export const buildSessionTimeSignature = (weekday: string, startTime: string) =>
  `${weekday}|${startTime}`;

export const normalizeWeekdayForSignals = (raw: string) => normalizeWeekday(raw);
