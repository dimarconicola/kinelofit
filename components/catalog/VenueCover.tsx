'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';

import type { Locale, Venue } from '@/lib/catalog/types';

interface VenueCoverProps {
  venue: Venue;
  locale: Locale;
  className?: string;
}

export function VenueCover({ venue, locale, className }: VenueCoverProps) {
  const [hasError, setHasError] = useState(false);
  const image = venue.coverImage;
  const rootClassName = ['venue-cover', className].filter(Boolean).join(' ');
  const verifiedDate =
    image && !Number.isNaN(new Date(image.lastVerifiedAt).getTime())
      ? new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(new Date(image.lastVerifiedAt))
      : null;

  if (!image || hasError) {
    return (
      <div className={`${rootClassName} venue-cover-fallback`} role="img" aria-label={venue.name}>
        <div className="venue-cover-fallback-copy">
          <strong>{venue.name}</strong>
          <span>{venue.tagline[locale]}</span>
        </div>
      </div>
    );
  }

  return (
    <figure className={rootClassName}>
      <img
        src={image.url}
        alt={image.alt[locale]}
        loading="eager"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
      <figcaption className="venue-cover-caption">
        <span>{locale === 'it' ? 'Foto da fonte ufficiale' : 'Official source photo'}</span>
        {verifiedDate ? <span>{locale === 'it' ? `Verificata ${verifiedDate}` : `Verified ${verifiedDate}`}</span> : null}
      </figcaption>
    </figure>
  );
}
