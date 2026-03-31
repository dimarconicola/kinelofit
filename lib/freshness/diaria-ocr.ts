import { execFile } from 'node:child_process';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { promisify } from 'node:util';

import type { ParsedSessionSignal } from '@/lib/freshness/adapters';

const execFileAsync = promisify(execFile);

type DiariaSignalSpec = {
  title: string;
  weekdays: string[];
  startTime: string;
  endTime: string | null;
  confidence: 'high' | 'medium';
  patterns: RegExp[];
};

const stripAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeMatcherText = (value: string) =>
  stripAccents(value)
    .toLowerCase()
    .replace(/([0-2]?\d)\s*[.,h]\s*([0-5]\d)/g, (_raw, hours, minutes) => `${Number(hours)}:${minutes}`)
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[^a-z0-9:\-\s/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const countMatches = (text: string, patterns: RegExp[]) =>
  patterns.reduce((maxCount, pattern) => {
    const matches = text.match(pattern);
    return Math.max(maxCount, matches?.length ?? 0);
  }, 0);

const buildSignature = (title: string, weekday: string, startTime: string, endTime: string | null) =>
  `${stripAccents(title).toLowerCase()}|${weekday}|${startTime}|${endTime ?? ''}`;

const buildMatcher = (...parts: string[]) => new RegExp(parts.join('[\\s\\S]{0,80}?'), 'g');

const diariaSignalSpecs: DiariaSignalSpec[] = [
  {
    title: 'Microworkout Pilates',
    weekdays: ['Monday'],
    startTime: '08:30',
    endTime: '09:15',
    confidence: 'high',
    patterns: [buildMatcher('microworkout', 'maja', '8:30', 'studio gagini')]
  },
  {
    title: 'Hatha Yoga',
    weekdays: ['Wednesday'],
    startTime: '08:30',
    endTime: '09:30',
    confidence: 'high',
    patterns: [buildMatcher('hatha\\s+yoga', 'federica', '8:30', 'studio gagini')]
  },
  {
    title: 'Hatha Yoga',
    weekdays: ['Monday', 'Friday'],
    startTime: '09:00',
    endTime: '10:00',
    confidence: 'high',
    patterns: [buildMatcher('hatha\\s+yoga', 'federica', '9:00', 'studio gagini')]
  },
  {
    title: 'Pilates Attrezzi',
    weekdays: ['Tuesday'],
    startTime: '09:00',
    endTime: '10:00',
    confidence: 'high',
    patterns: [buildMatcher('pilates', 'emilia', '9:00', 'studio gagini')]
  },
  {
    title: 'Gyrokinesis',
    weekdays: ['Wednesday', 'Friday'],
    startTime: '09:00',
    endTime: '10:00',
    confidence: 'high',
    patterns: [buildMatcher('gyrokinesis', 'alessandra', '9:00', 'sala venezia')]
  },
  {
    title: 'Tai Chi - Qi Gong',
    weekdays: ['Tuesday', 'Thursday'],
    startTime: '09:30',
    endTime: '10:30',
    confidence: 'high',
    patterns: [buildMatcher('tai\\s+chi', '(?:qi|21)\\s+gong', 'laura', '9:30', 'sala venezia')]
  },
  {
    title: 'Feldenkrais',
    weekdays: ['Wednesday', 'Friday'],
    startTime: '10:00',
    endTime: '11:00',
    confidence: 'high',
    patterns: [buildMatcher('feldenkrais', 'alessandra', '10:00', 'sala venezia')]
  },
  {
    title: 'Pilates Muro',
    weekdays: ['Wednesday'],
    startTime: '10:30',
    endTime: '11:30',
    confidence: 'high',
    patterns: [buildMatcher('pilates\\s+muro', 'federica', '10:30', 'studio gagini')]
  },
  {
    title: 'Pilates / Yoga',
    weekdays: ['Saturday'],
    startTime: '10:30',
    endTime: '11:30',
    confidence: 'medium',
    patterns: [buildMatcher('pilates\\s*/?\\s*yoga', '10:30', 'studio gagini')]
  },
  {
    title: 'Soft Pilates and Senior Dance',
    weekdays: ['Tuesday', 'Friday'],
    startTime: '11:00',
    endTime: '12:00',
    confidence: 'high',
    patterns: [buildMatcher('soft\\s+pilates', 'danza\\s+senior', 'emilia', '11:00', 'sala venezia')]
  },
  {
    title: 'Pilates Barre',
    weekdays: ['Monday'],
    startTime: '13:30',
    endTime: '14:30',
    confidence: 'high',
    patterns: [buildMatcher('pilates\\s+barre', 'federica', '13:30')]
  },
  {
    title: 'Pilates Attrezzi',
    weekdays: ['Wednesday'],
    startTime: '13:30',
    endTime: '14:30',
    confidence: 'high',
    patterns: [buildMatcher('attrezzi', 'emilia', '13:30', 'studio gagini')]
  },
  {
    title: 'Pilates Cardiodinamico',
    weekdays: ['Friday'],
    startTime: '13:30',
    endTime: '14:30',
    confidence: 'high',
    patterns: [buildMatcher('cardiodinamico', 'maja', '13:30', 'studio gagini')]
  },
  {
    title: 'Microworkout Core Stability',
    weekdays: ['Tuesday'],
    startTime: '14:30',
    endTime: '15:15',
    confidence: 'medium',
    patterns: [buildMatcher('microworkout', 'coree|core', 'federica', '14:30')]
  },
  {
    title: 'Microworkout Linfodrenante',
    weekdays: ['Thursday'],
    startTime: '14:30',
    endTime: '15:15',
    confidence: 'high',
    patterns: [buildMatcher('microworkout', 'linfodrenante', 'emilia', '14:30')]
  },
  {
    title: 'Pilates',
    weekdays: ['Monday'],
    startTime: '17:00',
    endTime: '18:00',
    confidence: 'high',
    patterns: [buildMatcher('pilates', 'federica', '17:00', 'studio gagini')]
  },
  {
    title: 'Pilates',
    weekdays: ['Wednesday'],
    startTime: '17:00',
    endTime: '18:00',
    confidence: 'high',
    patterns: [buildMatcher('pilates', 'maja', '17:00', 'studio gagini')]
  },
  {
    title: 'Pilates Barre',
    weekdays: ['Friday'],
    startTime: '17:00',
    endTime: '18:00',
    confidence: 'high',
    patterns: [buildMatcher('pilates\\s+barre', 'federica', '17:00', 'studio gagini')]
  },
  {
    title: 'Feldenkrais',
    weekdays: ['Tuesday', 'Thursday'],
    startTime: '18:00',
    endTime: '19:00',
    confidence: 'high',
    patterns: [buildMatcher('feldenkrais', 'alessandra', '18:00', 'sala venezia')]
  },
  {
    title: 'Functional Training',
    weekdays: ['Tuesday', 'Thursday'],
    startTime: '18:00',
    endTime: '19:00',
    confidence: 'high',
    patterns: [buildMatcher('functional', 'training', 'giuseppe', '18:00', 'studio gagini')]
  },
  {
    title: 'Pilates Cardiodinamico',
    weekdays: ['Tuesday'],
    startTime: '18:00',
    endTime: '19:00',
    confidence: 'high',
    patterns: [buildMatcher('cardiodinamico', 'emilia', '18:00', 'studio gagini')]
  },
  {
    title: 'Pilates',
    weekdays: ['Thursday'],
    startTime: '18:00',
    endTime: '19:00',
    confidence: 'high',
    patterns: [buildMatcher('pilates', 'federica', '18:00', 'studio gagini')]
  },
  {
    title: 'Rumba Flamenca',
    weekdays: ['Wednesday'],
    startTime: '18:15',
    endTime: '19:30',
    confidence: 'high',
    patterns: [buildMatcher('rumba', 'flamenca', 'soad', '18:15', 'sala venezia')]
  },
  {
    title: 'Vinyasa Yoga',
    weekdays: ['Monday', 'Friday'],
    startTime: '18:15',
    endTime: '19:15',
    confidence: 'high',
    patterns: [buildMatcher('vinyasa\\s+yoga', 'ceren', '18:15', 'sala venezia')]
  },
  {
    title: 'Pilates Attrezzi',
    weekdays: ['Monday'],
    startTime: '18:30',
    endTime: '19:30',
    confidence: 'high',
    patterns: [buildMatcher('attrezzi', 'emilia', '18:30', 'studio gagini')]
  },
  {
    title: 'Pilates Flow',
    weekdays: ['Wednesday'],
    startTime: '18:30',
    endTime: '19:30',
    confidence: 'medium',
    patterns: [
      buildMatcher('pilates\\s*flow|pilatesflow', 'emilia', '18:30', 'studio gagini'),
      buildMatcher('emilia', '18:30', 'studio gagini')
    ]
  },
  {
    title: 'Adult Capoeira',
    weekdays: ['Tuesday', 'Thursday'],
    startTime: '19:00',
    endTime: '20:00',
    confidence: 'medium',
    patterns: [buildMatcher('capoeira', 'ceroda', '19:00', 'sala venezia')]
  },
  {
    title: 'Functional Training',
    weekdays: ['Monday', 'Thursday'],
    startTime: '19:15',
    endTime: '20:15',
    confidence: 'high',
    patterns: [buildMatcher('functional', 'training', 'giuseppe', '19:15', 'studio gagini')]
  },
  {
    title: 'Pilates',
    weekdays: ['Tuesday'],
    startTime: '19:15',
    endTime: '20:15',
    confidence: 'high',
    patterns: [buildMatcher('pilates', 'emilia', '19:15', 'studio gagini')]
  },
  {
    title: 'Pilates Attrezzi',
    weekdays: ['Thursday'],
    startTime: '19:15',
    endTime: '20:15',
    confidence: 'high',
    patterns: [buildMatcher('attrezzi', 'federica', '19:15', 'studio gagini')]
  },
  {
    title: 'Adult Dance',
    weekdays: ['Monday', 'Wednesday'],
    startTime: '19:40',
    endTime: '21:10',
    confidence: 'high',
    patterns: [buildMatcher('danza\\s+adult', 'carlotta', '19:40', 'studio gagini')]
  },
  {
    title: 'Ashtanga Yoga',
    weekdays: ['Monday', 'Wednesday'],
    startTime: '19:30',
    endTime: '20:30',
    confidence: 'high',
    patterns: [buildMatcher('ashtanga\\s+yoga', 'maria\\s+laura', '19:30', 'sala venezia')]
  },
  {
    title: 'Adult Theater',
    weekdays: ['Wednesday'],
    startTime: '20:30',
    endTime: '22:00',
    confidence: 'medium',
    patterns: [buildMatcher('teatro\\s+adult', 'maria\\s+laura', '20:30')]
  }
];

const dedupeSignals = (signals: ParsedSessionSignal[]) => {
  const map = new Map<string, ParsedSessionSignal>();
  for (const signal of signals) {
    map.set(buildSignature(signal.title, signal.weekday, signal.startTime, signal.endTime), signal);
  }
  return Array.from(map.values());
};

export const matchDiariaSignalsFromOcrText = (texts: string[]) => {
  const combined = normalizeMatcherText(texts.join('\n'));
  if (!combined) return [] as ParsedSessionSignal[];

  const signals: ParsedSessionSignal[] = [];
  for (const spec of diariaSignalSpecs) {
    const matchedDays = Math.min(spec.weekdays.length, countMatches(combined, spec.patterns));
    for (let index = 0; index < matchedDays; index += 1) {
      signals.push({
        title: spec.title,
        weekday: spec.weekdays[index],
        startTime: spec.startTime,
        endTime: spec.endTime,
        confidence: spec.confidence,
        signature: buildSignature(spec.title, spec.weekdays[index], spec.startTime, spec.endTime)
      });
    }
  }

  return dedupeSignals(signals);
};

export const extractDiariaCalendarImageUrls = (html: string) => {
  const urls = new Set<string>();
  const pattern = /(https?:\/\/www\.diariapalermo\.org\/[^"'\s>]+?\.(?:png|jpe?g|webp))/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const url = match[1];
    if (!/calendario|adult|bambin|yoga|pilates/i.test(url)) continue;
    urls.add(url);
  }

  return Array.from(urls).sort();
};

const resolveTesseractBinary = async () => {
  const candidates = [process.env.TESSERACT_CMD, 'tesseract', '/opt/homebrew/bin/tesseract'].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate.includes('/')) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    try {
      await execFileAsync(candidate, ['--version'], { timeout: 4000 });
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
};

const ocrImage = async (binary: string, imageUrl: string) => {
  const response = await fetch(imageUrl, { cache: 'no-store' });
  if (!response.ok) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  const tempDir = await mkdtemp(join(tmpdir(), 'kinelo-fit-diaria-'));
  const extension = extname(new URL(imageUrl).pathname) || '.png';
  const imagePath = join(tempDir, `calendar${extension}`);

  try {
    await writeFile(imagePath, buffer);
    const { stdout } = await execFileAsync(binary, [imagePath, 'stdout', '--psm', '6'], {
      maxBuffer: 4 * 1024 * 1024,
      timeout: 20000
    });
    return stdout.trim();
  } catch {
    return null;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

export const parseDiariaCalendarPage = async (html: string) => {
  const imageUrls = extractDiariaCalendarImageUrls(html);
  if (imageUrls.length === 0) return [] as ParsedSessionSignal[];

  const binary = await resolveTesseractBinary();
  if (!binary) return [] as ParsedSessionSignal[];

  const texts = await Promise.all(imageUrls.map((imageUrl) => ocrImage(binary, imageUrl)));
  return matchDiariaSignalsFromOcrText(texts.filter((item): item is string => Boolean(item)));
};
