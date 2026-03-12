import { notFound } from 'next/navigation';

import { MapPanel } from '@/components/discovery/MapPanel';
import { SessionCard } from '@/components/discovery/SessionCard';
import { getSessionUser } from '@/lib/auth/session';
import { getNeighborhoodSessions, getNeighborhoods, getVenue } from '@/lib/catalog/data';
import { requirePublicCity } from '@/lib/catalog/guards';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function NeighborhoodPage({ params }: { params: Promise<{ locale: string; city: string; slug: string }> }) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const city = requirePublicCity(citySlug);
  const neighborhood = getNeighborhoods(citySlug).find((item) => item.slug === slug);
  if (!neighborhood) notFound();
  const sessions = getNeighborhoodSessions(citySlug, slug);
  const venues = [...new Set(sessions.map((session) => session.venueSlug))]
    .map((venueSlug) => getVenue(venueSlug))
    .filter((venue): venue is NonNullable<typeof venue> => Boolean(venue));
  const user = await getSessionUser();

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">Neighborhood</p>
        <h1>{neighborhood.name[locale]}</h1>
        <p className="lead">{neighborhood.description[locale]}</p>
      </section>
      <section className="collection-layout">
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
        <MapPanel locale={locale} citySlug={citySlug} cityName={city.name[locale]} venues={venues} bounds={city.bounds} />
      </section>
    </div>
  );
}
