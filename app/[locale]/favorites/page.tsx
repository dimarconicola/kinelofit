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

  if (!user) {
    return (
      <div className="empty-state">
        <p>Sign in to save favorites and keep a weekly routine.</p>
        <Link href={`/${locale}/sign-in`} className="button button-primary">
          Sign in
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
          key: `instructor:${instructor.slug}`,
          href: `/${locale}/${instructor.citySlug}/teachers/${instructor.slug}`,
          title: instructor.name,
          meta: instructor.shortBio[locale]
        };
      }

      const session = sessions.find((item) => item.id === row.entitySlug);
      if (!session) return null;
      return {
        key: `session:${session.id}`,
        href: `/${locale}/${session.citySlug}/studios/${session.venueSlug}`,
        title: session.title[locale],
        meta: formatSessionTime(session.startAt, locale)
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

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
        <p className="eyebrow">Saved</p>
        <h1>Favorites and routine</h1>
        <p className="lead">Persistence is gated. Discovery is not.</p>
      </section>
      <section className="saved-grid">
        <section className="panel">
          <p className="eyebrow">Favorites</p>
          {favoriteItems.length > 0 ? (
            <div className="stack-list">
              {favoriteItems.map((item) => (
                <Link href={item.href} key={item.key} className="list-link">
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">No saved items yet.</p>
          )}
        </section>

        <section className="panel">
          <p className="eyebrow">Saved schedule</p>
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
            <p className="muted">Add classes from the calendar to build a routine.</p>
          )}
        </section>
      </section>
    </div>
  );
}
