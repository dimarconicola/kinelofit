import NextLink from 'next/link';
import { DateTime } from 'luxon';
import { Chip, Link } from '@heroui/react';

import { ScheduleButton } from '@/components/state/ScheduleButton';
import type { ResolvedSessionCardData } from '@/lib/catalog/session-card-data';
import type { Locale, Session } from '@/lib/catalog/types';
import { formatSessionTime } from '@/lib/ui/format';
import { BookingLink } from './BookingLink';

interface SessionCardProps {
  session: Session;
  locale: Locale;
  resolved: ResolvedSessionCardData;
  signedInEmail?: string;
  scheduleLabel: string;
}

export function SessionCard({ session, locale, resolved, signedInEmail, scheduleLabel }: SessionCardProps) {
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
          price: 'Prezzo'
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
          price: 'Price'
        };

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
            <Link as={NextLink} href={`/${locale}/${session.citySlug}/studios/${venue.slug}`} className="inline-link">
              {venue.name}
            </Link>{' '}
            ·{' '}
            <Link as={NextLink} href={`/${locale}/${session.citySlug}/teachers/${instructor.slug}`} className="inline-link">
              {instructor.name}
            </Link>
          </p>
          <p className="muted">{venue.address}</p>
          <div className="session-tags">
            <Chip radius="full" size="sm">{style.name[locale]}</Chip>
            <Chip radius="full" size="sm">{labels.level[session.level]}</Chip>
            <Chip radius="full" size="sm">{session.language}</Chip>
            <Chip radius="full" size="sm">{labels.format[session.format]}</Chip>
          </div>
          {session.priceNote ? (
            <p className="muted">
              <strong>{labels.price}:</strong> {session.priceNote[locale]}
            </p>
          ) : null}
          <div className="session-card-footer">
            <div className="stack-list">
              <div className="session-card-links">
                <Link as={NextLink} href={`/${locale}/${session.citySlug}/studios/${venue.slug}`} className="inline-link">
                  {labels.studio}
                </Link>
                <Link as={NextLink} href={`/${locale}/${session.citySlug}/teachers/${instructor.slug}`} className="inline-link">
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
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
