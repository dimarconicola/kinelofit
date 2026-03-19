'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DateTime } from 'luxon';
import { Button, Chip } from '@heroui/react';

import { MapPanel } from '@/components/discovery/MapPanel';
import { SessionCard } from '@/components/discovery/SessionCard';
import type { ResolvedSessionCardData } from '@/lib/catalog/session-card-data';
import type { ClassView, Locale, Session, Venue } from '@/lib/catalog/types';

interface ClassesResultsClientProps {
  locale: Locale;
  citySlug: string;
  cityName: string;
  bounds: [number, number, number, number];
  initialView: ClassView;
  initialWeekOffset: number;
  sessionResults: Session[];
  pagedSessions: Session[];
  resolvedSessionCards: Record<string, ResolvedSessionCardData>;
  visibleVenues: Venue[];
  signedInEmail?: string;
  scheduleLabel: string;
  noResultsLabel: string;
  totalPages: number;
  currentPage: number;
  prevHref?: string;
  nextHref?: string;
}

type CalendarEntry = {
  sessionId: string;
  venueSlug: string;
  title: string;
  venueName: string;
  startLabel: string;
  endLabel: string;
  startAt: string;
};

export function ClassesResultsClient({
  locale,
  citySlug,
  cityName,
  bounds,
  initialView,
  initialWeekOffset,
  sessionResults,
  pagedSessions,
  resolvedSessionCards,
  visibleVenues,
  signedInEmail,
  scheduleLabel,
  noResultsLabel,
  totalPages,
  currentPage,
  prevHref,
  nextHref
}: ClassesResultsClientProps) {
  const pathname = usePathname();
  const [view, setView] = useState<ClassView>(initialView);
  const [weekOffset, setWeekOffset] = useState(initialWeekOffset);

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
    next.delete('page');
    const query = next.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [pathname, view, weekOffset]);

  const weekStart = useMemo(
    () => DateTime.now().setZone('Europe/Rome').startOf('week').plus({ weeks: weekOffset }),
    [weekOffset]
  );
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_item, index) => weekStart.plus({ days: index })), [weekStart]);

  const venueNames = useMemo(
    () => new Map(visibleVenues.map((venue) => [venue.slug, venue.name])),
    [visibleVenues]
  );
  const orderedVenues = useMemo(() => [...visibleVenues].sort((left, right) => left.name.localeCompare(right.name)), [visibleVenues]);

  const calendarByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    weekDays.forEach((day) => {
      map.set(day.toISODate() ?? '', []);
    });

    sessionResults.forEach((session) => {
      const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');
      const end = DateTime.fromISO(session.endAt).setZone('Europe/Rome');
      const dayKey = start.toISODate();
      if (!dayKey || !map.has(dayKey)) return;

      map.get(dayKey)?.push({
        sessionId: session.id,
        venueSlug: session.venueSlug,
        title: session.title[locale],
        venueName: venueNames.get(session.venueSlug) ?? session.venueSlug,
        startLabel: start.toFormat('HH:mm'),
        endLabel: end.toFormat('HH:mm'),
        startAt: session.startAt
      });
    });

    map.forEach((entries, key) => {
      map.set(
        key,
        entries.sort((left, right) => left.startAt.localeCompare(right.startAt))
      );
    });

    return map;
  }, [locale, sessionResults, venueNames, weekDays]);

  const hasAnyCalendarSessions = useMemo(
    () => Array.from(calendarByDay.values()).some((entries) => entries.length > 0),
    [calendarByDay]
  );
  const calendarRangeLabel = `${weekDays[0].toFormat(locale === 'it' ? 'd LLL' : 'LLL d')} - ${weekDays[6].toFormat(
    locale === 'it' ? 'd LLL' : 'LLL d'
  )}`;

  return (
    <div className="stack-list">
      <section className="panel view-switcher-panel">
        <div className="view-switcher">
          <Button radius="full" color={view === 'list' ? 'primary' : 'default'} variant={view === 'list' ? 'solid' : 'bordered'} onPress={() => setView('list')}>
            {labels.list}
          </Button>
          <Button radius="full" color={view === 'map' ? 'primary' : 'default'} variant={view === 'map' ? 'solid' : 'bordered'} onPress={() => setView('map')}>
            {labels.map}
          </Button>
          <Button
            radius="full"
            color={view === 'calendar' ? 'primary' : 'default'}
            variant={view === 'calendar' ? 'solid' : 'bordered'}
            onPress={() => setView('calendar')}
          >
            {labels.calendar}
          </Button>
        </div>
      </section>

      <section className="panel classes-visible-summary">
        <Chip radius="full" variant="flat" className="meta-pill">
          {sessionResults.length} {labels.visible}
        </Chip>
      </section>

      {view === 'map' ? (
        <section className="stack-list map-view-stack">
          <div className="map-fullwidth-shell">
            <MapPanel locale={locale} cityName={cityName} venues={visibleVenues} bounds={bounds} />
          </div>
          <section className="panel map-overview-panel">
            <div className="detail-header">
              <div>
                <p className="eyebrow">{labels.studios}</p>
                <h2>{labels.studiosOverview}</h2>
              </div>
              <Chip radius="full" variant="flat" className="meta-pill">
                {orderedVenues.length}
              </Chip>
            </div>
            <div className="map-venues-grid">
              {orderedVenues.map((venue) => (
                <NextLink key={venue.slug} href={`/${locale}/${citySlug}/studios/${venue.slug}`} className="map-venue-item map-venue-card">
                  <strong>{venue.name}</strong>
                  <span>{venue.address}</span>
                </NextLink>
              ))}
            </div>
          </section>
          <div className="stack-list">
            <div className="detail-header">
              <div>
                <p className="eyebrow">{labels.visibleClasses}</p>
                <h2>{labels.filteredClasses}</h2>
              </div>
            </div>
            {pagedSessions.length > 0 ? (
              pagedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  locale={locale}
                  resolved={resolvedSessionCards[session.id]}
                  signedInEmail={signedInEmail}
                  scheduleLabel={scheduleLabel}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>{noResultsLabel}</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {view === 'list' ? (
        <section className="stack-list">
          {pagedSessions.length > 0 ? (
            pagedSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                locale={locale}
                resolved={resolvedSessionCards[session.id]}
                signedInEmail={signedInEmail}
                scheduleLabel={scheduleLabel}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>{noResultsLabel}</p>
            </div>
          )}
        </section>
      ) : null}

      {view === 'calendar' ? (
        <section className="panel calendar-board">
          <div className="calendar-board-head">
            <div>
              <p className="eyebrow">{labels.calendar}</p>
              <h2>{calendarRangeLabel}</h2>
            </div>
            <div className="site-actions">
              <Button
                variant="ghost"
                radius="full"
                className="button button-ghost"
                onPress={() => setWeekOffset((value) => Math.max(0, value - 1))}
                isDisabled={weekOffset === 0}
              >
                {labels.previousWeek}
              </Button>
              <Button variant="flat" radius="full" className="button button-secondary" onPress={() => setWeekOffset((value) => value + 1)}>
                {labels.nextWeek}
              </Button>
            </div>
          </div>
          {hasAnyCalendarSessions ? (
            <div className="calendar-days-row">
              {weekDays.map((day) => {
                const dayKey = day.toISODate() ?? '';
                const entries = calendarByDay.get(dayKey) ?? [];
                return (
                  <article key={dayKey} className="calendar-day-column">
                    <div className="calendar-day-head">
                      <strong>{day.toFormat(locale === 'it' ? 'ccc d LLL' : 'ccc d LLL')}</strong>
                    </div>
                    <div className="calendar-day-list">
                      {entries.length > 0 ? (
                        entries.map((entry) => (
                          <NextLink key={entry.sessionId} href={`/${locale}/${citySlug}/studios/${entry.venueSlug}`} className="calendar-session-card">
                            <span>{entry.startLabel} - {entry.endLabel}</span>
                            <strong>{entry.title}</strong>
                            <small>{entry.venueName}</small>
                          </NextLink>
                        ))
                      ) : (
                        <p className="muted calendar-empty">{labels.noDaySessions}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>{labels.noWeekSessions}</p>
            </div>
          )}
        </section>
      ) : null}

      {view !== 'calendar' && totalPages > 1 ? (
        <section className="panel pagination-row">
          <span className="muted">
            {labels.page} {currentPage} / {totalPages}
          </span>
          <div className="site-actions">
            {prevHref ? (
              <Button as={NextLink} href={prevHref} variant="ghost" radius="full" className="button button-ghost">
                {labels.previous}
              </Button>
            ) : null}
            {nextHref ? (
              <Button as={NextLink} href={nextHref} color="primary" radius="full" className="button button-primary">
                {labels.next}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
