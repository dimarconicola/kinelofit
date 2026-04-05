import { DateTime } from 'luxon';
import { notFound } from 'next/navigation';

import { SessionCard } from '@/components/discovery/SessionCard';
import { ServerButtonLink, ServerChip } from '@/components/ui/server';
import { publicSnapshotToCatalog } from '@/lib/catalog/public-models';
import { getPublicCitySnapshot } from '@/lib/catalog/public-read-models';
import { resolveSessionCardDataFromSnapshot } from '@/lib/catalog/session-card-data.shared';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';
import { formatSessionTime } from '@/lib/ui/format';

export default async function SessionDetailPage({
  params
}: {
  params: Promise<{ locale: string; city: string; sessionId: string }>;
}) {
  const { locale: rawLocale, city: citySlug, sessionId } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const snapshot = await getPublicCitySnapshot(citySlug);
  if (!snapshot) notFound();

  const session = snapshot.sessions.find((entry) => entry.id === sessionId);
  if (!session) notFound();

  const resolved = resolveSessionCardDataFromSnapshot(publicSnapshotToCatalog(snapshot), [session]).get(session.id);
  if (!resolved) notFound();

  const nextFromSameVenue = snapshot.sessions.filter((entry) => entry.venueSlug === session.venueSlug && entry.id !== session.id).slice(0, 3);

  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Lezione condivisa',
          lead: 'Link diretto alla singola lezione, con sede, insegnante e azioni rapide per prenotazione e agenda.',
          backClasses: 'Torna alle lezioni',
          openStudio: 'Apri studio',
          openTeacher: 'Apri insegnante',
          venue: 'Sede',
          teacher: 'Insegnante',
          when: 'Quando',
          moreFromVenue: 'Altre lezioni dalla stessa sede'
        }
      : {
          eyebrow: 'Shared lesson',
          lead: 'Direct link to one lesson, with studio, teacher, and quick actions for booking and scheduling.',
          backClasses: 'Back to lessons',
          openStudio: 'Open studio',
          openTeacher: 'Open teacher',
          venue: 'Venue',
          teacher: 'Teacher',
          when: 'When',
          moreFromVenue: 'More lessons from this venue'
        };

  return (
    <div className="stack-list session-detail-page">
      <section className="detail-hero session-detail-hero">
        <div className="hero-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{session.title[locale]}</h1>
          <p className="lead">{copy.lead}</p>
          <div className="badge-row">
            <ServerChip tone="meta">
              {copy.when}: {formatSessionTime(session.startAt, locale)}
            </ServerChip>
            <ServerChip tone="meta">
              {copy.venue}: {resolved.venue.name}
            </ServerChip>
            <ServerChip tone="meta">
              {copy.teacher}: {resolved.instructor.name}
            </ServerChip>
          </div>
          <div className="site-actions">
            <ServerButtonLink href={`/${locale}/${citySlug}/classes`} className="button-ghost">
              {copy.backClasses}
            </ServerButtonLink>
            <ServerButtonLink href={`/${locale}/${citySlug}/studios/${resolved.venue.slug}`} className="button-secondary">
              {copy.openStudio}
            </ServerButtonLink>
            <ServerButtonLink href={`/${locale}/${citySlug}/teachers/${resolved.instructor.slug}`} className="button-secondary">
              {copy.openTeacher}
            </ServerButtonLink>
          </div>
        </div>
        <div className="panel hero-copy-secondary session-detail-summary">
          <p className="eyebrow">{snapshot.city.name[locale]}</p>
          <h2>{resolved.style.name[locale]}</h2>
          <p className="lead">{resolved.venue.address}</p>
          <p className="muted">
            {DateTime.fromISO(session.startAt).setZone('Europe/Rome').toFormat(locale === 'it' ? 'cccc d LLLL • HH:mm' : 'cccc d LLLL • HH:mm')}
          </p>
        </div>
      </section>

      <SessionCard session={session} locale={locale} resolved={resolved} scheduleLabel={dict.saveSchedule} />

      {nextFromSameVenue.length ? (
        <section className="panel session-detail-followups">
          <p className="eyebrow">{copy.moreFromVenue}</p>
          <div className="session-detail-followup-list">
            {nextFromSameVenue.map((entry) => (
              <ServerButtonLink key={entry.id} href={`/${locale}/${citySlug}/classes/${entry.id}`} className="button-ghost">
                {entry.title[locale]} · {formatSessionTime(entry.startAt, locale)}
              </ServerButtonLink>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
