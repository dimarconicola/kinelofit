'use client';

import { useEffect, useRef, useState } from 'react';

import type { Locale, Venue } from '@/lib/catalog/types';
import { env } from '@/lib/env';

interface MapPanelProps {
  locale: Locale;
  cityName: string;
  venues: Venue[];
  bounds: [number, number, number, number];
}

export function MapPanel({ locale, cityName, venues, bounds }: MapPanelProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'missing-token' | 'error'>(
    env.mapboxToken ? 'loading' : 'missing-token'
  );
  const labels =
    locale === 'it'
      ? {
          eyebrow: 'Map view',
          title: `${cityName} sulla mappa`,
          copy: 'Mostriamo solo studi con percorsi di prenotazione o contatto attivi.',
          loadingTitle: 'Caricamento mappa',
          loadingBody: 'Recupero tile e marker in corso.',
          missingTitle: 'Mappa non configurata',
          missingBody: 'Questa installazione non ha NEXT_PUBLIC_MAPBOX_TOKEN configurato.',
          errorTitle: 'Mappa non disponibile',
          errorBody: 'Impossibile caricare la mappa in questo momento. Riprova tra poco.'
        }
      : {
          eyebrow: 'Map view',
          title: `${cityName} on the ground`,
          copy: 'Only venues with live booking or contact paths are shown.',
          loadingTitle: 'Loading map',
          loadingBody: 'Fetching map tiles and venue markers.',
          missingTitle: 'Map not configured',
          missingBody: 'This deployment is missing NEXT_PUBLIC_MAPBOX_TOKEN.',
          errorTitle: 'Map unavailable',
          errorBody: 'Could not load map tiles right now. Try again shortly.'
        };

  useEffect(() => {
    if (!mapRef.current) return;
    if (!env.mapboxToken) {
      setMapStatus('missing-token');
      return;
    }

    let mounted = true;
    let cleanup = () => {};
    setMapStatus('loading');

    void import('mapbox-gl')
      .then(({ default: mapboxgl }) => {
        if (!mounted || !mapRef.current) return;

        mapboxgl.accessToken = env.mapboxToken ?? '';
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
          zoom: 11.3,
          attributionControl: false
        });

        map.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]]
          ],
          { padding: 28, duration: 0 }
        );

        venues.forEach((venue) => {
          new mapboxgl.Marker({ color: '#ff704a' }).setLngLat([venue.geo.lng, venue.geo.lat]).addTo(map);
        });

        map.once('load', () => {
          if (mounted) setMapStatus('ready');
        });
        map.on('error', () => {
          if (mounted) setMapStatus('error');
        });

        cleanup = () => {
          map.remove();
        };
      })
      .catch(() => {
        if (mounted) setMapStatus('error');
      });

    return () => {
      mounted = false;
      cleanup();
    };
  }, [bounds, venues]);
  return (
    <aside className="map-shell panel">
      <div className="map-panel-copy">
        <p className="eyebrow">{labels.eyebrow}</p>
        <h3>{labels.title}</h3>
        <p className="muted">{labels.copy}</p>
      </div>
      <div ref={mapRef} className={`map-panel ${mapStatus === 'ready' ? 'map-panel-live' : 'map-panel-setup'}`}>
        {mapStatus !== 'ready' ? (
          <div className="map-setup-state" role="status">
            <strong>
              {mapStatus === 'loading'
                ? labels.loadingTitle
                : mapStatus === 'missing-token'
                  ? labels.missingTitle
                  : labels.errorTitle}
            </strong>
            <span>
              {mapStatus === 'loading'
                ? labels.loadingBody
                : mapStatus === 'missing-token'
                  ? labels.missingBody
                  : labels.errorBody}
            </span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
