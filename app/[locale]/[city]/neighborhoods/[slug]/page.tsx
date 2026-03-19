import { notFound } from 'next/navigation';
import NextLink from 'next/link';
import { Button } from '@heroui/react';

import { MapPanel } from '@/components/discovery/MapPanel';
import { SessionCard } from '@/components/discovery/SessionCard';
import { getSessionUser } from '@/lib/auth/session';
import { resolveSessionCardData } from '@/lib/catalog/session-card-data';
import { requirePublicCityServer } from '@/lib/catalog/guards';
import { getNeighborhoodSessions, getNeighborhoods, getVenue } from '@/lib/catalog/server-data';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function NeighborhoodPage({ params }: { params: Promise<{ locale: string; city: string; slug: string }> }) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const [city, neighborhoods, sessions, user] = await Promise.all([
    requirePublicCityServer(citySlug),
    getNeighborhoods(citySlug),
    getNeighborhoodSessions(citySlug, slug),
    getSessionUser()
  ]);
  const neighborhood = neighborhoods.find((item) => item.slug === slug);
  if (!neighborhood) notFound();
  const venues = (await Promise.all([...new Set(sessions.map((session) => session.venueSlug))].map((venueSlug) => getVenue(venueSlug)))).filter(
    (venue): venue is NonNullable<typeof venue> => Boolean(venue)
  );
  const resolvedSessions = await resolveSessionCardData(sessions);
  const labels = locale === 'it' ? { neighborhood: 'Quartiere' } : { neighborhood: 'Neighborhood' };

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">{labels.neighborhood}</p>
        <h1>{neighborhood.name[locale]}</h1>
        <p className="lead">{neighborhood.description[locale]}</p>
        <div className="site-actions">
          <Button
            as={NextLink}
            href={`/${locale}/${citySlug}/classes?neighborhood=${neighborhood.slug}`}
            color="primary"
            radius="full"
            className="button button-primary"
          >
            {dict.exploreClasses}
          </Button>
        </div>
      </section>
      <section className="collection-layout">
        <div className="stack-list">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              locale={locale}
              resolved={resolvedSessions.get(session.id)!}
              signedInEmail={user?.email}
              scheduleLabel={dict.saveSchedule}
            />
          ))}
        </div>
        <MapPanel locale={locale} cityName={city.name[locale]} venues={venues} bounds={city.bounds} />
      </section>
    </div>
  );
}
