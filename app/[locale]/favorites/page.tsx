import Link from 'next/link';

import { getSessionUser } from '@/lib/auth/session';
import { getInstructor, getVenue } from '@/lib/catalog/data';
import { sessions } from '@/lib/catalog/seed';
import { resolveLocale } from '@/lib/i18n/routing';
import { listUserFavorites, listUserSchedule } from '@/lib/runtime/store';
import { formatSessionTime } from '@/lib/ui/format';

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const user = await getSessionUser();
  const copy =
    locale === 'it'
      ? {
          signInNeeded: 'Accedi per salvare preferiti e agenda settimanale.',
          signIn: 'Accedi',
          eyebrow: 'Salvati',
          title: 'Preferiti e agenda',
          lead: 'Preferiti = luoghi e persone da seguire. Agenda salvata = lezioni con orario da tenere d’occhio.',
          favoritesStudios: 'Studi preferiti',
          favoritesTeachers: 'Insegnanti preferiti',
          favoritesClasses: 'Classi preferite',
          savedSchedule: 'Agenda salvata',
          noFavorites: 'Nessun elemento salvato per ora.',
          noSchedule: 'Aggiungi classi dal calendario per costruire la tua settimana.'
        }
      : {
          signInNeeded: 'Sign in to save favorites and your weekly schedule.',
          signIn: 'Sign in',
          eyebrow: 'Saved',
          title: 'Favorites and schedule',
          lead: 'Favorites = places and teachers you follow. Saved schedule = time slots you plan to attend.',
          favoritesStudios: 'Favorite studios',
          favoritesTeachers: 'Favorite teachers',
          favoritesClasses: 'Favorite classes',
          savedSchedule: 'Saved schedule',
          noFavorites: 'No saved items yet.',
          noSchedule: 'Add classes from the calendar to build your week.'
        };

  if (!user) {
    return (
      <div className="empty-state">
        <p>{copy.signInNeeded}</p>
        <Link href={`/${locale}/sign-in`} className="button button-primary">
          {copy.signIn}
        </Link>
      </div>
    );
  }

  const favoriteRows = await listUserFavorites(user.id);
  const scheduleRows = await listUserSchedule(user.id);

  const favoriteItems = favoriteRows
    .map((row) => {
      if (row.entityType === 'venue') {
        const venue = getVenue(row.entitySlug);
        if (!venue) return null;
        return {
          kind: 'venue' as const,
          key: `venue:${venue.slug}`,
          href: `/${locale}/${venue.citySlug}/studios/${venue.slug}`,
          title: venue.name,
          meta: venue.tagline[locale]
        };
      }

      if (row.entityType === 'instructor') {
        const instructor = getInstructor(row.entitySlug);
        if (!instructor) return null;
        return {
          kind: 'instructor' as const,
          key: `instructor:${instructor.slug}`,
          href: `/${locale}/${instructor.citySlug}/teachers/${instructor.slug}`,
          title: instructor.name,
          meta: instructor.shortBio[locale]
        };
      }

      const session = sessions.find((item) => item.id === row.entitySlug);
      if (!session) return null;
      return {
        kind: 'session' as const,
        key: `session:${session.id}`,
        href: `/${locale}/${session.citySlug}/studios/${session.venueSlug}`,
        title: session.title[locale],
        meta: formatSessionTime(session.startAt, locale)
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const venueFavorites = favoriteItems.filter((item) => item.kind === 'venue');
  const instructorFavorites = favoriteItems.filter((item) => item.kind === 'instructor');
  const sessionFavorites = favoriteItems.filter((item) => item.kind === 'session');

  const scheduleItems = scheduleRows
    .map((sessionId) => sessions.find((session) => session.id === sessionId))
    .filter((session): session is NonNullable<typeof session> => Boolean(session))
    .map((session) => ({
      key: session.id,
      href: `/${locale}/${session.citySlug}/studios/${session.venueSlug}`,
      title: session.title[locale],
      meta: formatSessionTime(session.startAt, locale)
    }));

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
      </section>
      <section className="saved-grid">
        <section className="panel">
          <p className="eyebrow">{copy.favoritesStudios}</p>
          {venueFavorites.length > 0 ? (
            <div className="stack-list">
              {venueFavorites.map((item) => (
                <Link href={item.href} key={item.key} className="list-link">
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">{copy.noFavorites}</p>
          )}
        </section>

        <section className="panel">
          <p className="eyebrow">{copy.favoritesTeachers}</p>
          {instructorFavorites.length > 0 ? (
            <div className="stack-list">
              {instructorFavorites.map((item) => (
                <Link href={item.href} key={item.key} className="list-link">
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">{copy.noFavorites}</p>
          )}
        </section>

        <section className="panel">
          <p className="eyebrow">{copy.favoritesClasses}</p>
          {sessionFavorites.length > 0 ? (
            <div className="stack-list">
              {sessionFavorites.map((item) => (
                <Link href={item.href} key={item.key} className="list-link">
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">{copy.noFavorites}</p>
          )}
        </section>

        <section className="panel">
          <p className="eyebrow">{copy.savedSchedule}</p>
          {scheduleItems.length > 0 ? (
            <div className="stack-list">
              {scheduleItems.map((item) => (
                <Link href={item.href} key={item.key} className="list-link">
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">{copy.noSchedule}</p>
          )}
        </section>
      </section>
    </div>
  );
}
