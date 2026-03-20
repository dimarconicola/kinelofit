import { notFound } from 'next/navigation';
import { DateTime } from 'luxon';

import { SessionCard } from '@/components/discovery/SessionCard';
import { FavoriteButton } from '@/components/state/FavoriteButton';
import { ServerChip } from '@/components/ui/server';
import { getSessionUser } from '@/lib/auth/session';
import { resolveSessionCardData } from '@/lib/catalog/session-card-data';
import { requirePublicCityServer } from '@/lib/catalog/guards';
import { getInstructor, getInstructorSessions, getVenue } from '@/lib/catalog/server-data';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function TeacherPage({ params }: { params: Promise<{ locale: string; city: string; slug: string }> }) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  await requirePublicCityServer(citySlug);
  const [instructor, user] = await Promise.all([getInstructor(slug), getSessionUser()]);
  if (!instructor) notFound();
  const sessions = (await getInstructorSessions(slug))
    .sort((left, right) => left.startAt.localeCompare(right.startAt))
    .slice(0, 20);
  const resolvedSessions = await resolveSessionCardData(sessions);
  const venueNameBySlug = new Map(
    (
      await Promise.all(
        [...new Set(sessions.map((session) => session.venueSlug))].map(async (venueSlug) => {
          const venue = await getVenue(venueSlug);
          return [venueSlug, venue?.name] as const;
        })
      )
    ).filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
  );
  const sessionsByDay = Object.values(
    sessions.reduce<Record<string, typeof sessions>>((groups, session) => {
      const key = DateTime.fromISO(session.startAt).setZone('Europe/Rome').toISODate();
      if (!key) return groups;
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
      return groups;
    }, {})
  );
  const venueCount = new Set(sessions.map((session) => session.venueSlug)).size;
  const teacherCopy =
    locale === 'it'
      ? {
          eyebrow: 'Insegnante',
          trust: 'Impatto locale',
          upcoming: 'Sessioni in arrivo',
          why: 'Perché conta',
          sessions: 'sessioni',
          venues: 'studi',
          languages: 'lingue'
        }
      : {
          eyebrow: 'Teacher',
          trust: 'Local footprint',
          upcoming: 'Upcoming sessions',
          why: 'Why they matter',
          sessions: 'sessions',
          venues: 'venues',
          languages: 'languages'
        };

  return (
    <div className="stack-list">
      <section className="detail-hero profile-hero">
        <div className="panel profile-main">
          <p className="eyebrow">{teacherCopy.eyebrow}</p>
          <h1>{instructor.name}</h1>
          <p className="lead">{instructor.shortBio[locale]}</p>
          <div className="badge-row">
            {instructor.languages.map((language) => (
              <ServerChip key={language} className="meta-pill" tone="meta">
                {language}
              </ServerChip>
            ))}
            {instructor.specialties.map((specialty) => (
              <ServerChip key={specialty} className="meta-pill" tone="meta">
                {specialty}
              </ServerChip>
            ))}
          </div>
          <FavoriteButton entitySlug={instructor.slug} entityType="instructor" locale={locale} signedInEmail={user?.email} label={dict.save} savedLabel={dict.unsave} />
        </div>
        <div className="panel profile-side">
          <p className="eyebrow">{teacherCopy.trust}</p>
          <h2>{teacherCopy.why}</h2>
          <p className="lead">
            {locale === 'it'
              ? 'La fiducia locale nasce dalle persone: didattica, linguaggi, continuita e relazione con gli studi.'
              : 'Local trust is person-led: teaching style, language access, consistency, and venue relationships.'}
          </p>
          <div className="classes-stat-grid profile-metrics">
            <div className="classes-stat-card">
              <strong>{sessions.length}</strong>
              <span>{teacherCopy.sessions}</span>
            </div>
            <div className="classes-stat-card">
              <strong>{venueCount}</strong>
              <span>{teacherCopy.venues}</span>
            </div>
            <div className="classes-stat-card">
              <strong>{instructor.languages.length}</strong>
              <span>{teacherCopy.languages}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="panel">
        <p className="eyebrow">{teacherCopy.upcoming}</p>
        <div className="stack-list">
          {sessionsByDay.map((daySessions) => {
            const day = DateTime.fromISO(daySessions[0].startAt).setZone('Europe/Rome');
            const venues = new Set(daySessions.map((session) => venueNameBySlug.get(session.venueSlug)).filter(Boolean));
            return (
              <section key={day.toISODate() ?? daySessions[0].id} className="session-day-group panel">
                <div className="day-group-header">
                  <div>
                    <p className="eyebrow">{day.toFormat(locale === 'it' ? 'cccc' : 'cccc')}</p>
                    <h2>{day.toFormat(locale === 'it' ? 'd LLLL' : 'd LLLL')}</h2>
                  </div>
                  <div className="day-group-meta">
                    <ServerChip tone="meta">
                      {daySessions.length} {teacherCopy.sessions}
                    </ServerChip>
                    <ServerChip tone="meta">
                      {venues.size} {teacherCopy.venues}
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
                      signedInEmail={user?.email}
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
