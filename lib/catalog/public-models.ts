import { DateTime } from 'luxon';

import { applySessionFilters, getTimeBucket } from '@/lib/catalog/filters';
import type { CatalogSnapshot } from '@/lib/catalog/repository';
import type {
  ActivityCategory,
  BookingTarget,
  City,
  DiscoveryFilters,
  EditorialCollection,
  Instructor,
  Locale,
  Neighborhood,
  Session,
  Style,
  TimeBucket,
  Venue,
  WeekdayFilter
} from '@/lib/catalog/types';
import { buildMapVenueSummaries } from '@/lib/map/venue-summaries';
import type { MapVenueSummary } from '@/components/discovery/classes-results.types';

export interface PublicStudioSummary {
  venueSlug: string;
  sessionCount: number;
  nextSessionStartAt?: string;
}

export interface PublicTeacherSummary {
  instructorSlug: string;
  sessionCount: number;
  nextSessionStartAt?: string;
}

export interface PublicCityMetrics {
  venues: number;
  sessions: number;
  neighborhoods: number;
  styles: number;
}

export interface PublicCitySnapshot {
  sourceMode: 'database' | 'seed';
  version: number;
  builtAt: string;
  hash: string;
  city: City;
  neighborhoods: Neighborhood[];
  categories: ActivityCategory[];
  styles: Style[];
  instructors: Instructor[];
  venues: Venue[];
  bookingTargets: BookingTarget[];
  sessions: Session[];
  collections: EditorialCollection[];
  metrics: PublicCityMetrics;
  mapVenueSummaries: MapVenueSummary[];
  studioSummaries: PublicStudioSummary[];
  teacherSummaries: PublicTeacherSummary[];
}

export interface PublicCitySearchSessionRecord {
  id: string;
  citySlug: string;
  venueSlug: string;
  instructorSlug: string;
  categorySlug: string;
  styleSlug: string;
  title: Session['title'];
  startAt: string;
  endAt: string;
  level: Session['level'];
  language: string;
  format: Session['format'];
  bookingTargetSlug: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  verificationStatus: Session['verificationStatus'];
  audience: Session['audience'];
  attendanceModel: Session['attendanceModel'];
  ageMin?: number;
  ageMax?: number;
  ageBand?: Session['ageBand'];
  guardianRequired?: boolean;
  priceNote?: Session['priceNote'];
  neighborhoodSlug: string;
  timeBucket: TimeBucket;
  weekday: WeekdayFilter;
  searchText: string;
}

export interface PublicCitySearchIndex {
  citySlug: string;
  version: number;
  builtAt: string;
  hash: string;
  sessions: PublicCitySearchSessionRecord[];
}

const weekdayMap: Record<number, WeekdayFilter> = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
  7: 'sun'
};

const buildSearchText = (
  session: Session,
  venueBySlug: Map<string, Venue>,
  instructorBySlug: Map<string, Instructor>,
  styleBySlug: Map<string, Style>,
  categoryBySlug: Map<string, ActivityCategory>,
  neighborhoodBySlug: Map<string, Neighborhood>
) => {
  const venue = venueBySlug.get(session.venueSlug);
  const instructor = instructorBySlug.get(session.instructorSlug);
  const style = styleBySlug.get(session.styleSlug);
  const category = categoryBySlug.get(session.categorySlug);
  const neighborhood = venue ? neighborhoodBySlug.get(venue.neighborhoodSlug) : undefined;

  return [
    session.title.it,
    session.title.en,
    venue?.name,
    venue?.address,
    instructor?.name,
    style?.name.it,
    style?.name.en,
    category?.name.it,
    category?.name.en,
    neighborhood?.name.it,
    neighborhood?.name.en,
    session.language
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase();
};

export const getPublicCitySubset = (catalog: CatalogSnapshot, citySlug: string) => {
  const city = catalog.cities.find((item) => item.slug === citySlug && item.status === 'public');
  if (!city) {
    return null;
  }

  const neighborhoods = catalog.neighborhoods.filter((item) => item.citySlug === citySlug);
  const categories = catalog.categories.filter((item) => item.citySlug === citySlug && item.visibility !== 'hidden');
  const visibleCategorySlugs = new Set(categories.map((item) => item.slug));
  const styles = catalog.styles.filter((style) => visibleCategorySlugs.has(style.categorySlug));
  const instructors = catalog.instructors
    .filter((item) => item.citySlug === citySlug)
    .sort((left, right) => left.name.localeCompare(right.name, 'it', { sensitivity: 'base' }));
  const venues = catalog.venues
    .filter((item) => item.citySlug === citySlug)
    .sort((left, right) => left.name.localeCompare(right.name, 'it', { sensitivity: 'base' }));
  const bookingTargets = catalog.bookingTargets;
  const collections = catalog.collections.filter((item) => item.citySlug === citySlug);
  const sessions = catalog.sessions
    .filter((session) => session.citySlug === citySlug && session.verificationStatus !== 'hidden' && visibleCategorySlugs.has(session.categorySlug))
    .sort((left, right) => left.startAt.localeCompare(right.startAt));

  return {
    city,
    neighborhoods,
    categories,
    styles,
    instructors,
    venues,
    bookingTargets,
    collections,
    sessions
  };
};

export const buildPublicCitySnapshot = (catalog: CatalogSnapshot, citySlug: string): PublicCitySnapshot | null => {
  const subset = getPublicCitySubset(catalog, citySlug);
  if (!subset) return null;

  const weekSessions = applySessionFilters(subset.sessions, { date: 'week' });
  const metrics: PublicCityMetrics = {
    venues: subset.venues.length,
    sessions: weekSessions.length,
    neighborhoods: new Set(subset.venues.map((venue) => venue.neighborhoodSlug)).size,
    styles: new Set(weekSessions.map((session) => session.styleSlug)).size
  };

  const mapVenueSummaries = buildMapVenueSummaries({
    locale: 'it',
    citySlug,
    sessions: weekSessions,
    venues: subset.venues,
    neighborhoods: subset.neighborhoods,
    instructors: subset.instructors,
    styles: subset.styles,
    bookingTargets: subset.bookingTargets
  });

  const sessionsByVenue = new Map<string, Session[]>();
  const sessionsByInstructor = new Map<string, Session[]>();
  for (const session of weekSessions) {
    const venueBucket = sessionsByVenue.get(session.venueSlug) ?? [];
    venueBucket.push(session);
    sessionsByVenue.set(session.venueSlug, venueBucket);

    const instructorBucket = sessionsByInstructor.get(session.instructorSlug) ?? [];
    instructorBucket.push(session);
    sessionsByInstructor.set(session.instructorSlug, instructorBucket);
  }

  const studioSummaries: PublicStudioSummary[] = subset.venues.map((venue) => {
    const venueSessions = (sessionsByVenue.get(venue.slug) ?? []).sort((left, right) => left.startAt.localeCompare(right.startAt));
    return {
      venueSlug: venue.slug,
      sessionCount: venueSessions.length,
      nextSessionStartAt: venueSessions[0]?.startAt
    } satisfies PublicStudioSummary;
  });

  const teacherSummaries: PublicTeacherSummary[] = subset.instructors.map((instructor) => {
    const instructorSessions = (sessionsByInstructor.get(instructor.slug) ?? []).sort((left, right) => left.startAt.localeCompare(right.startAt));
    return {
      instructorSlug: instructor.slug,
      sessionCount: instructorSessions.length,
      nextSessionStartAt: instructorSessions[0]?.startAt
    } satisfies PublicTeacherSummary;
  });

  const basePayload = {
    sourceMode: catalog.sourceMode,
    city: subset.city,
    neighborhoods: subset.neighborhoods,
    categories: subset.categories,
    styles: subset.styles,
    instructors: subset.instructors,
    venues: subset.venues,
    bookingTargets: subset.bookingTargets,
    sessions: subset.sessions,
    collections: subset.collections,
    metrics,
    mapVenueSummaries,
    studioSummaries,
    teacherSummaries
  } satisfies Omit<PublicCitySnapshot, 'version' | 'builtAt' | 'hash'>;

  const builtAt = new Date().toISOString();
  return {
    ...basePayload,
    version: 1,
    builtAt,
    hash: ''
  } satisfies PublicCitySnapshot;
};

export const buildPublicCitySearchIndex = (snapshot: PublicCitySnapshot): PublicCitySearchIndex => {
  const venueBySlug = new Map(snapshot.venues.map((venue) => [venue.slug, venue] as const));
  const instructorBySlug = new Map(snapshot.instructors.map((instructor) => [instructor.slug, instructor] as const));
  const styleBySlug = new Map(snapshot.styles.map((style) => [style.slug, style] as const));
  const categoryBySlug = new Map(snapshot.categories.map((category) => [category.slug, category] as const));
  const neighborhoodBySlug = new Map(snapshot.neighborhoods.map((neighborhood) => [neighborhood.slug, neighborhood] as const));

  return {
    citySlug: snapshot.city.slug,
    version: snapshot.version,
    builtAt: snapshot.builtAt,
    hash: '',
    sessions: snapshot.sessions.flatMap((session) => {
      const venue = venueBySlug.get(session.venueSlug);
      if (!venue) return [];
      const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');

      return [{
        ...session,
        neighborhoodSlug: venue.neighborhoodSlug,
        timeBucket: getTimeBucket(session.startAt),
        weekday: weekdayMap[start.weekday],
        searchText: buildSearchText(session, venueBySlug, instructorBySlug, styleBySlug, categoryBySlug, neighborhoodBySlug)
      } satisfies PublicCitySearchSessionRecord];
    })
  } satisfies PublicCitySearchIndex;
};

export const publicSnapshotToCatalog = (snapshot: PublicCitySnapshot): CatalogSnapshot => ({
  sourceMode: snapshot.sourceMode,
  cities: [snapshot.city],
  neighborhoods: snapshot.neighborhoods,
  categories: snapshot.categories,
  styles: snapshot.styles,
  instructors: snapshot.instructors,
  venues: snapshot.venues,
  bookingTargets: snapshot.bookingTargets,
  sessions: snapshot.sessions,
  collections: snapshot.collections
});

export const applyPublicCityFilters = (snapshot: PublicCitySnapshot, filters: DiscoveryFilters) => {
  const filtered = applySessionFilters(snapshot.sessions, filters);
  if (!filters.neighborhood) return filtered;
  const venueBySlug = new Map(snapshot.venues.map((venue) => [venue.slug, venue] as const));
  return filtered.filter((session) => venueBySlug.get(session.venueSlug)?.neighborhoodSlug === filters.neighborhood);
};

export const buildFilteredMapVenueSummaries = ({
  snapshot,
  locale,
  sessions
}: {
  snapshot: PublicCitySnapshot;
  locale: Locale;
  sessions: Session[];
}) =>
  buildMapVenueSummaries({
    locale,
    citySlug: snapshot.city.slug,
    sessions,
    venues: snapshot.venues,
    neighborhoods: snapshot.neighborhoods,
    instructors: snapshot.instructors,
    styles: snapshot.styles,
    bookingTargets: snapshot.bookingTargets
  });
