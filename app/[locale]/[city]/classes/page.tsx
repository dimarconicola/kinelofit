import { notFound } from 'next/navigation';

import { ClassesResultsClient } from '@/components/discovery/ClassesResultsClient';
import type { CalendarEntry as ClassesCalendarEntry } from '@/components/discovery/classes-results.types';
import { FilterBar } from '@/components/discovery/FilterBar';
import { ServerButtonLink, ServerChip } from '@/components/ui/server';
import { getSessionUser } from '@/lib/auth/session';
import { applySessionFilters } from '@/lib/catalog/filters';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
import { resolveSessionCardData } from '@/lib/catalog/session-card-data';
import { parseFilters } from '@/lib/catalog/filters';
import type { ClassView } from '@/lib/catalog/types';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';
import { buildMapVenueSummaries } from '@/lib/map/venue-summaries';
import { getMapRenderMode } from '@/lib/map/runtime';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';

const isClassView = (value: string | null): value is ClassView => value === 'list' || value === 'map' || value === 'calendar';

const flattenParams = (raw: Record<string, string | string[] | undefined>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      params.set(key, value);
      continue;
    }

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      params.set(key, value[0]);
    }
  }

  return params;
};

export default async function ClassesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale, city: citySlug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const rawSearch = await searchParams;
  const urlParams = flattenParams(rawSearch);
  const filters = parseFilters(rawSearch);

  const requestedView = urlParams.get('view');
  const view: ClassView = isClassView(requestedView) ? requestedView : 'list';
  const requestedPage = Number.parseInt(urlParams.get('page') ?? '1', 10);
  const requestedWeekOffset = Number.parseInt(urlParams.get('week_offset') ?? '0', 10);
  const requestedVenueSlug = urlParams.get('venue') ?? undefined;
  const weekOffset = Number.isFinite(requestedWeekOffset) ? Math.max(0, requestedWeekOffset) : 0;

  const [catalog, user, runtimeCapabilities] = await Promise.all([getCatalogSnapshot(), getSessionUser(), getRuntimeCapabilities()]);
  const city = catalog.cities.find((item) => item.slug === citySlug && item.status === 'public');
  if (!city) notFound();

  const categories = catalog.categories.filter((item) => item.citySlug === citySlug && item.visibility !== 'hidden');
  const neighborhoods = catalog.neighborhoods.filter((item) => item.citySlug === citySlug);
  const allStyles = catalog.styles;
  const cityVenues = catalog.venues.filter((venue) => venue.citySlug === citySlug);
  const venueBySlug = new Map(cityVenues.map((venue) => [venue.slug, venue]));
  const visibleCategorySlugs = new Set(categories.map((category) => category.slug));
  const baseSessions = catalog.sessions.filter(
    (session) =>
      session.citySlug === citySlug &&
      session.verificationStatus !== 'hidden' &&
      visibleCategorySlugs.has(session.categorySlug)
  );
  const filterByNeighborhood = <T extends { venueSlug: string }>(sessions: T[]) =>
    sessions.filter((session) => {
      if (!filters.neighborhood) return true;
      return venueBySlug.get(session.venueSlug)?.neighborhoodSlug === filters.neighborhood;
    });

  const weekSessions = filterByNeighborhood(applySessionFilters(baseSessions, { date: 'week' }));
  const filteredSessions = filterByNeighborhood(applySessionFilters(baseSessions, filters));
  const cityStyleSlugs = new Set(weekSessions.map((session) => session.styleSlug));
  const metrics = {
    venues: cityVenues.length,
    sessions: weekSessions.length,
    neighborhoods: new Set(cityVenues.map((venue) => venue.neighborhoodSlug)).size,
    styles: new Set(weekSessions.map((session) => session.styleSlug)).size
  };
  const sessionResults = filteredSessions.sort((left, right) => left.startAt.localeCompare(right.startAt));
  const visibleVenues = [...new Set(sessionResults.map((session) => session.venueSlug))]
    .map((slug) => venueBySlug.get(slug))
    .filter((venue): venue is NonNullable<typeof venue> => Boolean(venue));
  const styleLabelBySlug = new Map(allStyles.map((style) => [style.slug, style.name[locale]]));

  const selectedTimeBuckets = filters.time_buckets?.length
    ? filters.time_buckets
    : filters.time_bucket
      ? [filters.time_bucket]
      : [];

  const filterValueToLabel = {
    date: {
      today: locale === 'it' ? 'Oggi' : 'Today',
      tomorrow: locale === 'it' ? 'Domani' : 'Tomorrow',
      weekend: locale === 'it' ? 'Weekend' : 'Weekend',
      week: locale === 'it' ? 'Prossimi 7 giorni' : 'Next 7 days'
    },
    time_bucket: {
      early: locale === 'it' ? 'Presto' : 'Early',
      morning: locale === 'it' ? 'Mattina' : 'Morning',
      midday: locale === 'it' ? 'Metà giornata' : 'Midday',
      evening: locale === 'it' ? 'Sera' : 'Evening'
    },
    level: {
      beginner: locale === 'it' ? 'Principianti' : 'Beginner',
      open: locale === 'it' ? 'Aperti a tutti' : 'Open',
      intermediate: locale === 'it' ? 'Intermedio' : 'Intermediate',
      advanced: locale === 'it' ? 'Avanzato' : 'Advanced'
    },
    format: {
      in_person: locale === 'it' ? 'In presenza' : 'In person',
      hybrid: 'Hybrid',
      online: 'Online'
    },
    drop_in: locale === 'it' ? 'Solo drop-in' : 'Drop-in only'
  } as const;
  const weekdayLabels = {
    mon: locale === 'it' ? 'Lunedi' : 'Monday',
    tue: locale === 'it' ? 'Martedi' : 'Tuesday',
    wed: locale === 'it' ? 'Mercoledi' : 'Wednesday',
    thu: locale === 'it' ? 'Giovedi' : 'Thursday',
    fri: locale === 'it' ? 'Venerdi' : 'Friday',
    sat: locale === 'it' ? 'Sabato' : 'Saturday',
    sun: locale === 'it' ? 'Domenica' : 'Sunday'
  } as const;

  const activeFilters = [
    filters.date ? filterValueToLabel.date[filters.date] : null,
    filters.weekday ? weekdayLabels[filters.weekday] : null,
    ...selectedTimeBuckets.map((bucket) => filterValueToLabel.time_bucket[bucket]),
    filters.category ? categories.find((category) => category.slug === filters.category)?.name[locale] ?? filters.category : null,
    filters.style ? styleLabelBySlug.get(filters.style) ?? filters.style : null,
    filters.level ? filterValueToLabel.level[filters.level] : null,
    filters.language ? filters.language : null,
    filters.neighborhood ? neighborhoods.find((item) => item.slug === filters.neighborhood)?.name[locale] ?? filters.neighborhood : null,
    filters.format ? filterValueToLabel.format[filters.format] : null,
    filters.open_now === 'true' ? (locale === 'it' ? 'Aperto ora' : 'Open now') : null,
    filters.drop_in === 'true' ? filterValueToLabel.drop_in : null
  ].filter((item): item is string => Boolean(item));

  const basePath = `/${locale}/${citySlug}/classes`;
  const hrefWith = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(urlParams);

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const pageSize = 16;
  const totalPages = Math.max(1, Math.ceil(sessionResults.length / pageSize));
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const pageSliceStart = (currentPage - 1) * pageSize;
  const pagedSessions = sessionResults.slice(pageSliceStart, pageSliceStart + pageSize);
  const resolvedSessionCards = Object.fromEntries(await resolveSessionCardData(pagedSessions));
  const visibleVenueNameBySlug = new Map(visibleVenues.map((venue) => [venue.slug, venue.name]));
  const mapVenueSummaries = buildMapVenueSummaries({
    locale,
    citySlug,
    sessions: sessionResults,
    venues: cityVenues,
    neighborhoods,
    instructors: catalog.instructors.filter((instructor) => instructor.citySlug === citySlug),
    styles: allStyles,
    bookingTargets: catalog.bookingTargets
  });
  const selectedVenueSlug = mapVenueSummaries.some((venue) => venue.venueSlug === requestedVenueSlug) ? requestedVenueSlug : undefined;
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Rome'
  });
  const calendarEntries: ClassesCalendarEntry[] = sessionResults.map((session) => ({
    sessionId: session.id,
    venueSlug: session.venueSlug,
    title: session.title[locale],
    venueName: visibleVenueNameBySlug.get(session.venueSlug) ?? session.venueSlug,
    startLabel: timeFormatter.format(new Date(session.startAt)),
    endLabel: timeFormatter.format(new Date(session.endAt)),
    startAt: session.startAt
  }));

  const intro =
    locale === 'it'
      ? 'Classi verificate, con filtri e funzioni per prenotazione o contatto.'
      : 'Verified classes with consistent filters and direct booking/contact actions.';
  const badgeCopy =
    locale === 'it'
      ? { matches: 'corrispondenze', venues: 'studi', styles: 'stili attivi', back: 'Torna alla città' }
      : { matches: 'matches', venues: 'venues', styles: 'live styles', back: 'Back to city' };

  return (
    <div className="stack-list classes-page classes-page-refresh">
      <section className="classes-hero classes-hero-single">
        <div className="hero-copy classes-hero-main">
          <p className="eyebrow">{city.name[locale]}</p>
          <h1>{dict.classes}</h1>
          <p className="lead">{intro}</p>
          <div className="badge-row classes-hero-badges">
            <ServerChip tone="meta">
              {sessionResults.length} {badgeCopy.matches}
            </ServerChip>
            <ServerChip tone="meta">
              {visibleVenues.length} {badgeCopy.venues}
            </ServerChip>
            <ServerChip tone="meta">
              {metrics.styles} {badgeCopy.styles}
            </ServerChip>
          </div>
          <div className="site-actions classes-hero-actions">
            <ServerButtonLink href={`/${locale}/${citySlug}`} className="button-ghost">
              {badgeCopy.back}
            </ServerButtonLink>
            <ServerButtonLink href={`/${locale}/${citySlug}/collections/today-nearby`} className="button-secondary">
              {dict.todayNearby}
            </ServerButtonLink>
          </div>
        </div>
      </section>

      <div id="class-filters">
        <FilterBar
          locale={locale}
          citySlug={citySlug}
          filters={filters}
          categories={categories.map((item) => ({ slug: item.slug, name: item.name[locale] }))}
          neighborhoods={neighborhoods.map((item) => ({ slug: item.slug, name: item.name[locale] }))}
          styles={allStyles
            .filter((style) => cityStyleSlugs.has(style.slug))
            .map((style) => ({ slug: style.slug, name: style.name[locale] }))}
          activeFilters={activeFilters}
        />
      </div>

      <ClassesResultsClient
        locale={locale}
        citySlug={citySlug}
        cityName={city.name[locale]}
        bounds={city.bounds}
        initialView={view}
        visibleCount={sessionResults.length}
        pagedSessions={pagedSessions}
        resolvedSessionCards={resolvedSessionCards}
        calendarEntries={calendarEntries}
        mapVenueSummaries={mapVenueSummaries}
        initialSelectedVenueSlug={selectedVenueSlug}
        mapRenderMode={getMapRenderMode()}
        signedInEmail={user?.email}
        scheduleLabel={locale === 'it' ? 'Aggiungi in agenda' : 'Add to schedule'}
        runtimeCapabilities={runtimeCapabilities}
        noResultsLabel={dict.noResults}
        initialWeekOffset={weekOffset}
        totalPages={totalPages}
        currentPage={currentPage}
        prevHref={currentPage > 1 ? hrefWith({ page: String(currentPage - 1) }) : undefined}
        nextHref={currentPage < totalPages ? hrefWith({ page: String(currentPage + 1) }) : undefined}
      />
    </div>
  );
}
