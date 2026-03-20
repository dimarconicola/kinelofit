import { FavoritesCollectionsClient } from '@/components/state/FavoritesCollectionsClient';
import { ServerButtonLink } from '@/components/ui/server';
import { getSessionUser } from '@/lib/auth/session';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
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
        <ServerButtonLink href={`/${locale}/sign-in`} className="button-primary">
          {copy.signIn}
        </ServerButtonLink>
      </div>
    );
  }

  const favoriteRows = await listUserFavorites(user.id);
  const scheduleRows = await listUserSchedule(user.id);
  const catalog = await getCatalogSnapshot();

  const venueItems = catalog.venues
    .map((venue) => ({
      slug: venue.slug,
      href: `/${locale}/${venue.citySlug}/studios/${venue.slug}`,
      title: venue.name,
      meta: venue.tagline[locale]
    }));
  const instructorItems = catalog.instructors
    .map((instructor) => ({
      slug: instructor.slug,
      href: `/${locale}/${instructor.citySlug}/teachers/${instructor.slug}`,
      title: instructor.name,
      meta: instructor.shortBio[locale]
    }));
  const sessionItems = catalog.sessions.map((session) => ({
    id: session.id,
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
      <FavoritesCollectionsClient
        signedInEmail={user.email}
        initialFavoriteKeys={favoriteRows.map((row) => `${row.entityType}:${row.entitySlug}`)}
        initialScheduleIds={scheduleRows}
        venues={venueItems}
        instructors={instructorItems}
        sessions={sessionItems}
        copy={copy}
      />
    </div>
  );
}
