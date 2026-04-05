'use client';

import { useMemo } from 'react';

import { MapCanvas } from '@/components/discovery/MapCanvas';
import type { MapRenderMode, MapVenueSummary } from '@/components/discovery/classes-results.types';
import type { Locale, Venue } from '@/lib/catalog/types';

interface MapPanelProps {
  locale: Locale;
  cityName: string;
  venues: Venue[];
  bounds: [number, number, number, number];
  renderMode: MapRenderMode;
}

export function MapPanel({ locale, cityName, venues, bounds, renderMode }: MapPanelProps) {
  const summaries = useMemo<MapVenueSummary[]>(
    () =>
      venues
        .filter((venue) => Number.isFinite(venue.geo.lat) && Number.isFinite(venue.geo.lng))
        .map((venue) => ({
          venueSlug: venue.slug,
          name: venue.name,
          address: venue.address,
          neighborhoodName: venue.address,
          geo: venue.geo,
          matchingSessionCount: 1,
          sessionsPreview: [],
          studioHref: `/${locale}/${venue.citySlug}/studios/${venue.slug}`,
          primaryCtaHref: undefined,
          primaryCtaLabel: undefined
        })),
    [locale, venues]
  );

  return (
    <aside className="map-shell panel">
      <MapCanvas locale={locale} cityName={cityName} bounds={bounds} venues={summaries} renderMode={renderMode} readOnly />
    </aside>
  );
}
