import { sessions as seedSessions, venues as seedVenues } from '@/lib/catalog/seed';
import type { SourceCadence, SourceRegistryEntry } from '@/lib/catalog/types';

const cadenceRank: Record<SourceCadence, number> = {
  daily: 1,
  weekly: 2,
  quarterly: 3
};

const trustRank: Record<SourceRegistryEntry['trustTier'], number> = {
  tier_a: 1,
  tier_b: 2,
  tier_c: 3
};

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

const adapterForUrl = (sourceUrl: string) => {
  const key = sourceUrl.toLowerCase();
  if (key.includes('centroculturarishi.it/corsi')) return 'rishi-corsi';
  if (key.includes('taijistudiopalermo.it')) return 'taiji-home';
  if (key.includes('barbarafaludiyoga.com/corsi-in-studio')) return 'barbara-wix';
  return undefined;
};

const palermoDiscoverySources: SourceRegistryEntry[] = [
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.orangogo.it/sport/palermo',
    sourceType: 'directory',
    cadence: 'quarterly',
    trustTier: 'tier_b',
    purpose: 'discovery',
    tags: ['palermo', 'sports-directory'],
    active: true,
    notes: 'Quarterly benchmark sweep against broad activity directories.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.palermobimbi.it',
    sourceType: 'directory',
    cadence: 'quarterly',
    trustTier: 'tier_b',
    purpose: 'discovery',
    tags: ['palermo', 'kids', 'families'],
    active: true,
    notes: 'Quarterly lead source for kids-oriented activities.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.diariapalermo.org/',
    sourceType: 'events_calendar',
    cadence: 'weekly',
    trustTier: 'tier_a',
    purpose: 'catalog',
    tags: ['palermo', 'calendar', 'kids'],
    active: true,
    notes: 'Weekly top-level check in addition to class timetable endpoints.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.panteatro.it/',
    sourceType: 'official_site',
    cadence: 'quarterly',
    trustTier: 'tier_b',
    purpose: 'discovery',
    tags: ['palermo', 'kids', 'theater'],
    active: true
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.elibe.it/',
    sourceType: 'official_site',
    cadence: 'quarterly',
    trustTier: 'tier_b',
    purpose: 'discovery',
    tags: ['palermo', 'kids', 'events'],
    active: true
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.artiinmovimento.it/',
    sourceType: 'official_site',
    cadence: 'quarterly',
    trustTier: 'tier_b',
    purpose: 'discovery',
    tags: ['palermo', 'kids', 'movement'],
    active: true
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.facebook.com/spazioterrapalermo',
    sourceType: 'social',
    cadence: 'weekly',
    trustTier: 'tier_c',
    purpose: 'catalog',
    tags: ['palermo', 'kids', 'yoga'],
    active: true
  }
];

const buildSeedCatalogSources = (citySlug: string): SourceRegistryEntry[] => {
  const rows: SourceRegistryEntry[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const sourceUrl = normalizeSourceUrl(raw);
    if (!sourceUrl || seen.has(sourceUrl)) return;
    seen.add(sourceUrl);
    rows.push({
      citySlug,
      sourceUrl,
      sourceType: 'official_site',
      cadence: 'daily',
      trustTier: 'tier_a',
      purpose: 'catalog',
      parserAdapter: adapterForUrl(sourceUrl),
      tags: ['catalog', citySlug],
      active: true
    });
  };

  for (const venue of seedVenues) {
    if (venue.citySlug !== citySlug) continue;
    push(venue.sourceUrl);
  }

  for (const session of seedSessions) {
    if (session.citySlug !== citySlug) continue;
    push(session.sourceUrl);
  }

  return rows;
};

const mergeSourceEntries = (entries: SourceRegistryEntry[]) => {
  const merged = new Map<string, SourceRegistryEntry>();

  for (const entry of entries) {
    const sourceUrl = normalizeSourceUrl(entry.sourceUrl);
    if (!sourceUrl) continue;
    const normalized: SourceRegistryEntry = {
      ...entry,
      sourceUrl,
      tags: Array.from(new Set(entry.tags))
    };

    const existing = merged.get(sourceUrl);
    if (!existing) {
      merged.set(sourceUrl, normalized);
      continue;
    }

    const cadence =
      cadenceRank[normalized.cadence] < cadenceRank[existing.cadence] ? normalized.cadence : existing.cadence;
    const trustTier =
      trustRank[normalized.trustTier] < trustRank[existing.trustTier] ? normalized.trustTier : existing.trustTier;
    merged.set(sourceUrl, {
      ...existing,
      cadence,
      trustTier,
      purpose: existing.purpose === 'catalog' || normalized.purpose === 'catalog' ? 'catalog' : 'discovery',
      parserAdapter: existing.parserAdapter ?? normalized.parserAdapter,
      tags: Array.from(new Set([...existing.tags, ...normalized.tags])),
      active: existing.active || normalized.active,
      notes: existing.notes ?? normalized.notes
    });
  }

  return Array.from(merged.values()).sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
};

export const cadenceIncludes = (runCadence: SourceCadence, sourceCadence: SourceCadence) =>
  cadenceRank[sourceCadence] <= cadenceRank[runCadence];

export const getSeedSourceRegistry = (citySlug: string): SourceRegistryEntry[] => {
  const base = buildSeedCatalogSources(citySlug);
  if (citySlug !== 'palermo') return base;
  return mergeSourceEntries([...base, ...palermoDiscoverySources]);
};

export const getSourceUrlsForCadence = (entries: SourceRegistryEntry[], runCadence: SourceCadence) =>
  Array.from(
    new Set(
      entries
        .filter((entry) => entry.active && cadenceIncludes(runCadence, entry.cadence))
        .map((entry) => entry.sourceUrl)
    )
  ).sort();
