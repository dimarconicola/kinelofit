import { notFound } from 'next/navigation';

import { TodayNearbyLocationHint } from '@/components/discovery/TodayNearbyLocationHint';
import { SessionCard } from '@/components/discovery/SessionCard';
import { getSessionUser } from '@/lib/auth/session';
import { getCollectionSessions, getCollections, getVenue } from '@/lib/catalog/data';
import { requirePublicCity } from '@/lib/catalog/guards';
import { getEditorialComponent } from '@/lib/content/registry';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

const toCoordinate = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const haversineKm = (origin: { lat: number; lng: number }, target: { lat: number; lng: number }) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(target.lat - origin.lat);
  const lngDelta = toRadians(target.lng - origin.lng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(target.lat)) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; city: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const city = requirePublicCity(citySlug);
  const collection = getCollections(citySlug).find((item) => item.slug === slug);
  if (!collection) notFound();
  const rawSearch = await searchParams;
  const lat = toCoordinate(Array.isArray(rawSearch.lat) ? rawSearch.lat[0] : rawSearch.lat);
  const lng = toCoordinate(Array.isArray(rawSearch.lng) ? rawSearch.lng[0] : rawSearch.lng);
  const hasGeolocation = typeof lat === 'number' && typeof lng === 'number';
  const fallbackCenter = {
    lat: (city.bounds[1] + city.bounds[3]) / 2,
    lng: (city.bounds[0] + city.bounds[2]) / 2
  };
  const orderOrigin = hasGeolocation ? { lat: lat as number, lng: lng as number } : fallbackCenter;

  const sessions = slug === 'today-nearby'
    ? getCollectionSessions(citySlug, slug)
        .map((session) => {
          const venue = getVenue(session.venueSlug);
          const distance = venue ? haversineKm(orderOrigin, venue.geo) : Number.POSITIVE_INFINITY;
          return { session, distance };
        })
        .sort((left, right) => left.distance - right.distance || left.session.startAt.localeCompare(right.session.startAt))
        .map((item) => item.session)
    : getCollectionSessions(citySlug, slug);
  const Component = getEditorialComponent(citySlug, slug, locale);
  const user = await getSessionUser();
  const statusCopy =
    locale === 'it'
      ? {
          collection: 'Collezione',
          eyebrow: 'Ordine risultati',
          title: slug === 'today-nearby' ? 'Vicino a te oggi' : 'Collezione aggiornata',
          body:
            slug === 'today-nearby'
              ? 'Se la geolocalizzazione non e disponibile, ordiniamo dal centro citta.'
              : 'Questa selezione resta aggiornata con fonti locali verificate.'
        }
      : {
          collection: 'Collection',
          eyebrow: 'Result ordering',
          title: slug === 'today-nearby' ? 'Today nearby' : 'Curated collection',
          body:
            slug === 'today-nearby'
              ? 'If location is unavailable, results are ordered from the city center.'
              : 'This selection stays current with verified local sources.'
        };

  return (
    <div className="stack-list">
      <section className="collection-layout">
        <div className="panel">
          <p className="eyebrow">{statusCopy.collection}</p>
          <h1>{collection.title[locale]}</h1>
          <p className="lead">{collection.description[locale]}</p>
          {Component ? <Component /> : null}
        </div>
        <div className="panel collection-order-panel">
          <p className="eyebrow">{statusCopy.eyebrow}</p>
          <h2>{statusCopy.title}</h2>
          <p className="lead">{statusCopy.body}</p>
          {slug === 'today-nearby' ? (
            <TodayNearbyLocationHint locale={locale} cityName={city.name[locale]} hasGeolocation={hasGeolocation} />
          ) : null}
        </div>
      </section>
      <section className="panel">
        <div className="stack-list">
          {sessions.map((session) => (
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
    </div>
  );
}
