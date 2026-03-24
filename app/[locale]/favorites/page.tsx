import { AuthShell } from '@/components/auth/AuthShell';
import { FavoritesCollectionsClient } from '@/components/state/FavoritesCollectionsClient';
import { ServerButtonLink, ServerChip } from '@/components/ui/server';
import { getSessionUser } from '@/lib/auth/session';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
import { resolveLocale } from '@/lib/i18n/routing';
import { listUserFavorites, listUserSchedule } from '@/lib/runtime/store';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';
import { formatSessionTime } from '@/lib/ui/format';

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const [user, capabilities] = await Promise.all([getSessionUser(), getRuntimeCapabilities()]);
  const copy =
    locale === 'it'
      ? {
          signInNeeded: 'Accedi per ritrovare studi, insegnanti e classi che hai deciso di seguire.',
          signIn: 'Accedi',
          unavailable: 'Preferiti e agenda non sono disponibili in questo momento. Le pagine pubbliche restano consultabili.',
          back: 'Torna a Palermo',
          eyebrow: 'Salvati',
          title: 'Preferiti e agenda, senza confonderli',
          lead: 'Preferiti = luoghi e persone da seguire. Agenda salvata = lezioni con orario da tenere d’occhio nella settimana.',
          favoritesStudios: 'Studi preferiti',
          favoritesTeachers: 'Insegnanti preferiti',
          favoritesClasses: 'Classi preferite',
          savedSchedule: 'Agenda salvata',
          noFavorites: 'Nessun elemento salvato per ora.',
          noSchedule: 'Aggiungi classi dal calendario per costruire la tua settimana.',
          gateEyebrow: 'Ritrova ciò che conta',
          gateTitle: 'Qui tornano le scelte che vuoi seguire con calma',
          gateLead: 'Questa pagina tiene separato ciò che vuoi monitorare da ciò che vuoi davvero fare.',
          gateItems: [
            'Studi e insegnanti da seguire nel tempo.',
            'Classi salvate per confronto rapido quando riapri l’app.',
            'Agenda settimanale separata, senza mischiare persone e orari.'
          ],
          gateChips: ['Segui luoghi', 'Segui insegnanti', 'Separa gli orari'],
          totalSaved: 'Elementi salvati',
          scheduleCount: 'Slot in agenda'
        }
      : {
          signInNeeded: 'Sign in to revisit the studios, teachers, and classes you decided to keep track of.',
          signIn: 'Sign in',
          unavailable: 'Favorites and saved schedule are temporarily unavailable. Public pages are still available.',
          back: 'Back to Palermo',
          eyebrow: 'Saved',
          title: 'Favorites and schedule, clearly separated',
          lead: 'Favorites = places and people to follow. Saved schedule = class time slots you want to keep this week.',
          favoritesStudios: 'Favorite studios',
          favoritesTeachers: 'Favorite teachers',
          favoritesClasses: 'Favorite classes',
          savedSchedule: 'Saved schedule',
          noFavorites: 'No saved items yet.',
          noSchedule: 'Add classes from the calendar to build your week.',
          gateEyebrow: 'Keep the right things close',
          gateTitle: 'This page holds what you want to track, not just what you clicked',
          gateLead: 'Favorites and saved schedule solve two different jobs and stay separate here.',
          gateItems: [
            'Studios and teachers you may want to revisit later.',
            'Classes saved for quick comparison when you come back.',
            'A weekly schedule kept apart from people and places.'
          ],
          gateChips: ['Follow places', 'Follow teachers', 'Keep time slots separate'],
          totalSaved: 'Saved items',
          scheduleCount: 'Scheduled slots'
        };

  if (capabilities.authMode === 'unavailable' || capabilities.storeMode !== 'database') {
    return (
      <AuthShell
        eyebrow={copy.gateEyebrow}
        title={copy.gateTitle}
        lead={copy.unavailable}
        sideEyebrow={copy.eyebrow}
        sideTitle={copy.title}
        sideLead={copy.gateLead}
        sideItems={copy.gateItems}
        chips={copy.gateChips}
      >
        <div className="auth-status-card">
          <p className="lead">{copy.unavailable}</p>
          <div className="site-actions">
            <ServerButtonLink href={`/${locale}/palermo`} className="button-primary">
              {copy.back}
            </ServerButtonLink>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (!user) {
    return (
      <AuthShell
        eyebrow={copy.gateEyebrow}
        title={copy.gateTitle}
        lead={copy.signInNeeded}
        sideEyebrow={copy.eyebrow}
        sideTitle={copy.title}
        sideLead={copy.gateLead}
        sideItems={copy.gateItems}
        chips={copy.gateChips}
      >
        <div className="auth-status-card">
          <p className="lead">{copy.signInNeeded}</p>
          <div className="site-actions">
            <ServerButtonLink href={`/${locale}/sign-in`} className="button-primary">
              {copy.signIn}
            </ServerButtonLink>
            <ServerButtonLink href={`/${locale}/palermo`} className="button-ghost">
              {copy.back}
            </ServerButtonLink>
          </div>
        </div>
      </AuthShell>
    );
  }

  let favoriteRows = [];
  let scheduleRows: string[] = [];

  try {
    [favoriteRows, scheduleRows] = await Promise.all([listUserFavorites(user.id), listUserSchedule(user.id)]);
  } catch {
    return (
      <AuthShell
        eyebrow={copy.gateEyebrow}
        title={copy.gateTitle}
        lead={copy.unavailable}
        sideEyebrow={copy.eyebrow}
        sideTitle={copy.title}
        sideLead={copy.gateLead}
        sideItems={copy.gateItems}
        chips={copy.gateChips}
      >
        <div className="auth-status-card">
          <p className="lead">{copy.unavailable}</p>
          <div className="site-actions">
            <ServerButtonLink href={`/${locale}/palermo`} className="button-primary">
              {copy.back}
            </ServerButtonLink>
          </div>
        </div>
      </AuthShell>
    );
  }
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
      <section className="panel saved-summary-panel">
        <div className="saved-summary-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
          <div className="auth-shell-chips">
            <ServerChip tone="meta">
              {copy.totalSaved}: {favoriteRows.length}
            </ServerChip>
            <ServerChip tone="meta">
              {copy.scheduleCount}: {scheduleRows.length}
            </ServerChip>
          </div>
        </div>
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
