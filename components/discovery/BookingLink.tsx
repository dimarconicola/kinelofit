'use client';

import { Button } from '@heroui/react';
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
    <Button as="a" href={target.href} className="button button-primary" color="primary" radius="full" onPress={track} target="_blank" rel="noreferrer">
      {label}
    </Button>
  );
}
