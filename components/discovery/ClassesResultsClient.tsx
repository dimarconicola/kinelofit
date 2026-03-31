'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { FilterBar } from '@/components/discovery/FilterBar';
import type { CalendarEntry, MapRenderMode } from '@/components/discovery/classes-results.types';
import { applyPublicCityFilters, buildFilteredMapVenueSummaries, publicSnapshotToCatalog, type PublicCitySnapshot } from '@/lib/catalog/public-models';
import { filterSearchIndexSessions, toSessions } from '@/lib/catalog/search-index';
import { resolveSessionCardDataFromSnapshot } from '@/lib/catalog/session-card-data.shared';
import type { ClassView, DiscoveryFilters, Locale, TimeBucket } from '@/lib/catalog/types';

const ListResultsView = dynamic(() => import('@/components/discovery/ListResultsView').then((module) => module.ListResultsView));
const MapResultsView = dynamic(() => import('@/components/discovery/MapResultsView').then((module) => module.MapResultsView), {
  ssr: false
});
const CalendarResultsView = dynamic(
  () => import('@/components/discovery/CalendarResultsView').then((module) => module.CalendarResultsView),
  { ssr: false }
);

interface ClassesResultsClientProps {
  locale: Locale;
  citySlug: string;
  cityName: string;
  bounds: [number, number, number, number];
  snapshot: PublicCitySnapshot;
  searchIndexEndpoint: string;
  initialView: ClassView;
  initialWeekOffset: number;
  initialPage: number;
  initialFilters: DiscoveryFilters;
  initialSelectedVenueSlug?: string;
  mapRenderMode: MapRenderMode;
  scheduleLabel: string;
  noResultsLabel: string;
}

export function ClassesResultsClient({
  locale,
  citySlug,
  cityName,
  bounds,
  snapshot,
  searchIndexEndpoint,
  initialView,
  initialWeekOffset,
  initialPage,
  initialFilters,
  initialSelectedVenueSlug,
  mapRenderMode,
  scheduleLabel,
  noResultsLabel
}: ClassesResultsClientProps) {
  const pathname = usePathname();
  const [view, setView] = useState<ClassView>(initialView);
  const [weekOffset, setWeekOffset] = useState(initialWeekOffset);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFilters] = useState<DiscoveryFilters>(initialFilters);
  const [selectedVenueSlug, setSelectedVenueSlug] = useState<string | undefined>(initialSelectedVenueSlug);
  const [searchIndex, setSearchIndex] = useState<Awaited<ReturnType<typeof fetchSearchIndex>> | null>(null);

  const labels = useMemo(
    () =>
      locale === 'it'
        ? {
          list: 'Lista',
          map: 'Vista mappa',
          calendar: 'Calendario',
          visible: 'classi visibili',
          page: 'Pagina',
          previous: 'Precedente',
          next: 'Successiva',
          previousWeek: 'Settimana precedente',
          nextWeek: 'Settimana successiva',
          noDaySessions: 'Nessuna classe in questo giorno.',
          noWeekSessions: 'Nessuna classe disponibile questa settimana.',
          openNow: 'Aperto ora',
          dropIn: 'Solo drop-in',
          today: 'Oggi',
          tomorrow: 'Domani',
          weekend: 'Weekend',
          week: 'Prossimi 7 giorni',
          level: {
            beginner: 'Principianti',
            open: 'Aperti a tutti',
            intermediate: 'Intermedio',
            advanced: 'Avanzato'
          },
          format: {
            in_person: 'In presenza',
            hybrid: 'Hybrid',
            online: 'Online'
          },
          weekday: {
            mon: 'Lunedi',
            tue: 'Martedi',
            wed: 'Mercoledi',
            thu: 'Giovedi',
            fri: 'Venerdi',
            sat: 'Sabato',
            sun: 'Domenica'
          },
          time: {
            early: 'Presto',
            morning: 'Mattina',
            midday: 'Metà giornata',
            evening: 'Sera'
          }
        }
        : {
          list: 'List',
          map: 'Map view',
          calendar: 'Calendar',
          visible: 'visible classes',
          page: 'Page',
          previous: 'Previous',
          next: 'Next',
          previousWeek: 'Previous week',
          nextWeek: 'Next week',
          noDaySessions: 'No classes on this day.',
          noWeekSessions: 'No classes available this week.',
          openNow: 'Open now',
          dropIn: 'Drop-in only',
          today: 'Today',
          tomorrow: 'Tomorrow',
          weekend: 'Weekend',
          week: 'Next 7 days',
          level: {
            beginner: 'Beginner',
            open: 'Open',
            intermediate: 'Intermediate',
            advanced: 'Advanced'
          },
          format: {
            in_person: 'In person',
            hybrid: 'Hybrid',
            online: 'Online'
          },
          weekday: {
            mon: 'Monday',
            tue: 'Tuesday',
            wed: 'Wednesday',
            thu: 'Thursday',
            fri: 'Friday',
            sat: 'Saturday',
            sun: 'Sunday'
          },
          time: {
            early: 'Early',
            morning: 'Morning',
            midday: 'Midday',
            evening: 'Evening'
          }
        },
    [locale]
  );

  const catalogLike = useMemo(() => publicSnapshotToCatalog(snapshot), [snapshot]);

  useEffect(() => {
    let cancelled = false;

    void fetchSearchIndex(searchIndexEndpoint).then((payload) => {
      if (cancelled || !payload) return;
      setSearchIndex(payload);
    });

    return () => {
      cancelled = true;
    };
  }, [searchIndexEndpoint]);

  const filteredSessions = useMemo(() => {
    if (searchIndex) {
      return toSessions(filterSearchIndexSessions(searchIndex, filters));
    }

    return applyPublicCityFilters(snapshot, filters);
  }, [filters, searchIndex, snapshot]);

  const stylesForFilters = useMemo(() => {
    const weekSessions = applyPublicCityFilters(snapshot, { date: 'week' });
    const styleSlugs = new Set(weekSessions.map((session) => session.styleSlug));
    return snapshot.styles.filter((style) => styleSlugs.has(style.slug)).map((style) => ({ slug: style.slug, name: style.name[locale] }));
  }, [locale, snapshot]);

  const activeFilters = useMemo(() => {
    const categoryBySlug = new Map(snapshot.categories.map((category) => [category.slug, category.name[locale]] as const));
    const styleBySlug = new Map(snapshot.styles.map((style) => [style.slug, style.name[locale]] as const));
    const neighborhoodBySlug = new Map(snapshot.neighborhoods.map((item) => [item.slug, item.name[locale]] as const));
    const timeBuckets = filters.time_buckets?.length ? filters.time_buckets : filters.time_bucket ? [filters.time_bucket] : [];

    return [
      filters.date ? labels[filters.date] : null,
      filters.weekday ? labels.weekday[filters.weekday] : null,
      ...timeBuckets.map((bucket) => labels.time[bucket as TimeBucket]),
      filters.category ? categoryBySlug.get(filters.category) ?? filters.category : null,
      filters.style ? styleBySlug.get(filters.style) ?? filters.style : null,
      filters.level ? labels.level[filters.level] : null,
      filters.language ?? null,
      filters.neighborhood ? neighborhoodBySlug.get(filters.neighborhood) ?? filters.neighborhood : null,
      filters.format ? labels.format[filters.format] : null,
      filters.open_now === 'true' ? labels.openNow : null,
      filters.drop_in === 'true' ? labels.dropIn : null
    ].filter((item): item is string => Boolean(item));
  }, [filters, labels, locale, snapshot]);

  const pageSize = 16;
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const pagedSessions = useMemo(() => {
    const pageSliceStart = (safePage - 1) * pageSize;
    return filteredSessions.slice(pageSliceStart, pageSliceStart + pageSize);
  }, [filteredSessions, safePage]);

  const resolvedSessionCards = useMemo(
    () => Object.fromEntries(resolveSessionCardDataFromSnapshot(catalogLike, pagedSessions)),
    [catalogLike, pagedSessions]
  );

  const mapVenueSummaries = useMemo(
    () => buildFilteredMapVenueSummaries({ snapshot, locale, sessions: filteredSessions }),
    [filteredSessions, locale, snapshot]
  );

  useEffect(() => {
    if (!selectedVenueSlug) return;
    if (mapVenueSummaries.some((venue) => venue.venueSlug === selectedVenueSlug)) return;
    setSelectedVenueSlug(undefined);
  }, [mapVenueSummaries, selectedVenueSlug]);

  const calendarEntries = useMemo<CalendarEntry[]>(() => {
    const visibleVenueNameBySlug = new Map(snapshot.venues.map((venue) => [venue.slug, venue.name] as const));
    const timeFormatter = new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Rome'
    });

    return filteredSessions.map((session) => ({
      sessionId: session.id,
      venueSlug: session.venueSlug,
      title: session.title[locale],
      venueName: visibleVenueNameBySlug.get(session.venueSlug) ?? session.venueSlug,
      startLabel: timeFormatter.format(new Date(session.startAt)),
      endLabel: timeFormatter.format(new Date(session.endAt)),
      startAt: session.startAt
    }));
  }, [filteredSessions, locale, snapshot.venues]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const next = new URLSearchParams();
    if (filters.date) next.set('date', filters.date);
    if (filters.weekday) next.set('weekday', filters.weekday);
    if (filters.time_buckets?.length) next.set('time_bucket', filters.time_buckets.join(','));
    else if (filters.time_bucket) next.set('time_bucket', filters.time_bucket);
    if (filters.category) next.set('category', filters.category);
    if (filters.style) next.set('style', filters.style);
    if (filters.level) next.set('level', filters.level);
    if (filters.language) next.set('language', filters.language);
    if (filters.neighborhood) next.set('neighborhood', filters.neighborhood);
    if (filters.format) next.set('format', filters.format);
    if (filters.open_now) next.set('open_now', filters.open_now);
    if (filters.drop_in) next.set('drop_in', filters.drop_in);
    if (view !== 'list') next.set('view', view);
    if (weekOffset > 0) next.set('week_offset', String(weekOffset));
    if (selectedVenueSlug) next.set('venue', selectedVenueSlug);
    if (safePage > 1) next.set('page', String(safePage));

    const query = next.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [filters, pathname, safePage, selectedVenueSlug, view, weekOffset]);

  const updateFilters = (nextFilters: DiscoveryFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setCurrentPage(1);
    setSelectedVenueSlug(undefined);
  };

  return (
    <div className="stack-list">
      <div id="class-filters">
        <FilterBar
          locale={locale}
          citySlug={citySlug}
          filters={filters}
          categories={snapshot.categories.map((item) => ({ slug: item.slug, name: item.name[locale] }))}
          neighborhoods={snapshot.neighborhoods.map((item) => ({ slug: item.slug, name: item.name[locale] }))}
          styles={stylesForFilters}
          activeFilters={activeFilters}
          onUpdateFilters={updateFilters}
          onResetFilters={resetFilters}
        />
      </div>

      <section className="panel view-switcher-panel">
        <div className="view-switcher">
          <button type="button" className={`button ${view === 'list' ? 'button-primary' : 'button-ghost'}`} onClick={() => setView('list')}>
            {labels.list}
          </button>
          <button type="button" className={`button ${view === 'map' ? 'button-primary' : 'button-ghost'}`} onClick={() => setView('map')}>
            {labels.map}
          </button>
          <button type="button" className={`button ${view === 'calendar' ? 'button-primary' : 'button-ghost'}`} onClick={() => setView('calendar')}>
            {labels.calendar}
          </button>
        </div>
      </section>

      <section className="panel classes-visible-summary">
        <span className="meta-pill">
          {filteredSessions.length} {labels.visible}
        </span>
      </section>

      {view === 'map' ? (
        <MapResultsView
          locale={locale}
          citySlug={citySlug}
          cityName={cityName}
          bounds={bounds}
          visibleCount={filteredSessions.length}
          mapVenueSummaries={mapVenueSummaries}
          selectedVenueSlug={selectedVenueSlug}
          onSelectVenue={setSelectedVenueSlug}
          mapRenderMode={mapRenderMode}
          noResultsLabel={noResultsLabel}
        />
      ) : null}

      {view === 'list' ? (
        <ListResultsView
          locale={locale}
          pagedSessions={pagedSessions}
          resolvedSessionCards={resolvedSessionCards}
          scheduleLabel={scheduleLabel}
          noResultsLabel={noResultsLabel}
          totalPages={totalPages}
          currentPage={safePage}
          onPrevPage={safePage > 1 ? () => setCurrentPage((page) => Math.max(1, page - 1)) : undefined}
          onNextPage={safePage < totalPages ? () => setCurrentPage((page) => Math.min(totalPages, page + 1)) : undefined}
        />
      ) : null}

      {view === 'calendar' ? (
        <CalendarResultsView locale={locale} citySlug={citySlug} weekOffset={weekOffset} setWeekOffset={setWeekOffset} calendarEntries={calendarEntries} />
      ) : null}
    </div>
  );
}

async function fetchSearchIndex(searchIndexEndpoint: string) {
  try {
    const response = await fetch(searchIndexEndpoint, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'force-cache'
    });
    if (!response.ok) return null;
    return (await response.json()) as import('@/lib/catalog/public-models').PublicCitySearchIndex;
  } catch {
    return null;
  }
}
