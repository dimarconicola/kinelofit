'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import type { ResolvedSessionCardData } from '@/lib/catalog/session-card-data';
import type { ClassView, Locale, Session } from '@/lib/catalog/types';
import type { CalendarEntry, MapRenderMode, MapVenueSummary } from '@/components/discovery/classes-results.types';
import type { RuntimeCapabilities } from '@/lib/runtime/capabilities';

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
  initialView: ClassView;
  initialWeekOffset: number;
  visibleCount: number;
  pagedSessions: Session[];
  resolvedSessionCards: Record<string, ResolvedSessionCardData>;
  calendarEntries: CalendarEntry[];
  mapVenueSummaries: MapVenueSummary[];
  initialSelectedVenueSlug?: string;
  mapRenderMode: MapRenderMode;
  signedInEmail?: string;
  scheduleLabel: string;
  runtimeCapabilities: RuntimeCapabilities;
  noResultsLabel: string;
  totalPages: number;
  currentPage: number;
  prevHref?: string;
  nextHref?: string;
}

export function ClassesResultsClient({
  locale,
  citySlug,
  cityName,
  bounds,
  initialView,
  initialWeekOffset,
  visibleCount,
  pagedSessions,
  resolvedSessionCards,
  calendarEntries,
  mapVenueSummaries,
  initialSelectedVenueSlug,
  mapRenderMode,
  signedInEmail,
  scheduleLabel,
  runtimeCapabilities,
  noResultsLabel,
  totalPages,
  currentPage,
  prevHref,
  nextHref
}: ClassesResultsClientProps) {
  const pathname = usePathname();
  const [view, setView] = useState<ClassView>(initialView);
  const [weekOffset, setWeekOffset] = useState(initialWeekOffset);
  const [selectedVenueSlug, setSelectedVenueSlug] = useState<string | undefined>(initialSelectedVenueSlug);

  const labels =
    locale === 'it'
      ? {
          list: 'Lista',
          map: 'Vista mappa',
          calendar: 'Calendario',
          studios: 'Studi',
          studiosOverview: 'Tutti gli studi visibili',
          visibleClasses: 'Classi visibili',
          filteredClasses: 'Lezioni filtrate',
          visible: 'classi visibili',
          page: 'Pagina',
          previous: 'Precedente',
          next: 'Successiva',
          previousWeek: 'Settimana precedente',
          nextWeek: 'Settimana successiva',
          noDaySessions: 'Nessuna classe in questo giorno.',
          noWeekSessions: 'Nessuna classe disponibile questa settimana.'
        }
      : {
          list: 'List',
          map: 'Map view',
          calendar: 'Calendar',
          studios: 'Studios',
          studiosOverview: 'All visible studios',
          visibleClasses: 'Visible classes',
          filteredClasses: 'Filtered classes',
          visible: 'visible classes',
          page: 'Page',
          previous: 'Previous',
          next: 'Next',
          previousWeek: 'Previous week',
          nextWeek: 'Next week',
          noDaySessions: 'No classes on this day.',
          noWeekSessions: 'No classes available this week.'
        };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = new URLSearchParams(window.location.search);
    next.set('view', view);
    if (weekOffset > 0) {
      next.set('week_offset', String(weekOffset));
    } else {
      next.delete('week_offset');
    }
    if (selectedVenueSlug) {
      next.set('venue', selectedVenueSlug);
    } else {
      next.delete('venue');
    }
    next.delete('page');
    const query = next.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [pathname, selectedVenueSlug, view, weekOffset]);

  useEffect(() => {
    if (!selectedVenueSlug) return;
    if (mapVenueSummaries.some((venue) => venue.venueSlug === selectedVenueSlug)) return;
    setSelectedVenueSlug(undefined);
  }, [mapVenueSummaries, selectedVenueSlug]);

  return (
    <div className="stack-list">
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
          {visibleCount} {labels.visible}
        </span>
      </section>

      {view === 'map' ? (
        <MapResultsView
          locale={locale}
          citySlug={citySlug}
          cityName={cityName}
          bounds={bounds}
          visibleCount={visibleCount}
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
          signedInEmail={signedInEmail}
          scheduleLabel={scheduleLabel}
          runtimeCapabilities={runtimeCapabilities}
          noResultsLabel={noResultsLabel}
          totalPages={totalPages}
          currentPage={currentPage}
          prevHref={prevHref}
          nextHref={nextHref}
        />
      ) : null}

      {view === 'calendar' ? (
        <CalendarResultsView locale={locale} citySlug={citySlug} weekOffset={weekOffset} setWeekOffset={setWeekOffset} calendarEntries={calendarEntries} />
      ) : null}
    </div>
  );
}
