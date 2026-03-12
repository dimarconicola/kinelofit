'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Locale, Venue } from '@/lib/catalog/types';
import { env } from '@/lib/env';

interface MapPanelProps {
  locale: Locale;
  citySlug: string;
  cityName: string;
  venues: Venue[];
  bounds: [number, number, number, number];
}

export function MapPanel({ locale, citySlug, cityName, venues, bounds }: MapPanelProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [enhanced, setEnhanced] = useState(false);
  const labels =
    locale === 'it'
      ? {
          eyebrow: 'Mappa e studi',
          title: `${cityName} sul terreno`,
          copy: 'Ogni punto rappresenta uno studio con un percorso di prenotazione o contatto attivo.',
          fallback: 'Anteprima cartografica',
          list: 'Studi visibili'
        }
      : {
          eyebrow: 'Map and venues',
          title: `${cityName} on the ground`,
          copy: 'Each point is a venue with a live booking or contact path.',
          fallback: 'Cartographic preview',
          list: 'Visible venues'
        };

  useEffect(() => {
    if (!env.mapboxToken || !mapRef.current) return;

    let cleanup = () => {};

    void import('mapbox-gl').then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = env.mapboxToken ?? '';
      const map = new mapboxgl.Map({
        container: mapRef.current as HTMLDivElement,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
        zoom: 11.3,
        attributionControl: false
      });

      venues.forEach((venue) => {
        new mapboxgl.Marker({ color: '#ff704a' }).setLngLat([venue.geo.lng, venue.geo.lat]).addTo(map);
      });

      cleanup = () => {
        map.remove();
      };
      setEnhanced(true);
    });

    return () => cleanup();
  }, [bounds, venues]);

  const orderedVenues = useMemo(() => [...venues].sort((left, right) => left.name.localeCompare(right.name)), [venues]);

  const dots = useMemo(() => {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    return orderedVenues.map((venue) => ({
      ...venue,
      x: ((venue.geo.lng - minLng) / (maxLng - minLng)) * 100,
      y: 100 - ((venue.geo.lat - minLat) / (maxLat - minLat)) * 100
    }));
  }, [bounds, orderedVenues]);

  return (
    <aside className="map-shell panel">
      <div className="map-panel-copy">
        <p className="eyebrow">{labels.eyebrow}</p>
        <h3>{labels.title}</h3>
        <p className="muted">{labels.copy}</p>
      </div>
      <div ref={mapRef} className={`map-panel ${enhanced ? 'map-panel-live' : 'fallback-map'}`}>
        {!enhanced && (
          <>
            <div className="map-grid" />
            <div className="map-fallback-copy">{labels.fallback}</div>
            {dots.map((venue) => (
              <div className="map-dot" key={venue.slug} style={{ left: `${venue.x}%`, top: `${venue.y}%` }}>
                <span />
                <small>{venue.name}</small>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="map-venue-list">
        <div className="detail-header">
          <strong>{labels.list}</strong>
          <span className="meta-pill">{orderedVenues.length}</span>
        </div>
        {orderedVenues.map((venue) => (
          <Link key={venue.slug} href={`/${locale}/${citySlug}/studios/${venue.slug}`} className="map-venue-item">
            <strong>{venue.name}</strong>
            <span>{venue.address || cityName}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
