'use client';

import type { BookingTarget, Locale } from '@/lib/catalog/types';

interface BookingLinkProps {
  locale: Locale;
  citySlug: string;
  categorySlug: string;
  venueSlug: string;
  sessionId?: string;
  target: BookingTarget;
  label: string;
}

export function BookingLink({ citySlug, categorySlug, venueSlug, sessionId, target, label }: BookingLinkProps) {
  const track = () => {
    navigator.sendBeacon(
      '/api/outbound',
      JSON.stringify({
        sessionId,
        venueSlug,
        citySlug,
        categorySlug,
        targetType: target.type,
        href: target.href
      })
    );
  };

  return (
    <a href={target.href} className="button button-primary" onClick={track} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}
