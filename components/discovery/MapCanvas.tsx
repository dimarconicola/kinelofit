'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FilterSpecification, GeoJSONSource, Map as MapboxMap, MapLayerMouseEvent } from 'mapbox-gl';

import type { Locale } from '@/lib/catalog/types';
import { env } from '@/lib/env';
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

type CanvasStatus = 'loading' | 'ready' | 'error';

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      slug: string;
      name: string;
      sessionCount: number;
    };
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }>;
};

const buildFeatureCollection = (venues: MapVenueSummary[]): GeoJsonFeatureCollection => ({
  type: 'FeatureCollection',
  features: venues.map((venue) => ({
    type: 'Feature',
    properties: {
      slug: venue.venueSlug,
      name: venue.name,
      sessionCount: venue.matchingSessionCount
    },
    geometry: {
      type: 'Point',
      coordinates: [venue.geo.lng, venue.geo.lat]
    }
  }))
});

const buildFitBounds = (
  cityBounds: [number, number, number, number],
  venues: MapVenueSummary[],
  userLocation?: GeoPoint | null
): [[number, number], [number, number]] => {
  if (venues.length === 0 && !userLocation) {
    return [
      [cityBounds[0], cityBounds[1]],
      [cityBounds[2], cityBounds[3]]
    ];
  }

  const points = [...venues.map((venue) => venue.geo), ...(userLocation ? [userLocation] : [])];
  const lngValues = points.map((point) => point.lng);
  const latValues = points.map((point) => point.lat);

  return [
    [Math.min(...lngValues), Math.min(...latValues)],
    [Math.max(...lngValues), Math.max(...latValues)]
  ];
};

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
          loadingBody: `Carico le sedi di ${cityName} e i relativi orari.` ,
          errorTitle: 'La vista mappa non riesce a caricarsi bene',
          errorBody: 'Per ora continua da lista o calendario: gli stessi filtri restano validi.',
          unavailableTitle: 'La vista mappa non è disponibile qui',
          unavailableBody: 'Continua da lista o calendario: le stesse classi restano consultabili.',
          fallbackTitle: `${cityName}, vista rapida`,
          fallbackBody: 'In questa anteprima le sedi restano selezionabili direttamente sulla mappa semplificata.',
          emptyTitle: 'Nessuno studio corrisponde ai filtri attuali',
          emptyBody: 'Allarga i filtri o cambia giorno per riaprire la mappa.',
          markerLabel: 'Apri studio',
          userLocation: 'La tua posizione'
        }
      : {
          loadingTitle: 'Preparing the map',
          loadingBody: `Loading ${cityName} venues and matching times.`,
          errorTitle: 'Map view could not load cleanly',
          errorBody: 'Continue with list or calendar for the same filtered results.',
          unavailableTitle: 'Map view is not available here',
          unavailableBody: 'Continue with list or calendar for the same filtered results.',
          fallbackTitle: `${cityName}, quick view`,
          fallbackBody: 'In this preview the venues stay directly selectable on the simplified map.',
          emptyTitle: 'No venues match these filters',
          emptyBody: 'Broaden the filters or change day to reopen the map.',
          markerLabel: 'Open venue',
          userLocation: 'Your location'
        };

  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapboxMap | null>(null);
  const onSelectVenueRef = useRef(onSelectVenue);
  const collection = useMemo(() => buildFeatureCollection(venues), [venues]);
  const venueBySlug = useMemo(() => new Map(venues.map((venue) => [venue.venueSlug, venue] as const)), [venues]);
  const collectionRef = useRef(collection);
  const venuesRef = useRef(venues);
  const userLocationRef = useRef(userLocation);
  const [status, setStatus] = useState<CanvasStatus>(renderMode === 'interactive' ? 'loading' : 'ready');

  onSelectVenueRef.current = onSelectVenue;
  collectionRef.current = collection;
  venuesRef.current = venues;
  userLocationRef.current = userLocation;

  useEffect(() => {
    if (renderMode !== 'interactive' || !mapNodeRef.current) {
      return undefined;
    }

    let isMounted = true;
    let cleanup = () => {};
    setStatus('loading');

    void import('mapbox-gl')
      .then(({ default: mapboxgl }) => {
        if (!isMounted || !mapNodeRef.current) return;

        mapboxgl.accessToken = env.mapboxToken ?? '';
        const map = new mapboxgl.Map({
          container: mapNodeRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          attributionControl: false,
          center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
          zoom: 11.3
        });

        mapInstanceRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        const fitToCurrentData = (duration = 0) => {
          const fitBounds = buildFitBounds(bounds, venuesRef.current, userLocationRef.current);
          map.fitBounds(fitBounds, {
            padding: readOnly ? 28 : 56,
            duration,
            maxZoom: venuesRef.current.length === 1 ? 14.5 : 13.6
          });
        };

        map.on('load', () => {
          if (!isMounted) return;

          map.addSource('venues', {
            type: 'geojson',
            data: collectionRef.current,
            cluster: true,
            clusterMaxZoom: 12,
            clusterRadius: 42
          });

          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'venues',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#f58a57',
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#fff8ef',
              'circle-radius': ['step', ['get', 'point_count'], 18, 6, 24, 14, 30],
              'circle-opacity': 0.92
            }
          });

          map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'venues',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-size': 12,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
            },
            paint: {
              'text-color': '#fff8ef'
            }
          });

          map.addLayer({
            id: 'selected-venue-ring',
            type: 'circle',
            source: 'venues',
            filter: ['==', ['get', 'slug'], '__none__'],
            paint: {
              'circle-radius': 18,
              'circle-color': 'rgba(13, 87, 92, 0.18)',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#0d575c'
            }
          });

          map.addLayer({
            id: 'venue-points',
            type: 'circle',
            source: 'venues',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'sessionCount'],
                1,
                8,
                4,
                10,
                8,
                13
              ],
              'circle-color': '#0d575c',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff8ef'
            }
          });

          map.addLayer({
            id: 'venue-point-labels',
            type: 'symbol',
            source: 'venues',
            filter: ['!', ['has', 'point_count']],
            layout: {
              'text-field': ['get', 'sessionCount'],
              'text-size': 11,
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
              'text-offset': [0, 0.05]
            },
            paint: {
              'text-color': '#fff8ef'
            }
          });

          map.addSource('user-location', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          map.addLayer({
            id: 'user-location-point',
            type: 'circle',
            source: 'user-location',
            paint: {
              'circle-radius': 8,
              'circle-color': '#1f6f7a',
              'circle-stroke-width': 3,
              'circle-stroke-color': '#fff8ef'
            }
          });

          map.on('click', 'clusters', (event: MapLayerMouseEvent) => {
            const feature = map.queryRenderedFeatures(event.point, { layers: ['clusters'] })[0];
            if (!feature) return;
            const source = map.getSource('venues') as GeoJSONSource | undefined;
            const clusterId = feature.properties?.cluster_id;
            if (!source || typeof clusterId !== 'number' || typeof source.getClusterExpansionZoom !== 'function') return;
            source.getClusterExpansionZoom(clusterId, (error: unknown, zoom: number | null | undefined) => {
              if (error || typeof zoom !== 'number') return;
              const coordinates = (feature.geometry as { coordinates?: [number, number] } | undefined)?.coordinates;
              if (!Array.isArray(coordinates) || coordinates.length < 2) return;
              map.easeTo({ center: [coordinates[0], coordinates[1]], zoom, duration: 500 });
            });
          });

          map.on('click', 'venue-points', (event: MapLayerMouseEvent) => {
            const feature = map.queryRenderedFeatures(event.point, { layers: ['venue-points'] })[0];
            const slug = feature?.properties?.slug;
            if (typeof slug === 'string') {
              onSelectVenueRef.current?.(slug);
            }
          });

          map.on('click', (event: MapLayerMouseEvent) => {
            const hit = map.queryRenderedFeatures(event.point, { layers: ['clusters', 'venue-points'] });
            if (hit.length === 0 && !readOnly) {
              onSelectVenueRef.current?.(undefined);
            }
          });

          map.on('mouseenter', 'clusters', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'clusters', () => {
            map.getCanvas().style.cursor = '';
          });
          map.on('mouseenter', 'venue-points', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'venue-points', () => {
            map.getCanvas().style.cursor = '';
          });
          map.on('error', () => {
            if (isMounted) setStatus('error');
          });

          fitToCurrentData(0);
          setStatus('ready');
        });

        cleanup = () => {
          map.remove();
          mapInstanceRef.current = null;
        };
      })
      .catch(() => {
        if (isMounted) setStatus('error');
      });

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [bounds, readOnly, renderMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || renderMode !== 'interactive') return;

    const source = map.getSource('venues') as GeoJSONSource | undefined;
    if (source && typeof source.setData === 'function') {
      source.setData(collection);
    }

    const userSource = map.getSource('user-location') as GeoJSONSource | undefined;
    if (userSource && typeof userSource.setData === 'function') {
      userSource.setData({
        type: 'FeatureCollection',
        features: userLocation
          ? [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [userLocation.lng, userLocation.lat]
                }
              }
            ]
          : []
      });
    }

    const selectedFilter: FilterSpecification = ['==', ['get', 'slug'], selectedVenueSlug ?? '__none__'];
    if (typeof map.setFilter === 'function') {
      map.setFilter('selected-venue-ring', selectedFilter);
    }

    const fitBounds = buildFitBounds(bounds, venues, userLocation);
    if (!selectedVenueSlug) {
      map.fitBounds(fitBounds, {
        padding: readOnly ? 28 : 56,
        duration: 350,
        maxZoom: venues.length === 1 ? 14.5 : 13.6
      });
      return;
    }

    const selectedVenue = venueBySlug.get(selectedVenueSlug);
    if (!selectedVenue) return;

    map.easeTo({
      center: [selectedVenue.geo.lng, selectedVenue.geo.lat],
      zoom: Math.max(typeof map.getZoom === 'function' ? map.getZoom() : 12.5, 13.4),
      duration: 450
    });
  }, [bounds, collection, readOnly, renderMode, selectedVenueSlug, userLocation, venueBySlug, venues]);

  const fallbackMarkers = useMemo(
    () =>
      venues.map((venue) => ({
        venue,
        x: ((venue.geo.lng - bounds[0]) / Math.max(bounds[2] - bounds[0], 0.0001)) * 100,
        y: (1 - (venue.geo.lat - bounds[1]) / Math.max(bounds[3] - bounds[1], 0.0001)) * 100
      })),
    [bounds, venues]
  );

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

  if (renderMode === 'fallback') {
    return (
      <div className="classes-map-canvas classes-map-canvas-fallback" aria-label={labels.fallbackTitle}>
        <svg viewBox="0 0 100 100" className="classes-map-fallback-grid" role="img" aria-hidden="true">
          <rect x="0" y="0" width="100" height="100" rx="10" />
          <path d="M8 24 C25 28, 34 16, 46 24 S70 46, 92 34" />
          <path d="M12 68 C26 54, 42 56, 56 70 S78 88, 92 80" />
        </svg>
        <div className="classes-map-fallback-copy">
          <strong>{labels.fallbackTitle}</strong>
          <span>{labels.fallbackBody}</span>
        </div>
        {fallbackMarkers.map(({ venue, x, y }) => (
          <button
            key={venue.venueSlug}
            type="button"
            className={`fallback-map-marker ${selectedVenueSlug === venue.venueSlug ? 'is-selected' : ''}`}
            style={{
              left: `${Math.min(Math.max(x, 7), 93)}%`,
              top: `${Math.min(Math.max(y, 9), 91)}%`
            }}
            onClick={() => onSelectVenue?.(venue.venueSlug)}
            aria-label={`${labels.markerLabel} ${venue.name}`}
            aria-pressed={selectedVenueSlug === venue.venueSlug}
          >
            <span>{venue.matchingSessionCount}</span>
          </button>
        ))}
        {userLocation ? <span className="fallback-map-user-location" aria-label={labels.userLocation} /> : null}
      </div>
    );
  }

  return (
    <div className={`classes-map-canvas ${status === 'ready' ? 'is-live' : 'is-pending'}`}>
      <div ref={mapNodeRef} className="classes-map-canvas-node" />
      {status !== 'ready' ? (
        <div className="classes-map-overlay-state" role="status">
          <strong>{status === 'loading' ? labels.loadingTitle : labels.errorTitle}</strong>
          <span>{status === 'loading' ? labels.loadingBody : labels.errorBody}</span>
        </div>
      ) : null}
    </div>
  );
}
