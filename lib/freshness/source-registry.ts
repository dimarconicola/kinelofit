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
  if (key.includes('diariapalermo.org/corsi/calendario')) return 'diaria-calendar';
  return undefined;
};

const classifySeedSource = (
  sourceUrl: string
): Pick<SourceRegistryEntry, 'sourceType' | 'cadence' | 'trustTier' | 'notes'> => {
  const key = sourceUrl.toLowerCase();
  if (key.includes('facebook.com') || key.includes('instagram.com')) {
    return {
      sourceType: 'social',
      cadence: 'weekly',
      trustTier: 'tier_c',
      notes: 'Weekly low-cost social check for one-off events and schedule changes.'
    };
  }

  return {
    sourceType: 'official_site',
    cadence: 'daily',
    trustTier: 'tier_a',
    notes: undefined
  };
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
    sourceUrl: 'https://www.diariapalermo.org/corsi/costi-diaria/',
    sourceType: 'official_site',
    cadence: 'weekly',
    trustTier: 'tier_a',
    purpose: 'catalog',
    tags: ['palermo', 'pricing', 'pilates', 'yoga'],
    active: true,
    notes: 'Weekly pricing check for Diaria to keep venue-level pricing notes current.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.circopificio.it/circomotricita/',
    sourceType: 'official_site',
    cadence: 'weekly',
    trustTier: 'tier_a',
    purpose: 'catalog',
    tags: ['palermo', 'kids', 'circo'],
    active: true,
    notes: 'Weekly kids activity check for Circo Pificio.'
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
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.epycpalermo.it/',
    sourceType: 'official_site',
    cadence: 'weekly',
    trustTier: 'tier_b',
    purpose: 'discovery',
    tags: ['palermo', 'youth-center', 'yoga', 'movement'],
    active: true,
    notes: 'Weekly discovery check for EPYC forms, classes, and movement-led programming.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.instagram.com/epyc_palermo/',
    sourceType: 'social',
    cadence: 'weekly',
    trustTier: 'tier_c',
    purpose: 'discovery',
    tags: ['palermo', 'youth-center', 'events', 'yoga'],
    active: true,
    notes: 'Social fallback for EPYC events when the official site changes lag behind.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.ivanorsports.it/calisthenics',
    sourceType: 'official_site',
    cadence: 'weekly',
    trustTier: 'tier_a',
    purpose: 'catalog',
    tags: ['palermo', 'movement', 'calisthenics'],
    active: true,
    notes: 'Official timetable check for Ivanor calisthenics expansion.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://palestre.fitness/it/i/14126-calisthenics-palermo-ksw-studio/',
    sourceType: 'directory',
    cadence: 'weekly',
    trustTier: 'tier_b',
    purpose: 'catalog',
    tags: ['palermo', 'movement', 'calisthenics'],
    active: true,
    notes: 'Structured calisthenics listing used while the studio schedule remains social-led.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.instagram.com/dc_ksw/',
    sourceType: 'social',
    cadence: 'weekly',
    trustTier: 'tier_c',
    purpose: 'discovery',
    tags: ['palermo', 'movement', 'calisthenics'],
    active: true
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.facebook.com/KSWCalisthenicsPalermo/',
    sourceType: 'social',
    cadence: 'weekly',
    trustTier: 'tier_c',
    purpose: 'discovery',
    tags: ['palermo', 'movement', 'calisthenics'],
    active: true
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.orangogo.it/corsi/corso-di-fit-boxing-per-bambini-k2-0-a-s-d-kick-and-fitness-palermo',
    sourceType: 'directory',
    cadence: 'weekly',
    trustTier: 'tier_b',
    purpose: 'catalog',
    tags: ['palermo', 'movement', 'boxing'],
    active: true,
    notes: 'Structured recurring cross boxe listing for Palermo.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://freeclimbingpalermo.wordpress.com/dove-siamo/',
    sourceType: 'official_site',
    cadence: 'weekly',
    trustTier: 'tier_a',
    purpose: 'catalog',
    tags: ['palermo', 'movement', 'climbing'],
    active: true,
    notes: 'Official opening-hours source for Free Climbing Palermo.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.orangogo.it/corsi/corso-di-danza-sportiva-per-bambini-emotions-of-the-dance-palermo-2',
    sourceType: 'directory',
    cadence: 'weekly',
    trustTier: 'tier_b',
    purpose: 'catalog',
    tags: ['palermo', 'movement', 'dance'],
    active: true,
    notes: 'Structured partner-dance listing maintained by the venue through Orangogo.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.orangogo.it/corsi/corso-di-ginnastica-per-bambini-emotions-of-the-dance-palermo-1',
    sourceType: 'directory',
    cadence: 'weekly',
    trustTier: 'tier_b',
    purpose: 'catalog',
    tags: ['palermo', 'movement', 'dance'],
    active: true,
    notes: 'Structured group-dance listing maintained by the venue through Orangogo.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.cubaboxing.it/contatti',
    sourceType: 'official_site',
    cadence: 'weekly',
    trustTier: 'tier_a',
    purpose: 'discovery',
    tags: ['palermo', 'movement', 'boxing'],
    active: true,
    notes: 'Official contact and opening-hours page for Cuba Boxing.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.facebook.com/palestrapopolarepa/',
    sourceType: 'social',
    cadence: 'weekly',
    trustTier: 'tier_c',
    purpose: 'catalog',
    tags: ['palermo', 'movement', 'boxing', 'muay-thai', 'strength'],
    active: true,
    notes: 'Public timetable source for Palestra Popolare 2025/26.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.capoeirazumbi.org/',
    sourceType: 'official_site',
    cadence: 'weekly',
    trustTier: 'tier_b',
    purpose: 'discovery',
    tags: ['palermo', 'movement', 'capoeira'],
    active: true,
    notes: 'Official Capoeira Zumbi entry point for Palermo practice.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.lalaue.com/city/palermo/',
    sourceType: 'directory',
    cadence: 'weekly',
    trustTier: 'tier_b',
    purpose: 'catalog',
    tags: ['palermo', 'movement', 'capoeira'],
    active: true,
    notes: 'Structured capoeira city directory used for recurring Palermo class slots.'
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.facebook.com/capoeirazumbi/',
    sourceType: 'social',
    cadence: 'weekly',
    trustTier: 'tier_c',
    purpose: 'discovery',
    tags: ['palermo', 'movement', 'capoeira'],
    active: true
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.facebook.com/profile.php?id=100063661510276',
    sourceType: 'social',
    cadence: 'weekly',
    trustTier: 'tier_c',
    purpose: 'discovery',
    tags: ['palermo', 'movement', 'boxing'],
    active: true
  },
  {
    citySlug: 'palermo',
    sourceUrl: 'https://www.instagram.com/cuba_boxing_palermo/',
    sourceType: 'social',
    cadence: 'weekly',
    trustTier: 'tier_c',
    purpose: 'discovery',
    tags: ['palermo', 'movement', 'boxing'],
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
    const profile = classifySeedSource(sourceUrl);
    rows.push({
      citySlug,
      sourceUrl,
      sourceType: profile.sourceType,
      cadence: profile.cadence,
      trustTier: profile.trustTier,
      purpose: 'catalog',
      parserAdapter: adapterForUrl(sourceUrl),
      tags: ['catalog', citySlug],
      active: true,
      notes: profile.notes
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
