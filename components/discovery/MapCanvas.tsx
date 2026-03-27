'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import type { Locale } from '@/lib/catalog/types';
import type { MapRenderMode, MapVenueSummary } from '@/components/discovery/classes-results.types';
import type { GeoPoint } from '@/lib/map/distance';

interface MapCanvasProps {
  locale: Locale;
  cityName: string;
  bounds: [number, number, number, number];
  venues: MapVenueSummary[];
  renderMode: MapRenderMode;
  selectedVenueSlug?: string;
  onSelectVenue?: (slug?: string) => void;
  userLocation?: GeoPoint | null;
  readOnly?: boolean;
}

const LeafletMapStage = dynamic(
  () => import('@/components/discovery/LeafletMapStage').then((module) => module.LeafletMapStage),
  { ssr: false }
);

type CanvasStatus = 'loading' | 'ready' | 'error';

export function MapCanvas({
  locale,
  cityName,
  bounds,
  venues,
  renderMode,
  selectedVenueSlug,
  onSelectVenue,
  userLocation,
  readOnly = false
}: MapCanvasProps) {
  const labels =
    locale === 'it'
      ? {
          loadingTitle: 'Sto preparando la mappa',
          loadingBody: `Carico le sedi di ${cityName} e i relativi orari.`,
          errorTitle: 'La vista mappa non riesce a caricarsi bene',
          errorBody: 'Per ora continua da lista o calendario: gli stessi filtri restano validi.',
          unavailableTitle: 'La vista mappa non è disponibile qui',
          unavailableBody: 'Continua da lista o calendario: le stesse classi restano consultabili.',
          tileIssue: 'Sfondo mappa non disponibile, ma le sedi restano selezionabili.',
          emptyTitle: 'Nessuno studio corrisponde ai filtri attuali',
          emptyBody: 'Allarga i filtri o cambia giorno per riaprire la mappa.'
        }
      : {
          loadingTitle: 'Preparing the map',
          loadingBody: `Loading ${cityName} venues and matching times.`,
          errorTitle: 'Map view could not load cleanly',
          errorBody: 'Continue with list or calendar for the same filtered results.',
          unavailableTitle: 'Map view is not available here',
          unavailableBody: 'Continue with list or calendar for the same filtered results.',
          tileIssue: 'Map background is unavailable, but venues still remain selectable.',
          emptyTitle: 'No venues match these filters',
          emptyBody: 'Broaden the filters or change day to reopen the map.'
        };

  const [status, setStatus] = useState<CanvasStatus>(renderMode === 'interactive' ? 'loading' : 'ready');
  const [hasTileIssue, setHasTileIssue] = useState(false);

  if (renderMode === 'unavailable') {
    return (
      <div className="classes-map-canvas classes-map-canvas-unavailable" role="status">
        <div className="classes-map-unavailable-state">
          <strong>{labels.unavailableTitle}</strong>
          <span>{labels.unavailableBody}</span>
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="classes-map-canvas classes-map-canvas-empty" role="status">
        <div className="classes-map-empty-state">
          <strong>{labels.emptyTitle}</strong>
          <span>{labels.emptyBody}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`classes-map-canvas ${status === 'ready' ? 'is-live' : 'is-pending'}`}>
      <LeafletMapStage
        bounds={bounds}
        venues={venues}
        selectedVenueSlug={selectedVenueSlug}
        onSelectVenue={onSelectVenue}
        userLocation={userLocation}
        onReady={() => setStatus('ready')}
        onTileIssueChange={setHasTileIssue}
        readOnly={readOnly}
      />
      {status !== 'ready' ? (
        <div className="classes-map-overlay-state" role="status">
          <strong>{status === 'loading' ? labels.loadingTitle : labels.errorTitle}</strong>
          <span>{status === 'loading' ? labels.loadingBody : labels.errorBody}</span>
        </div>
      ) : null}
      {hasTileIssue && status === 'ready' ? <div className="classes-map-tile-note">{labels.tileIssue}</div> : null}
    </div>
  );
}
