import { notFound } from 'next/navigation';
import { DateTime } from 'luxon';

import { VenueCover } from '@/components/catalog/VenueCover';
import { ClaimFormDialog } from '@/components/forms/ClaimFormDialog';
import { SessionCard } from '@/components/discovery/SessionCard';
import { FavoriteButton } from '@/components/state/FavoriteButton';
import { ServerButtonLink, ServerChip, ServerLink } from '@/components/ui/server';
import { getPublicCitySnapshot } from '@/lib/catalog/public-read-models';
import { publicSnapshotToCatalog } from '@/lib/catalog/public-models';
import { resolveSessionCardDataFromSnapshot } from '@/lib/catalog/session-card-data.shared';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';
import { formatVerifiedAt } from '@/lib/ui/format';

export default async function StudioPage({ params }: { params: Promise<{ locale: string; city: string; slug: string }> }) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const snapshot = await getPublicCitySnapshot(citySlug);
  if (!snapshot) notFound();
  const venue = snapshot.venues.find((item) => item.slug === slug && item.citySlug === citySlug);
  if (!venue) notFound();

  const neighborhoods = snapshot.neighborhoods;
  const venueSessions = snapshot.sessions.filter((session) => session.venueSlug === slug);
  const neighborhood = neighborhoods.find((item) => item.slug === venue.neighborhoodSlug);
  const sessions = venueSessions
    .sort((left, right) => left.startAt.localeCompare(right.startAt))
    .slice(0, 20);
  const resolvedSessions = resolveSessionCardDataFromSnapshot(publicSnapshotToCatalog(snapshot), sessions);
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
          trust: 'Fiducia',
          weekdaySessions: 'sessioni a calendario',
          languages: 'lingue',
          styles: 'stili',
          source: 'Info verificate da:',
          upcoming: 'Prossime sessioni',
          website: 'Sito ufficiale',
          saveStudio: 'Salva studio',
          savedStudio: 'Studio salvato'
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
          website: 'Official website',
          saveStudio: 'Save studio',
          savedStudio: 'Studio saved'
        };

  return (
    <div className="stack-list">
      <section className="detail-hero profile-hero">
        <div className="panel profile-main">
          <div className="profile-main-layout">
            <div className="profile-main-copy">
              <p className="eyebrow">{profileCopy.eyebrow}</p>
              <h1>{venue.name}</h1>
              <p className="lead">{venue.description[locale]}</p>
              <div className="profile-chip-row">
                {venue.amenities.map((amenity) => (
                  <ServerChip key={amenity} tone="meta">
                    {amenity}
                  </ServerChip>
                ))}
              </div>
              <div className="profile-meta">
                <p className="muted">{venue.address} · {neighborhood?.name[locale]}</p>
                <p className="muted">{venue.freshnessNote[locale]} · {formatVerifiedAt(venue.lastVerifiedAt, locale)}</p>
              </div>
              <div className="site-actions profile-links">
                <FavoriteButton
                  entitySlug={venue.slug}
                  entityType="venue"
                  locale={locale}
                  label={profileCopy.saveStudio}
                  savedLabel={profileCopy.savedStudio}
                />
                {hasWebsite ? (
                  <ServerButtonLink href={venue.sourceUrl} className="button-secondary" target="_blank" rel="noreferrer">
                    {profileCopy.website}
                  </ServerButtonLink>
                ) : null}
              </div>
            </div>
            <VenueCover venue={venue} locale={locale} className="profile-venue-cover" />
          </div>
        </div>
        <div className="profile-side-stack">
          <div className="panel profile-side">
            <p className="eyebrow">{profileCopy.trust}</p>
            <h2>{profileCopy.schedule}</h2>
            <p className="muted">
              {profileCopy.source}:{' '}
              <ServerLink href={venue.sourceUrl} target="_blank" rel="noreferrer" className="inline-link">
                {venue.sourceUrl}
              </ServerLink>
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
            <div className="profile-side-actions">
              <ClaimFormDialog studioSlug={venue.slug} locale={locale} />
            </div>
          </div>
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
                    <ServerChip tone="meta">
                      {daySessions.length}
                    </ServerChip>
                  </div>
                </div>
                <div className="session-day-stack">
                  {daySessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      locale={locale}
                      resolved={resolvedSessions.get(session.id)!}
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
