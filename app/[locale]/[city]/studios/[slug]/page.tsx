import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DateTime } from 'luxon';

import { ClaimForm } from '@/components/forms/ClaimForm';
import { SessionCard } from '@/components/discovery/SessionCard';
import { FavoriteButton } from '@/components/state/FavoriteButton';
import { getSessionUser } from '@/lib/auth/session';
import { getNeighborhoods, getVenue, getVenueSessions } from '@/lib/catalog/data';
import { requirePublicCity } from '@/lib/catalog/guards';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';
import { formatVerifiedAt } from '@/lib/ui/format';

export default async function StudioPage({ params }: { params: Promise<{ locale: string; city: string; slug: string }> }) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  requirePublicCity(citySlug);
  const venue = getVenue(slug);
  if (!venue) notFound();

  const neighborhood = getNeighborhoods(citySlug).find((item) => item.slug === venue.neighborhoodSlug);
  const sessions = getVenueSessions(slug)
    .sort((left, right) => left.startAt.localeCompare(right.startAt))
    .slice(0, 20);
  const user = await getSessionUser();
  const groupedSessions = Object.values(
    sessions.reduce<Record<string, typeof sessions>>((groups, session) => {
      const key = DateTime.fromISO(session.startAt).setZone('Europe/Rome').toISODate();
      if (!key) return groups;
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
      return groups;
    }, {})
  );
  const sessionsByDay = groupedSessions.map((daySessions) => daySessions.sort((left, right) => left.startAt.localeCompare(right.startAt)));
  const hasWebsite = venue.bookingTargetOrder.find((target) => target.endsWith('-website'));
  const profileCopy =
    locale === 'it'
      ? {
          eyebrow: 'Studio',
          schedule: 'Agenda verificata',
          trust: 'Strato di fiducia',
          weekdaySessions: 'sessioni a calendario',
          languages: 'lingue',
          styles: 'stili',
          source: 'Fonte primaria',
          upcoming: 'Prossime sessioni',
          claim: dict.claimStudio,
          website: 'Sito ufficiale'
        }
      : {
          eyebrow: 'Studio',
          schedule: 'Verified timetable',
          trust: 'Trust layer',
          weekdaySessions: 'scheduled sessions',
          languages: 'languages',
          styles: 'styles',
          source: 'Primary source',
          upcoming: 'Upcoming sessions',
          claim: dict.claimStudio,
          website: 'Official website'
        };

  return (
    <div className="stack-list">
      <section className="detail-hero profile-hero">
        <div className="panel profile-main">
          <p className="eyebrow">{profileCopy.eyebrow}</p>
          <h1>{venue.name}</h1>
          <p className="lead">{venue.description[locale]}</p>
          <div className="badge-row">
            {venue.amenities.map((amenity) => (
              <span key={amenity} className="meta-pill">{amenity}</span>
            ))}
          </div>
          <p className="muted">{venue.address} · {neighborhood?.name[locale]}</p>
          <p className="muted">{venue.freshnessNote[locale]} · {formatVerifiedAt(venue.lastVerifiedAt, locale)}</p>
          <div className="site-actions profile-links">
            <FavoriteButton entitySlug={venue.slug} entityType="venue" locale={locale} signedInEmail={user?.email} label={dict.save} savedLabel={dict.unsave} />
            <Link href={`/${locale}/claim/${venue.slug}`} className="button button-ghost">
              {profileCopy.claim}
            </Link>
            {hasWebsite ? (
              <a href={venue.sourceUrl} className="button button-secondary" target="_blank" rel="noreferrer">
                {profileCopy.website}
              </a>
            ) : null}
          </div>
        </div>
        <div className="panel profile-side">
          <p className="eyebrow">{profileCopy.trust}</p>
          <h2>{profileCopy.schedule}</h2>
          <p className="muted">
            {profileCopy.source}: <a href={venue.sourceUrl} target="_blank" rel="noreferrer" className="inline-link">{venue.sourceUrl}</a>
          </p>
          <div className="classes-stat-grid profile-metrics">
            <div className="classes-stat-card">
              <strong>{sessions.length}</strong>
              <span>{profileCopy.weekdaySessions}</span>
            </div>
            <div className="classes-stat-card">
              <strong>{venue.languages.length}</strong>
              <span>{profileCopy.languages}</span>
            </div>
            <div className="classes-stat-card">
              <strong>{venue.styleSlugs.length}</strong>
              <span>{profileCopy.styles}</span>
            </div>
          </div>
          <ClaimForm studioSlug={venue.slug} locale={locale} />
        </div>
      </section>

      <section className="panel">
        <div className="detail-header">
          <div>
            <p className="eyebrow">{profileCopy.upcoming}</p>
            <h2>{locale === 'it' ? 'Opzioni affidabili in arrivo' : 'Trustworthy upcoming options'}</h2>
          </div>
        </div>
        <div className="stack-list">
          {sessionsByDay.map((daySessions) => {
            const day = DateTime.fromISO(daySessions[0].startAt).setZone('Europe/Rome');
            return (
              <section key={day.toISODate() ?? daySessions[0].id} className="session-day-group panel">
                <div className="day-group-header">
                  <div>
                    <p className="eyebrow">{day.toFormat(locale === 'it' ? 'cccc' : 'cccc')}</p>
                    <h2>{day.toFormat(locale === 'it' ? 'd LLLL' : 'd LLLL')}</h2>
                  </div>
                  <div className="day-group-meta">
                    <span className="meta-pill">{daySessions.length}</span>
                  </div>
                </div>
                <div className="session-day-stack">
                  {daySessions.map((session) => (
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
          })}
        </div>
      </section>
    </div>
  );
}
