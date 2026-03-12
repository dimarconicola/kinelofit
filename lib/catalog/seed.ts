import { DateTime } from 'luxon';

import palermoCatalog from '@/data/research/palermo_app_catalog.json';
import type {
  ActivityCategory,
  BookingTarget,
  City,
  EditorialCollection,
  Instructor,
  Neighborhood,
  Session,
  Style,
  Venue
} from '@/lib/catalog/types';

const buildLocalized = (en: string, it: string) => ({ en, it });

type RecurringSessionTemplate = {
  templateId: string;
  citySlug: 'palermo';
  venueSlug: string;
  instructorSlug: string;
  categorySlug: string;
  styleSlug: string;
  title: { en: string; it: string };
  weekday: string;
  startTime: string;
  endTime: string;
  level: 'beginner' | 'open' | 'intermediate' | 'advanced';
  language: string;
  format: 'in_person' | 'online' | 'hybrid';
  bookingTargetSlug: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  verificationStatus: 'verified';
  priceNote?: { en: string; it: string };
};

const generated = palermoCatalog as {
  neighborhoods: Neighborhood[];
  styles: Style[];
  instructors: Instructor[];
  bookingTargets: BookingTarget[];
  venues: Venue[];
  recurringSessions: RecurringSessionTemplate[];
};

export const cities: City[] = [
  {
    slug: 'palermo',
    name: buildLocalized('Palermo', 'Palermo'),
    countryCode: 'IT',
    timezone: 'Europe/Rome',
    status: 'public',
    hero: buildLocalized(
      'The citywide yoga and mind-body calendar for Palermo.',
      'Il calendario cittadino di yoga e mind-body per Palermo.'
    ),
    bounds: [13.2805, 38.085, 13.405, 38.165]
  },
  {
    slug: 'catania',
    name: buildLocalized('Catania', 'Catania'),
    countryCode: 'IT',
    timezone: 'Europe/Rome',
    status: 'seed',
    hero: buildLocalized(
      'Next city in the kinelo.fit pipeline.',
      'La prossima citta nella pipeline di kinelo.fit.'
    ),
    bounds: [15.02, 37.45, 15.18, 37.57]
  }
];

export const neighborhoods: Neighborhood[] = generated.neighborhoods;

export const categories: ActivityCategory[] = [
  {
    slug: 'yoga',
    citySlug: 'palermo',
    name: buildLocalized('Yoga', 'Yoga'),
    description: buildLocalized(
      'The strongest verified category in Palermo right now.',
      'La categoria verificata piu forte a Palermo in questo momento.'
    ),
    visibility: 'live',
    heroMetric: buildLocalized('Most complete verified class density in the city.', 'La densita di classi verificate piu completa in citta.')
  },
  {
    slug: 'pilates',
    citySlug: 'palermo',
    name: buildLocalized('Pilates', 'Pilates'),
    description: buildLocalized(
      'A useful adjacent category that is still thinner than the yoga core.',
      'Una categoria adiacente utile ma ancora piu sottile del nucleo yoga.'
    ),
    visibility: 'beta',
    heroMetric: buildLocalized('Published selectively while coverage grows.', 'Pubblicata in modo selettivo mentre la copertura cresce.')
  },
  {
    slug: 'breathwork',
    citySlug: 'palermo',
    name: buildLocalized('Breathwork', 'Breathwork'),
    description: buildLocalized(
      'Breath-led practice exists in the catalog, but not yet at full city depth.',
      'La pratica guidata dal respiro esiste nel catalogo, ma non ancora con piena profondita cittadina.'
    ),
    visibility: 'beta',
    heroMetric: buildLocalized('Visible where source-backed sessions exist.', 'Visibile dove esistono sessioni supportate da fonti.')
  },
  {
    slug: 'meditation',
    citySlug: 'palermo',
    name: buildLocalized('Meditation', 'Meditazione'),
    description: buildLocalized(
      'Tracked in the catalog but not foregrounded in public discovery yet.',
      'Tracciata nel catalogo ma non ancora in primo piano nella discovery pubblica.'
    ),
    visibility: 'hidden',
    heroMetric: buildLocalized('Held back until coverage improves.', 'Tenuta indietro finche la copertura non migliora.')
  },
  {
    slug: 'movement',
    citySlug: 'palermo',
    name: buildLocalized('Movement', 'Movimento'),
    description: buildLocalized(
      'Adjacent movement formats are tracked without diluting the yoga-led wedge.',
      'I formati di movimento adiacenti sono tracciati senza diluire il wedge guidato dallo yoga.'
    ),
    visibility: 'hidden',
    heroMetric: buildLocalized('Tracked, not yet foregrounded.', 'Tracciato, non ancora in primo piano.')
  }
];

export const styles: Style[] = generated.styles;
export const instructors: Instructor[] = generated.instructors;
export const bookingTargets: BookingTarget[] = generated.bookingTargets;
export const venues: Venue[] = generated.venues;

export const collections: EditorialCollection[] = [
  {
    slug: 'today-nearby',
    citySlug: 'palermo',
    title: buildLocalized('Today nearby', 'Vicino a te oggi'),
    description: buildLocalized('Quick picks for a same-day Palermo practice.', 'Selezione rapida per praticare a Palermo nella stessa giornata.'),
    cta: buildLocalized('Open same-day classes', 'Apri le classi di oggi'),
    kind: 'rule'
  },
  {
    slug: 'new-this-week',
    citySlug: 'palermo',
    title: buildLocalized('New this week', 'Nuovo questa settimana'),
    description: buildLocalized('Freshly checked sessions and timetables from current Palermo sources.', 'Sessioni e orari ricontrollati di fresco da fonti palermitane correnti.'),
    cta: buildLocalized('See fresh additions', 'Vedi le novita'),
    kind: 'rule'
  },
  {
    slug: 'english-speaking-classes',
    citySlug: 'palermo',
    title: buildLocalized('English-speaking classes', 'Classi in inglese'),
    description: buildLocalized('Reserved for sessions that clearly publish English-language delivery.', 'Riservato alle sessioni che pubblicano chiaramente una conduzione in inglese.'),
    cta: buildLocalized('Browse English-friendly classes', 'Esplora le classi in inglese'),
    kind: 'editorial'
  }
];

const weekdayMap: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

const parseClock = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
};

const generateSessions = () => {
  const zone = 'Europe/Rome';
  const start = DateTime.now().setZone(zone).startOf('day');
  const sessions: Session[] = [];

  for (const template of generated.recurringSessions) {
    const targetWeekday = weekdayMap[template.weekday];
    if (!targetWeekday) continue;

    const startClock = parseClock(template.startTime);
    const endClock = parseClock(template.endTime);

    for (let offset = 0; offset < 14; offset += 1) {
      const day = start.plus({ days: offset });
      if (day.weekday !== targetWeekday) continue;

      const startAt = day.set({ hour: startClock.hour, minute: startClock.minute, second: 0, millisecond: 0 });
      const endAt = day.set({ hour: endClock.hour, minute: endClock.minute, second: 0, millisecond: 0 });

      sessions.push({
        id: `${template.templateId}-${day.toFormat('yyyyLLdd')}`,
        citySlug: template.citySlug,
        venueSlug: template.venueSlug,
        instructorSlug: template.instructorSlug,
        categorySlug: template.categorySlug,
        styleSlug: template.styleSlug,
        title: template.title,
        startAt: startAt.toISO() ?? '',
        endAt: endAt.toISO() ?? '',
        level: template.level,
        language: template.language,
        format: template.format,
        bookingTargetSlug: template.bookingTargetSlug,
        sourceUrl: template.sourceUrl,
        lastVerifiedAt: template.lastVerifiedAt,
        verificationStatus: template.verificationStatus,
        priceNote: template.priceNote
      });
    }
  }

  return sessions.sort((a, b) => a.startAt.localeCompare(b.startAt));
};

export const sessions = generateSessions();
