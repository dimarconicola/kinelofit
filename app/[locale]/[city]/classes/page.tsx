import NextLink from 'next/link';
import { Button, Chip } from '@heroui/react';

import { ClassesResultsClient } from '@/components/discovery/ClassesResultsClient';
import { FilterBar } from '@/components/discovery/FilterBar';
import { getSessionUser } from '@/lib/auth/session';
import { resolveSessionCardData } from '@/lib/catalog/session-card-data';
import { getCityMetrics, getNeighborhoods, getPublicCategories, getSessions, getStyles, getVenue } from '@/lib/catalog/server-data';
import { parseFilters } from '@/lib/catalog/filters';
import { requirePublicCityServer } from '@/lib/catalog/guards';
import { getCityReadinessServer } from '@/lib/catalog/readiness';
import type { ClassView } from '@/lib/catalog/types';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

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
  const city = await requirePublicCityServer(citySlug);
  const rawSearch = await searchParams;
  const urlParams = flattenParams(rawSearch);
  const filters = parseFilters(rawSearch);
  const user = await getSessionUser();

  const requestedView = urlParams.get('view');
  const view: ClassView = isClassView(requestedView) ? requestedView : 'list';
  const requestedPage = Number.parseInt(urlParams.get('page') ?? '1', 10);
  const requestedWeekOffset = Number.parseInt(urlParams.get('week_offset') ?? '0', 10);
  const weekOffset = Number.isFinite(requestedWeekOffset) ? Math.max(0, requestedWeekOffset) : 0;

  const [metrics, readiness, categories, neighborhoods, allStyles, weekSessions, filteredSessions] = await Promise.all([
    getCityMetrics(citySlug),
    getCityReadinessServer(citySlug),
    getPublicCategories(citySlug),
    getNeighborhoods(citySlug),
    getStyles(),
    getSessions(citySlug, { date: 'week' }),
    getSessions(citySlug, filters)
  ]);
  const cityStyleSlugs = new Set(weekSessions.map((session) => session.styleSlug));

  const sessionResults = filteredSessions.sort((left, right) => left.startAt.localeCompare(right.startAt));
  const visibleVenueRows = await Promise.all([...new Set(sessionResults.map((session) => session.venueSlug))].map((slug) => getVenue(slug)));
  const visibleVenues = visibleVenueRows.filter((venue): venue is NonNullable<typeof venue> => Boolean(venue));
  const resolvedSessionCards = Object.fromEntries(await resolveSessionCardData(sessionResults));
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

  const intro =
    locale === 'it'
      ? 'Classi verificate, filtri coerenti e azioni dirette su prenotazione o contatto.'
      : 'Verified classes with consistent filters and direct booking/contact actions.';
  const trustCopy =
    locale === 'it'
      ? 'La soglia resta visibile per mantenere trasparenza su copertura e affidabilità locale.'
      : 'The supply gate stays visible so coverage and trust remain transparent.';

  const badgeCopy =
    locale === 'it'
      ? { matches: 'corrispondenze', venues: 'studi', styles: 'stili attivi', back: 'Torna alla città' }
      : { matches: 'matches', venues: 'venues', styles: 'live styles', back: 'Back to city' };

  return (
    <div className="stack-list classes-page classes-page-refresh">
      <section className="classes-hero">
        <div className="hero-copy classes-hero-main">
          <p className="eyebrow">{city.name[locale]}</p>
          <h1>{dict.classes}</h1>
          <p className="lead">{intro}</p>
          <div className="badge-row classes-hero-badges">
            <Chip radius="full" variant="flat" className="meta-pill">
              {sessionResults.length} {badgeCopy.matches}
            </Chip>
            <Chip radius="full" variant="flat" className="meta-pill">
              {visibleVenues.length} {badgeCopy.venues}
            </Chip>
            <Chip radius="full" variant="flat" className="meta-pill">
              {metrics.styles} {badgeCopy.styles}
            </Chip>
          </div>
          <div className="site-actions classes-hero-actions">
            <Button as={NextLink} href={`/${locale}/${citySlug}`} variant="ghost" radius="full" className="button button-ghost">
              {badgeCopy.back}
            </Button>
            <Button
              as={NextLink}
              href={`/${locale}/${citySlug}/collections/today-nearby`}
              variant="flat"
              radius="full"
              className="button button-secondary"
            >
              {dict.todayNearby}
            </Button>
          </div>
        </div>
        <div className="panel classes-hero-side">
          <p className="eyebrow">{locale === 'it' ? 'Copertura' : 'Coverage'}</p>
          <h2>{readiness.passesGate ? (locale === 'it' ? 'Soglia superata' : 'Gate passed') : locale === 'it' ? 'Soglia non superata' : 'Gate blocked'}</h2>
          <p className="muted">{trustCopy}</p>
          <div className="classes-stat-grid">
            <div className="classes-stat-card">
              <strong>{metrics.sessions}</strong>
              <span>{locale === 'it' ? 'Sessioni nei prossimi 7 giorni' : 'Sessions in next 7 days'}</span>
            </div>
            <div className="classes-stat-card">
              <strong>{metrics.neighborhoods}</strong>
              <span>{locale === 'it' ? 'Quartieri coperti' : 'Neighborhoods covered'}</span>
            </div>
            <div className="classes-stat-card">
              <strong>{Math.round(readiness.ctaCoverage * 100)}%</strong>
              <span>{locale === 'it' ? 'Copertura CTA' : 'CTA coverage'}</span>
            </div>
          </div>
        </div>
      </section>

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

      <ClassesResultsClient
        locale={locale}
        citySlug={citySlug}
        cityName={city.name[locale]}
        bounds={city.bounds}
        initialView={view}
        sessionResults={sessionResults}
        pagedSessions={pagedSessions}
        resolvedSessionCards={resolvedSessionCards}
        visibleVenues={visibleVenues}
        signedInEmail={user?.email}
        scheduleLabel={locale === 'it' ? 'Aggiungi in agenda' : 'Add to schedule'}
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
