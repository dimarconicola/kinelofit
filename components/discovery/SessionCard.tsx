import Link from 'next/link';
import { DateTime } from 'luxon';

import { FavoriteButton } from '@/components/state/FavoriteButton';
import { ScheduleButton } from '@/components/state/ScheduleButton';
import { getBookingTarget, getInstructor, getStyle, getVenue } from '@/lib/catalog/data';
import type { Locale, Session } from '@/lib/catalog/types';
import { formatSessionTime, formatVerifiedAt } from '@/lib/ui/format';
import { BookingLink } from './BookingLink';

interface SessionCardProps {
  session: Session;
  locale: Locale;
  signedInEmail?: string;
  saveLabel: string;
  savedLabel: string;
  scheduleLabel: string;
}

export function SessionCard({ session, locale, signedInEmail, saveLabel, savedLabel, scheduleLabel }: SessionCardProps) {
  const venue = getVenue(session.venueSlug);
  const instructor = getInstructor(session.instructorSlug);
  const style = getStyle(session.styleSlug);
  const target = getBookingTarget(session.bookingTargetSlug);
  const labels =
    locale === 'it'
      ? {
          verified: 'Verificato',
          stale: 'Da aggiornare',
          bookNow: 'Prenota ora',
          studio: 'Apri studio',
          teacher: 'Apri insegnante',
          refreshed: 'Aggiornato',
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
          }
        }
      : {
          verified: 'Verified',
          stale: 'Needs refresh',
          bookNow: 'Book now',
          studio: 'View studio',
          teacher: 'View teacher',
          refreshed: 'Updated',
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
          }
        };

  if (!venue || !instructor || !style || !target) {
    return null;
  }

  const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');
  const end = DateTime.fromISO(session.endAt).setZone('Europe/Rome');
  const durationMinutes = Math.max(30, Math.round(end.diff(start, 'minutes').minutes));

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
            <Link href={`/${locale}/${session.citySlug}/studios/${venue.slug}`} className="inline-link">
              {venue.name}
            </Link>{' '}
            ·{' '}
            <Link href={`/${locale}/${session.citySlug}/teachers/${instructor.slug}`} className="inline-link">
              {instructor.name}
            </Link>
          </p>
          <p className="muted">{venue.address}</p>
          <div className="session-tags">
            <span>{labels.level[session.level]}</span>
            <span>{session.language}</span>
            <span>{labels.format[session.format]}</span>
          </div>
          <div className="session-card-footer">
            <div className="stack-list">
              <p className="session-freshness">
                {labels.refreshed} {formatVerifiedAt(session.lastVerifiedAt, locale)}
              </p>
              <div className="session-card-links">
                <Link href={`/${locale}/${session.citySlug}/studios/${venue.slug}`} className="inline-link">
                  {labels.studio}
                </Link>
                <Link href={`/${locale}/${session.citySlug}/teachers/${instructor.slug}`} className="inline-link">
                  {labels.teacher}
                </Link>
              </div>
            </div>
            <div className="session-actions">
              <BookingLink
                locale={locale}
                citySlug={session.citySlug}
                categorySlug={session.categorySlug}
                venueSlug={session.venueSlug}
                sessionId={session.id}
                target={target}
                label={labels.bookNow}
              />
              <ScheduleButton sessionId={session.id} locale={locale} signedInEmail={signedInEmail} label={scheduleLabel} />
              <FavoriteButton entitySlug={session.id} entityType="session" locale={locale} signedInEmail={signedInEmail} label={saveLabel} savedLabel={savedLabel} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
