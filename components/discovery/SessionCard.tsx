import { DateTime } from 'luxon';

import { FavoriteButton } from '@/components/state/FavoriteButton';
import { ScheduleButton } from '@/components/state/ScheduleButton';
import { getPriceNoteForLocale } from '@/lib/catalog/price-notes';
import { ServerChip, ServerLink } from '@/components/ui/server';
import type { ResolvedSessionCardData } from '@/lib/catalog/session-card-data.shared';
import type { Locale, Session } from '@/lib/catalog/types';
import { buildGoogleCalendarHref } from '@/lib/ui/calendar';
import { formatSessionTime } from '@/lib/ui/format';
import { buildOpenStreetMapHref } from '@/lib/ui/maps';
import { buildAbsoluteSessionHref } from '@/lib/ui/session-links';
import { ShareButton } from '@/components/ui/ShareButton';
import { BookingLink } from './BookingLink';

interface SessionCardProps {
  session: Session;
  locale: Locale;
  resolved: ResolvedSessionCardData;
  scheduleLabel: string;
}

export function SessionCard({ session, locale, resolved, scheduleLabel }: SessionCardProps) {
  const { venue, instructor, style, target } = resolved;
  const labels =
    locale === 'it'
      ? {
          verified: 'Verificato',
          stale: 'Da aggiornare',
          bookNow: 'Prenota ora',
          studio: 'Apri studio',
          teacher: 'Apri insegnante',
          level: {
            beginner: 'Principianti',
            open: 'Aperti a tutti',
            intermediate: 'Intermedio',
            advanced: 'Avanzato'
          },
          format: {
            in_person: 'In presenza',
            hybrid: 'Hybrid',
            online: 'Online'
          },
          price: 'Prezzo',
          saveClass: 'Salva classe',
          savedClass: 'Classe salvata',
          savedSchedule: 'In agenda',
          map: 'Mappa',
          googleCalendar: 'Google Calendar',
          share: 'Condividi',
          copied: 'Link copiato'
        }
      : {
          verified: 'Verified',
          stale: 'Needs refresh',
          bookNow: 'Book now',
          studio: 'View studio',
          teacher: 'View teacher',
          level: {
            beginner: 'Beginner',
            open: 'Open',
            intermediate: 'Intermediate',
            advanced: 'Advanced'
          },
          format: {
            in_person: 'In person',
            hybrid: 'Hybrid',
            online: 'Online'
          },
          price: 'Price',
          saveClass: 'Save class',
          savedClass: 'Class saved',
          savedSchedule: 'In schedule',
          map: 'Map',
          googleCalendar: 'Google Calendar',
          share: 'Share',
          copied: 'Link copied'
        };

  const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');
  const end = DateTime.fromISO(session.endAt).setZone('Europe/Rome');
  const durationMinutes = Math.max(30, Math.round(end.diff(start, 'minutes').minutes));
  const priceNote = getPriceNoteForLocale(session.priceNote, locale);
  const mapHref = buildOpenStreetMapHref({ address: venue.address, geo: venue.geo });
  const sessionHref = buildAbsoluteSessionHref({ locale, citySlug: session.citySlug, sessionId: session.id });
  const shareText = [session.title[locale], formatSessionTime(session.startAt, locale), venue.name, instructor.name].filter(Boolean).join(' · ');
  const googleCalendarHref = buildGoogleCalendarHref({
    id: session.id,
    title: session.title[locale],
    startAt: session.startAt,
    endAt: session.endAt,
    location: `${venue.name}, ${venue.address}`,
    description: `${style.name[locale]} · ${instructor.name}`,
    url: sessionHref
  });

  return (
    <article className="session-card panel">
      <div className="session-card-shell">
        <div className="session-time-block">
          <span className="session-time-main">{start.toFormat('HH:mm')}</span>
          <span className="session-time-sub">{durationMinutes} min</span>
        </div>
        <div className="session-card-body">
          <div className="session-card-top">
            <div>
              <p className="eyebrow">{style.name[locale]}</p>
              <h3>{session.title[locale]}</h3>
            </div>
            <span className={`status-pill ${session.verificationStatus}`}>
              {session.verificationStatus === 'verified' ? labels.verified : labels.stale}
            </span>
          </div>
          <p className="session-meta">{formatSessionTime(session.startAt, locale)}</p>
          <p className="muted">
            <ServerLink href={`/${locale}/${session.citySlug}/studios/${venue.slug}`} className="inline-link">
              {venue.name}
            </ServerLink>{' '}
            ·{' '}
            <ServerLink href={`/${locale}/${session.citySlug}/teachers/${instructor.slug}`} className="inline-link">
              {instructor.name}
            </ServerLink>
          </p>
          <p className="muted">
            <ServerLink href={mapHref} className="inline-link" target="_blank" rel="noreferrer">
              {venue.address}
            </ServerLink>
          </p>
          <div className="session-tags">
            <ServerChip>{style.name[locale]}</ServerChip>
            <ServerChip>{labels.level[session.level]}</ServerChip>
            <ServerChip>{session.language}</ServerChip>
            <ServerChip>{labels.format[session.format]}</ServerChip>
          </div>
          {priceNote ? (
            <p className="muted">
              <strong>{labels.price}:</strong> {priceNote}
            </p>
          ) : null}
          <div className="session-card-footer">
            <div className="stack-list">
              <div className="session-card-links">
                <ServerLink href={`/${locale}/${session.citySlug}/studios/${venue.slug}`} className="inline-link">
                  {labels.studio}
                </ServerLink>
                <ServerLink href={`/${locale}/${session.citySlug}/teachers/${instructor.slug}`} className="inline-link">
                  {labels.teacher}
                </ServerLink>
                <ServerLink href={mapHref} className="inline-link" target="_blank" rel="noreferrer">
                  {labels.map}
                </ServerLink>
                <ServerLink href={googleCalendarHref} className="inline-link" target="_blank" rel="noreferrer">
                  {labels.googleCalendar}
                </ServerLink>
                <ShareButton title={session.title[locale]} text={shareText} url={sessionHref} label={labels.share} copiedLabel={labels.copied} />
              </div>
            </div>
            <div className="session-actions">
              <FavoriteButton
                entitySlug={session.id}
                entityType="session"
                locale={locale}
                label={labels.saveClass}
                savedLabel={labels.savedClass}
              />
              <BookingLink
                locale={locale}
                citySlug={session.citySlug}
                categorySlug={session.categorySlug}
                venueSlug={session.venueSlug}
                sessionId={session.id}
                target={target}
                label={labels.bookNow}
              />
              <ScheduleButton
                sessionId={session.id}
                locale={locale}
                label={scheduleLabel}
                savedLabel={labels.savedSchedule}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
