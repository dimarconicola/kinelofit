import Link from 'next/link';
import { DateTime } from 'luxon';

import { MapPanel } from '@/components/discovery/MapPanel';
import { FilterBar } from '@/components/discovery/FilterBar';
import { SessionCard } from '@/components/discovery/SessionCard';
import { getSessionUser } from '@/lib/auth/session';
import { getCityMetrics, getNeighborhoods, getPublicCategories, getSessions, getStyle, getVenue } from '@/lib/catalog/data';
import { parseFilters } from '@/lib/catalog/filters';
import { requirePublicCity } from '@/lib/catalog/guards';
import { getCityReadiness } from '@/lib/catalog/readiness';
import { styles } from '@/lib/catalog/seed';
import type { Session } from '@/lib/catalog/types';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

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
  const filters = parseFilters(await searchParams);
  const user = await getSessionUser();
  const sessionResults = getSessions(citySlug, filters);
  const metrics = getCityMetrics(citySlug);
  const readiness = getCityReadiness(citySlug);
  const categories = getPublicCategories(citySlug);
  const neighborhoods = getNeighborhoods(citySlug);
  const cityStyleSlugs = new Set(getSessions(citySlug, { date: 'week' }).map((session) => session.styleSlug));
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
    }
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
    filters.open_now === 'true' ? (locale === 'it' ? 'Aperto ora' : 'Open now') : null
  ].filter((item): item is string => Boolean(item));
  const groupedSessions = Object.values(
    sessionResults.reduce<Record<string, { date: string; sessions: Session[] }>>((groups, session) => {
      const key = DateTime.fromISO(session.startAt).setZone(city.timezone).toISODate();
      if (!key) return groups;
      if (!groups[key]) {
        groups[key] = { date: key, sessions: [] };
      }
      groups[key].sessions.push(session);
      return groups;
    }, {})
  )
    .map((group) => ({
      ...group,
      sessions: [...group.sessions].sort((left, right) => left.startAt.localeCompare(right.startAt))
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
  const today = DateTime.now().setZone(city.timezone);
  const intro =
    locale === 'it'
      ? 'Calendario reale di Palermo, raggruppato per giorno e collegato a prenotazioni o contatti utili.'
      : 'A real Palermo timetable, grouped by day and linked to live booking or contact paths.';
  const trustCopy =
    locale === 'it'
      ? 'Mostriamo solo sessioni con un percorso di azione chiaro. Oggi Palermo e sotto la soglia pubblica di 75 sessioni settimanali, quindi il prodotto resta preciso ma non ancora completo.'
      : 'We only surface sessions with a clear action path. Palermo is still below the 75-session public gate, so this is precise inventory, not yet full city coverage.';
  const badgeCopy =
    locale === 'it'
      ? { matches: 'corrispondenze', venues: 'studi', styles: 'stili attivi', sessions: 'sessioni', back: 'Torna alla citta' }
      : { matches: 'matches', venues: 'venues', styles: 'live styles', sessions: 'sessions', back: 'Back to city' };

  return (
    <div className="stack-list classes-page">
      <section className="classes-hero">
        <div className="hero-copy classes-hero-main">
          <p className="eyebrow">{city.name[locale]}</p>
          <h1>{dict.classes}</h1>
          <p className="lead">{intro}</p>
          <div className="badge-row">
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
          <div className="site-actions">
            <Link href={`/${locale}/${citySlug}`} className="button button-ghost">
              {badgeCopy.back}
            </Link>
            <Link href={`/${locale}/${citySlug}/collections/today-nearby`} className="button button-secondary">
              {dict.todayNearby}
            </Link>
          </div>
        </div>
        <div className="panel classes-hero-side">
          <p className="eyebrow">{locale === 'it' ? 'Strato di fiducia' : 'Trust layer'}</p>
          <h2>{readiness.passesGate ? (locale === 'it' ? 'Pronto per il pubblico' : 'Ready for public launch') : locale === 'it' ? 'Catalogo in consolidamento' : 'Catalog still consolidating'}</h2>
          <p className="muted">{trustCopy}</p>
          <div className="classes-stat-grid">
            <div className="classes-stat-card">
              <strong>{metrics.sessions}</strong>
              <span>{locale === 'it' ? 'Sessioni nei prossimi 7 giorni' : 'Sessions in the next 7 days'}</span>
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
        styles={styles
          .filter((style) => cityStyleSlugs.has(style.slug))
          .map((style) => ({ slug: style.slug, name: getStyle(style.slug)?.name[locale] ?? style.slug }))}
        resultCount={sessionResults.length}
        activeFilters={activeFilters}
      />
      <section className="discovery-layout discovery-layout-enhanced">
        <div className="stack-list">
          {groupedSessions.length > 0 ? (
            groupedSessions.map((group) => {
              const groupDate = DateTime.fromISO(group.date).setZone(city.timezone);
              const dayEyebrow = groupDate.hasSame(today, 'day')
                ? locale === 'it'
                  ? 'Oggi'
                  : 'Today'
                : groupDate.hasSame(today.plus({ days: 1 }), 'day')
                  ? locale === 'it'
                    ? 'Domani'
                    : 'Tomorrow'
                  : groupDate.toFormat(locale === 'it' ? 'cccc' : 'cccc');
              const venueCount = new Set(group.sessions.map((session) => session.venueSlug)).size;

              return (
                <section key={group.date} className="session-day-group panel">
                  <div className="day-group-header">
                    <div>
                      <p className="eyebrow">{dayEyebrow}</p>
                      <h2>{groupDate.toFormat(locale === 'it' ? 'd LLLL' : 'd LLLL')}</h2>
                    </div>
                    <div className="day-group-meta">
                      <span className="meta-pill">
                        {group.sessions.length} {badgeCopy.sessions}
                      </span>
                      <span className="meta-pill">
                        {venueCount} {badgeCopy.venues}
                      </span>
                    </div>
                  </div>
                  <div className="session-day-stack">
                    {group.sessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        locale={locale}
                        signedInEmail={user?.email}
                        saveLabel={dict.save}
                        savedLabel={dict.unsave}
                        scheduleLabel={dict.saveSchedule}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="empty-state">
              <p>{dict.noResults}</p>
            </div>
          )}
        </div>
        <MapPanel locale={locale} citySlug={citySlug} cityName={city.name[locale]} venues={visibleVenues} bounds={city.bounds} />
      </section>
    </div>
  );
}
