import Link from 'next/link';
import { DateTime } from 'luxon';

import { FilterBar } from '@/components/discovery/FilterBar';
import { MapPanel } from '@/components/discovery/MapPanel';
import { SessionCard } from '@/components/discovery/SessionCard';
import { getSessionUser } from '@/lib/auth/session';
import { getCityMetrics, getNeighborhoods, getPublicCategories, getSessions, getStyle, getVenue } from '@/lib/catalog/data';
import { parseFilters } from '@/lib/catalog/filters';
import { requirePublicCity } from '@/lib/catalog/guards';
import { getCityReadiness } from '@/lib/catalog/readiness';
import { styles } from '@/lib/catalog/seed';
import type { ClassView, Session } from '@/lib/catalog/types';
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

type CalendarEntry = {
  session: Session;
  venueName: string;
  startLabel: string;
  endLabel: string;
  top: number;
  height: number;
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
  const city = requirePublicCity(citySlug);
  const rawSearch = await searchParams;
  const urlParams = flattenParams(rawSearch);

  const filters = parseFilters(rawSearch);
  const user = await getSessionUser();
  const requestedView = urlParams.get('view');
  const view: ClassView = isClassView(requestedView) ? requestedView : 'list';

  const requestedPage = Number.parseInt(urlParams.get('page') ?? '1', 10);
  const metrics = getCityMetrics(citySlug);
  const readiness = getCityReadiness(citySlug);
  const categories = getPublicCategories(citySlug);
  const neighborhoods = getNeighborhoods(citySlug);
  const cityStyleSlugs = new Set(getSessions(citySlug, { date: 'week' }).map((session) => session.styleSlug));

  const sessionResults = getSessions(citySlug, { ...filters, view }).sort((left, right) => left.startAt.localeCompare(right.startAt));

  const visibleVenues = [...new Set(sessionResults.map((session) => session.venueSlug))]
    .map((slug) => getVenue(slug))
    .filter((venue): venue is NonNullable<typeof venue> => Boolean(venue));

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
      midday: locale === 'it' ? 'Meta giornata' : 'Midday',
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

  const activeFilters = [
    filters.date ? filterValueToLabel.date[filters.date] : null,
    filters.time_bucket ? filterValueToLabel.time_bucket[filters.time_bucket] : null,
    filters.category ? categories.find((category) => category.slug === filters.category)?.name[locale] ?? filters.category : null,
    filters.style ? getStyle(filters.style)?.name[locale] ?? filters.style : null,
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

  const today = DateTime.now().setZone(city.timezone);
  const intro =
    locale === 'it'
      ? 'Classi verificate, filtri coerenti e azioni dirette su prenotazione o contatto.'
      : 'Verified classes with consistent filters and direct booking/contact actions.';

  const trustCopy =
    locale === 'it'
      ? 'La soglia resta visibile per mantenere trasparenza su copertura e affidabilita locale.'
      : 'The supply gate stays visible so coverage and trust remain transparent.';

  const badgeCopy =
    locale === 'it'
      ? { matches: 'corrispondenze', venues: 'studi', styles: 'stili attivi', sessions: 'sessioni', back: 'Torna alla citta' }
      : { matches: 'matches', venues: 'venues', styles: 'live styles', sessions: 'sessions', back: 'Back to city' };

  const weekStart = today.startOf('week');
  const weekDays = Array.from({ length: 7 }, (_item, index) => weekStart.plus({ days: index }));
  const weekStartIso = weekStart.startOf('day');
  const weekEndIso = weekStart.plus({ days: 7 }).startOf('day');
  const calendarSessions = sessionResults.filter((session) => {
    const start = DateTime.fromISO(session.startAt).setZone(city.timezone);
    return start >= weekStartIso && start < weekEndIso;
  });

  const timelineStartHour = 6;
  const timelineEndHour = 22;
  const totalTimelineMinutes = (timelineEndHour - timelineStartHour) * 60;

  const calendarByDay = new Map<string, CalendarEntry[]>();
  for (const day of weekDays) {
    calendarByDay.set(day.toISODate() ?? '', []);
  }

  for (const session of calendarSessions) {
    const venue = getVenue(session.venueSlug);
    if (!venue) continue;

    const start = DateTime.fromISO(session.startAt).setZone(city.timezone);
    const end = DateTime.fromISO(session.endAt).setZone(city.timezone);
    const dayKey = start.toISODate();
    if (!dayKey || !calendarByDay.has(dayKey)) continue;

    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    const minMinutes = timelineStartHour * 60;
    const maxMinutes = timelineEndHour * 60;
    const clampedStart = Math.max(startMinutes, minMinutes);
    const clampedEnd = Math.min(endMinutes, maxMinutes);
    if (clampedEnd <= clampedStart) continue;

    const top = ((clampedStart - minMinutes) / totalTimelineMinutes) * 100;
    const height = Math.max(5, ((clampedEnd - clampedStart) / totalTimelineMinutes) * 100);

    calendarByDay.get(dayKey)?.push({
      session,
      venueName: venue.name,
      startLabel: start.toFormat('HH:mm'),
      endLabel: end.toFormat('HH:mm'),
      top,
      height
    });
  }

  for (const [dayKey, entries] of calendarByDay.entries()) {
    calendarByDay.set(
      dayKey,
      entries.sort((left, right) => left.session.startAt.localeCompare(right.session.startAt))
    );
  }

  const viewTabs = [
    { slug: 'list' as const, label: dict.viewList },
    { slug: 'map' as const, label: locale === 'it' ? 'Vista mappa' : 'Map view' },
    { slug: 'calendar' as const, label: dict.viewCalendar }
  ];

  return (
    <div className="stack-list classes-page classes-page-refresh">
      <section className="classes-hero">
        <div className="hero-copy classes-hero-main">
          <p className="eyebrow">{city.name[locale]}</p>
          <h1>{dict.classes}</h1>
          <p className="lead">{intro}</p>
          <div className="badge-row classes-hero-badges">
            <span className="meta-pill">
              {sessionResults.length} {badgeCopy.matches}
            </span>
            <span className="meta-pill">
              {visibleVenues.length} {badgeCopy.venues}
            </span>
            <span className="meta-pill">
              {metrics.styles} {badgeCopy.styles}
            </span>
          </div>
          <div className="site-actions classes-hero-actions">
            <Link href={`/${locale}/${citySlug}`} className="button button-ghost">
              {badgeCopy.back}
            </Link>
            <Link href={`/${locale}/${citySlug}/collections/today-nearby`} className="button button-secondary">
              {dict.todayNearby}
            </Link>
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

      <section className="panel view-switcher-panel">
        <div className="view-switcher">
          {viewTabs.map((tab) => (
            <Link
              key={tab.slug}
              href={hrefWith({ view: tab.slug, page: undefined })}
              className={`chip-option ${view === tab.slug ? 'chip-option-active' : ''}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>

      <FilterBar
        locale={locale}
        citySlug={citySlug}
        view={view}
        filters={filters}
        categories={categories.map((item) => ({ slug: item.slug, name: item.name[locale] }))}
        neighborhoods={neighborhoods.map((item) => ({ slug: item.slug, name: item.name[locale] }))}
        styles={styles
          .filter((style) => cityStyleSlugs.has(style.slug))
          .map((style) => ({ slug: style.slug, name: getStyle(style.slug)?.name[locale] ?? style.slug }))}
        resultCount={sessionResults.length}
        activeFilters={activeFilters}
      />

      {view === 'map' ? (
        <section className="discovery-layout discovery-layout-enhanced">
          <MapPanel locale={locale} citySlug={citySlug} cityName={city.name[locale]} venues={visibleVenues} bounds={city.bounds} />
          <div className="stack-list">
            {pagedSessions.length > 0 ? (
              pagedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  locale={locale}
                  signedInEmail={user?.email}
                  saveLabel={dict.save}
                  savedLabel={dict.unsave}
                  scheduleLabel={dict.saveSchedule}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>{dict.noResults}</p>
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
                signedInEmail={user?.email}
                saveLabel={dict.save}
                savedLabel={dict.unsave}
                scheduleLabel={dict.saveSchedule}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>{dict.noResults}</p>
            </div>
          )}
        </section>
      ) : null}

      {view === 'calendar' ? (
        <section className="panel calendar-view-shell">
          <div className="calendar-grid">
            <div className="calendar-time-column" aria-hidden="true">
              {Array.from({ length: timelineEndHour - timelineStartHour + 1 }, (_item, idx) => (
                <span key={`${timelineStartHour + idx}`}>{String(timelineStartHour + idx).padStart(2, '0')}:00</span>
              ))}
            </div>
            <div className="calendar-days-row">
              {weekDays.map((day) => {
                const dayKey = day.toISODate() ?? '';
                const items = calendarByDay.get(dayKey) ?? [];
                return (
                  <div key={dayKey} className="calendar-day-column">
                    <div className="calendar-day-head">
                      <strong>{day.toFormat(locale === 'it' ? 'ccc d LLL' : 'ccc d LLL')}</strong>
                    </div>
                    <div className="calendar-day-lane">
                      {items.map((entry) => (
                        <Link
                          key={entry.session.id}
                          href={`/${locale}/${citySlug}/studios/${entry.session.venueSlug}`}
                          className="calendar-session-pill"
                          style={{ top: `${entry.top}%`, height: `${entry.height}%` }}
                        >
                          <span>{entry.startLabel}–{entry.endLabel}</span>
                          <strong>{entry.session.title[locale]}</strong>
                          <small>{entry.venueName}</small>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {view !== 'calendar' && totalPages > 1 ? (
        <section className="panel pagination-row">
          <span className="muted">
            {locale === 'it' ? 'Pagina' : 'Page'} {currentPage} / {totalPages}
          </span>
          <div className="site-actions">
            {currentPage > 1 ? (
              <Link href={hrefWith({ page: String(currentPage - 1) })} className="button button-ghost">
                {locale === 'it' ? 'Precedente' : 'Previous'}
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link href={hrefWith({ page: String(currentPage + 1) })} className="button button-primary">
                {locale === 'it' ? 'Successiva' : 'Next'}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
