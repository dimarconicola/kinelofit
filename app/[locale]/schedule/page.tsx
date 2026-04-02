import { AuthShell } from '@/components/auth/AuthShell';
import { SavedScheduleClient } from '@/components/state/SavedScheduleClient';
import { ServerButtonLink, ServerChip } from '@/components/ui/server';
import { getSessionUser } from '@/lib/auth/session';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
import { resolveLocale } from '@/lib/i18n/routing';
import { listUserSchedule } from '@/lib/runtime/store';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';
import { formatSessionTime } from '@/lib/ui/format';

export default async function SchedulePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const [user, capabilities] = await Promise.all([getSessionUser(), getRuntimeCapabilities()]);
  const copy =
    locale === 'it'
      ? {
          signInNeeded: 'Accedi per tenere insieme solo le lezioni con orario che vuoi davvero fare.',
          signIn: 'Accedi',
          unavailable: 'L’agenda salvata non è disponibile in questo momento. Continua pure a esplorare il calendario pubblico.',
          back: 'Torna alle classi',
          eyebrow: 'Agenda',
          title: 'La tua settimana, già filtrata',
          lead: 'Qui trovi solo le lezioni che hai salvato per pianificare tua la settimana.',
          empty: 'Nessuna lezione salvata in agenda. Aggiungila dalle card delle classi.',
          gateEyebrow: 'Blocca gli orari giusti',
          gateTitle: 'L’agenda serve a pianificare il tuo calendario.',
          gateLead: 'È il posto dove tieni insieme gli slot che vuoi davvero fare, separati da studi e insegnanti che segui.',
          gateItems: [
            'Solo classi con giorno e orario, nessuna lista confusa di luoghi.',
            'Una vista rapida della settimana da rivedere prima di decidere.',
            'Stesso calendario pubblico, ma con un tuo livello personale sopra.'
          ],
          gateChips: ['Solo orari', 'Settimana personale', 'Nessun rumore'],
          scheduleCount: 'Lezioni in agenda',
          shareLabel: 'Condividi',
          copiedLabel: 'Copiato',
          exportLabel: 'Calendario (.ics)'
        }
      : {
          signInNeeded: 'Sign in to keep only the time slots you actually want to attend together.',
          signIn: 'Sign in',
          unavailable: 'Saved schedule is temporarily unavailable. You can keep browsing the public calendar.',
          back: 'Back to classes',
          eyebrow: 'Schedule',
          title: 'Your week, already filtered',
          lead: 'This page only shows the class time slots you saved to plan your week without noise.',
          empty: 'No classes saved in your schedule yet. Add them from class cards.',
          gateEyebrow: 'Hold on to the right time slots',
          gateTitle: 'Schedule is for time, not generic favorites',
          gateLead: 'Keep the sessions you actually want to attend separate from the places and teachers you follow.',
          gateItems: [
            'Only classes with day and time, not a mixed list of entities.',
            'A quick weekly view to revisit before you decide.',
            'The same public calendar, with a personal layer on top.'
          ],
          gateChips: ['Only time slots', 'Personal week', 'No noise'],
          scheduleCount: 'Saved classes',
          shareLabel: 'Share',
          copiedLabel: 'Copied',
          exportLabel: 'Calendar (.ics)'
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
            <ServerButtonLink href={`/${locale}/palermo/classes`} className="button-primary">
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
            <ServerButtonLink href={`/${locale}/palermo/classes`} className="button-ghost">
              {copy.back}
            </ServerButtonLink>
          </div>
        </div>
      </AuthShell>
    );
  }

  let scheduleRows: string[] = [];

  try {
    scheduleRows = await listUserSchedule(user.id);
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
            <ServerButtonLink href={`/${locale}/palermo/classes`} className="button-primary">
              {copy.back}
            </ServerButtonLink>
          </div>
        </div>
      </AuthShell>
    );
  }
  const catalog = await getCatalogSnapshot();
  const venuesBySlug = new Map(catalog.venues.map((venue) => [venue.slug, venue]));
  const sessionItems = catalog.sessions.map((session) => {
    const venue = venuesBySlug.get(session.venueSlug);
    return {
      id: session.id,
      href: `/${locale}/${session.citySlug}/studios/${session.venueSlug}`,
      title: session.title[locale],
      meta: formatSessionTime(session.startAt, locale),
      startAt: session.startAt,
      endAt: session.endAt,
      venueName: venue?.name ?? '',
      address: venue?.address ?? ''
    };
  });

  return (
    <div className="stack-list">
      <section className="panel saved-summary-panel">
        <div className="saved-summary-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
          <div className="auth-shell-chips">
            <ServerChip tone="meta">
              {copy.scheduleCount}: {scheduleRows.length}
            </ServerChip>
          </div>
        </div>
      </section>

      <section className="panel">
        <SavedScheduleClient
          locale={locale}
          signedInEmail={user.email}
          initialScheduleIds={scheduleRows}
          sessions={sessionItems}
          emptyLabel={copy.empty}
          shareLabel={copy.shareLabel}
          copiedLabel={copy.copiedLabel}
          exportLabel={copy.exportLabel}
        />
      </section>
    </div>
  );
}
