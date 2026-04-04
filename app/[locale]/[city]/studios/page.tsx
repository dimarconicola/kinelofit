import { DateTime } from 'luxon';
import { notFound } from 'next/navigation';

import { StudiosDirectoryClient, type StudioDirectoryCard } from '@/components/discovery/StudiosDirectoryClient';
import { VenueCover } from '@/components/catalog/VenueCover';
import { ServerButtonLink, ServerCardLink } from '@/components/ui/server';
import { applyPublicCityFilters, buildFilteredMapVenueSummaries } from '@/lib/catalog/public-models';
import { getPublicCitySnapshot } from '@/lib/catalog/public-read-models';
import { getMapRenderMode } from '@/lib/map/runtime';
import { resolveLocale } from '@/lib/i18n/routing';

const isStudiosView = (value: string | null): value is 'list' | 'map' => value === 'list' || value === 'map';

export default async function StudiosIndexPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale, city: citySlug } = await params;
  const locale = resolveLocale(rawLocale);
  const rawSearch = await searchParams;
  const requestedView = typeof rawSearch.view === 'string' ? rawSearch.view : null;
  const requestedVenue = typeof rawSearch.venue === 'string' ? rawSearch.venue : undefined;
  const initialView = isStudiosView(requestedView) ? requestedView : 'list';

  const snapshot = await getPublicCitySnapshot(citySlug);
  if (!snapshot) notFound();

  const city = snapshot.city;
  const venues = snapshot.venues;
  const neighborhoods = snapshot.neighborhoods;
  const styles = snapshot.styles;
  const weekSessions = applyPublicCityFilters(snapshot, { date: 'week' });
  const mapVenueSummaries = buildFilteredMapVenueSummaries({ snapshot, locale, sessions: weekSessions });
  const summaryBySlug = new Map(mapVenueSummaries.map((summary) => [summary.venueSlug, summary]));
  const studioSummaryBySlug = new Map(snapshot.studioSummaries.map((summary) => [summary.venueSlug, summary] as const));
  const styleBySlug = new Map(styles.map((style) => [style.slug, style.name[locale]]));

  const cards: StudioDirectoryCard[] = venues.map((venue) => {
    const summary = summaryBySlug.get(venue.slug);
    const studioSummary = studioSummaryBySlug.get(venue.slug);
    const nextSessionLabel = studioSummary?.nextSessionStartAt
      ? DateTime.fromISO(studioSummary.nextSessionStartAt).setZone('Europe/Rome').toFormat(locale === 'it' ? 'ccc d LLL · HH:mm' : 'ccc d LLL · HH:mm')
      : undefined;

    return {
      slug: venue.slug,
      name: venue.name,
      neighborhoodName: neighborhoods.find((item) => item.slug === venue.neighborhoodSlug)?.name[locale] ?? venue.address,
      address: venue.address,
      geo: venue.geo,
      tagline: venue.tagline[locale],
      sessionCount: studioSummary?.sessionCount ?? 0,
      nextSessionLabel,
      styles: venue.styleSlugs.map((slug) => styleBySlug.get(slug)).filter((value): value is string => Boolean(value)).slice(0, 3),
      studioHref: `/${locale}/${citySlug}/studios/${venue.slug}`,
      primaryCtaHref: summary?.primaryCtaHref,
      primaryCtaLabel: summary?.primaryCtaLabel
    };
  });

  const selectedVenueSlug = mapVenueSummaries.some((venue) => venue.venueSlug === requestedVenue) ? requestedVenue : undefined;
  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Studi',
          title: 'Dove praticare a Palermo',
          lead:
            'Una directory chiara degli studi, con lista alfabetica, ritmo settimanale e mappa sincronizzata per decidere prima il luogo e poi l’orario.',
          openClasses: 'Apri tutte le classi',
          openTeachers: 'Apri insegnanti',
          weekly: 'Classi settimanali',
          verifiedStudios: 'Studi verificati',
          activeAreas: 'Quartieri attivi'
        }
      : {
          eyebrow: 'Studios',
          title: 'Where to practise in Palermo',
          lead:
            'A clear studio directory with alphabetical browsing, weekly rhythm, and a synced map so you can choose the place before the slot.',
          openClasses: 'Open all classes',
          openTeachers: 'Open teachers',
          weekly: 'Weekly classes',
          verifiedStudios: 'Verified studios',
          activeAreas: 'Active neighborhoods'
        };

  return (
    <div className="stack-list studios-directory-page">
      <section className="city-hero studios-directory-hero">
        <div className="hero-copy city-hero-main">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.lead}</p>
          <div className="site-actions">
            <ServerButtonLink href={`/${locale}/${citySlug}/classes`} className="button-primary">
              {copy.openClasses}
            </ServerButtonLink>
            <ServerButtonLink href={`/${locale}/${citySlug}/teachers`} className="button-ghost">
              {copy.openTeachers}
            </ServerButtonLink>
          </div>
        </div>
        <div className="hero-copy city-hero-metrics">
          <div className="hero-metrics">
            <div className="stat-card">
              <strong>{weekSessions.length}</strong>
              <span>{copy.weekly}</span>
            </div>
            <div className="stat-card">
              <strong>{venues.length}</strong>
              <span>{copy.verifiedStudios}</span>
            </div>
            <div className="stat-card">
              <strong>{new Set(venues.map((venue) => venue.neighborhoodSlug)).size}</strong>
              <span>{copy.activeAreas}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="studios-directory-feature-strip">
        {venues.slice(0, 3).map((venue) => (
          <ServerCardLink key={venue.slug} href={`/${locale}/${citySlug}/studios/${venue.slug}`} className="studios-directory-feature-card">
            <VenueCover venue={venue} locale={locale} className="studios-directory-feature-cover" />
            <div className="studios-directory-feature-copy">
              <p className="eyebrow">{neighborhoods.find((item) => item.slug === venue.neighborhoodSlug)?.name[locale] ?? venue.address}</p>
              <h2>{venue.name}</h2>
              <p className="muted">{venue.tagline[locale]}</p>
            </div>
          </ServerCardLink>
        ))}
      </section>

      <StudiosDirectoryClient
        locale={locale}
        citySlug={citySlug}
        cityName={city.name[locale]}
        bounds={city.bounds}
        cards={cards}
        mapVenueSummaries={mapVenueSummaries}
        initialView={initialView}
        initialSelectedVenueSlug={selectedVenueSlug}
        mapRenderMode={getMapRenderMode()}
      />
    </div>
  );
}
