import type { MapVenueSessionPreview, MapVenueSummary } from '@/components/discovery/classes-results.types';
import type { BookingTarget, Instructor, Locale, Neighborhood, Session, Style, Venue } from '@/lib/catalog/types';

interface BuildMapVenueSummariesArgs {
  locale: Locale;
  citySlug: string;
  sessions: Session[];
  venues: Venue[];
  neighborhoods: Neighborhood[];
  instructors: Instructor[];
  styles: Style[];
  bookingTargets: BookingTarget[];
}

const isValidGeo = (venue: Venue) =>
  Number.isFinite(venue.geo.lat) &&
  Number.isFinite(venue.geo.lng) &&
  Math.abs(venue.geo.lat) <= 90 &&
  Math.abs(venue.geo.lng) <= 180;

const buildTimeFormatter = (locale: Locale) =>
  new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Rome'
  });

const buildPreview = (
  session: Session,
  locale: Locale,
  timeFormatter: Intl.DateTimeFormat,
  instructorBySlug: Map<string, Instructor>,
  styleBySlug: Map<string, Style>,
  targetBySlug: Map<string, BookingTarget>
): MapVenueSessionPreview => {
  const target = targetBySlug.get(session.bookingTargetSlug);

  return {
    sessionId: session.id,
    title: session.title[locale],
    startLabel: timeFormatter.format(new Date(session.startAt)),
    endLabel: timeFormatter.format(new Date(session.endAt)),
    startAt: session.startAt,
    instructorName: instructorBySlug.get(session.instructorSlug)?.name,
    styleName: styleBySlug.get(session.styleSlug)?.name[locale],
    bookingHref: target?.href,
    bookingLabel: target?.label
  };
};

export function buildMapVenueSummaries({
  locale,
  citySlug,
  sessions,
  venues,
  neighborhoods,
  instructors,
  styles,
  bookingTargets
}: BuildMapVenueSummariesArgs): MapVenueSummary[] {
  const venueBySlug = new Map(venues.filter(isValidGeo).map((venue) => [venue.slug, venue] as const));
  const neighborhoodBySlug = new Map(neighborhoods.map((item) => [item.slug, item] as const));
  const instructorBySlug = new Map(instructors.map((item) => [item.slug, item] as const));
  const styleBySlug = new Map(styles.map((item) => [item.slug, item] as const));
  const targetBySlug = new Map(bookingTargets.map((item) => [item.slug, item] as const));
  const sessionsByVenue = new Map<string, Session[]>();
  const timeFormatter = buildTimeFormatter(locale);

  for (const session of sessions) {
    const venue = venueBySlug.get(session.venueSlug);
    if (!venue) continue;
    const bucket = sessionsByVenue.get(session.venueSlug) ?? [];
    bucket.push(session);
    sessionsByVenue.set(session.venueSlug, bucket);
  }

  const summaries = [...sessionsByVenue.entries()].map<MapVenueSummary | null>(([venueSlug, venueSessions]) => {
      const venue = venueBySlug.get(venueSlug);
      if (!venue) return null;

      const orderedSessions = [...venueSessions].sort((left, right) => left.startAt.localeCompare(right.startAt));
      const sessionsPreview = orderedSessions.slice(0, 3).map((session) => buildPreview(session, locale, timeFormatter, instructorBySlug, styleBySlug, targetBySlug));
      const nextSession = sessionsPreview[0];
      const venueTarget = venue.bookingTargetOrder.map((slug) => targetBySlug.get(slug)).find((target): target is BookingTarget => Boolean(target));
      const sessionTarget = orderedSessions.map((session) => targetBySlug.get(session.bookingTargetSlug)).find((target): target is BookingTarget => Boolean(target));
      const primaryTarget = venueTarget ?? sessionTarget;
      const neighborhood = neighborhoodBySlug.get(venue.neighborhoodSlug);

      return {
        venueSlug: venue.slug,
        name: venue.name,
        address: venue.address,
        neighborhoodName: neighborhood?.name[locale] ?? venue.address,
        geo: venue.geo,
        matchingSessionCount: orderedSessions.length,
        nextSession,
        sessionsPreview,
        studioHref: `/${locale}/${citySlug}/studios/${venue.slug}`,
        primaryCtaHref: primaryTarget?.href,
        primaryCtaLabel: primaryTarget?.label
      } satisfies MapVenueSummary;
    });

  return summaries
    .filter((summary): summary is MapVenueSummary => summary !== null)
    .sort(
      (left, right) =>
        (left.nextSession?.startAt ?? '9999').localeCompare(right.nextSession?.startAt ?? '9999') ||
        left.name.localeCompare(right.name, locale)
    );
}
