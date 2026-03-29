'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L, { type DivIcon } from 'leaflet';
import Supercluster from 'supercluster';

import type { MapVenueSummary } from '@/components/discovery/classes-results.types';
import { getMapTileConfig } from '@/lib/map/config';
import type { GeoPoint } from '@/lib/map/distance';

type PointFeature = GeoJSON.Feature<GeoJSON.Point, { venueSlug: string; sessionCount: number; name: string }>;
type ClusterOrPoint = Supercluster.AnyProps & {
  cluster?: boolean;
  cluster_id?: number;
  point_count?: number;
  point_count_abbreviated?: string;
  venueSlug?: string;
  sessionCount?: number;
  name?: string;
};

interface LeafletMapStageProps {
  bounds: [number, number, number, number];
  venues: MapVenueSummary[];
  selectedVenueSlug?: string;
  onSelectVenue?: (slug?: string) => void;
  userLocation?: GeoPoint | null;
  onReady?: () => void;
  onTileIssueChange?: (hasIssue: boolean) => void;
  readOnly?: boolean;
}

const toLeafletBounds = (bounds: [number, number, number, number]) => [
  [bounds[1], bounds[0]],
  [bounds[3], bounds[2]]
] as [[number, number], [number, number]];

const buildDivIcon = (className: string, label: string, size: [number, number], anchor: [number, number]): DivIcon =>
  L.divIcon({
    className,
    html: `<span>${label}</span>`,
    iconSize: size,
    iconAnchor: anchor
  });

const buildPointIcon = (selected: boolean): DivIcon =>
  L.divIcon({
    className: `classes-map-point-icon${selected ? ' is-selected' : ''}`,
    html: '<span aria-hidden="true"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

function MapViewportController({
  bounds,
  venues,
  selectedVenueSlug,
  userLocation,
  onViewportChange,
  onMapBackgroundClick,
  readOnly = false
}: {
  bounds: [number, number, number, number];
  venues: MapVenueSummary[];
  selectedVenueSlug?: string;
  userLocation?: GeoPoint | null;
  onViewportChange: (zoom: number, bbox: [number, number, number, number]) => void;
  onMapBackgroundClick?: () => void;
  readOnly?: boolean;
}) {
  const map = useMap();

  const emitViewport = useCallback(() => {
    const mapBounds = map.getBounds();
    onViewportChange(map.getZoom(), [mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth()]);
  }, [map, onViewportChange]);

  useMapEvents({
    moveend: emitViewport,
    zoomend: emitViewport,
    click: () => {
      if (!readOnly) onMapBackgroundClick?.();
    }
  });

  useEffect(() => {
    if (selectedVenueSlug) {
      const venue = venues.find((item) => item.venueSlug === selectedVenueSlug);
      if (venue) {
        map.flyTo([venue.geo.lat, venue.geo.lng], Math.max(map.getZoom(), 15), {
          duration: 0.45
        });
        return;
      }
    }

    const basePoints = venues.map((venue) => [venue.geo.lat, venue.geo.lng] as [number, number]);
    const points = userLocation ? [...basePoints, [userLocation.lat, userLocation.lng] as [number, number]] : basePoints;

    if (points.length === 0) {
      map.fitBounds(toLeafletBounds(bounds), { padding: [32, 32], maxZoom: 12 });
      return;
    }

    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: points.length === 1 ? 15 : 14 });
  }, [bounds, map, selectedVenueSlug, userLocation, venues]);

  useEffect(() => {
    emitViewport();
  }, [emitViewport]);

  return null;
}

function ClusterLayer({
  clusterFeatures,
  clusterIndex,
  selectedVenueSlug,
  onSelectVenue
}: {
  clusterFeatures: Array<GeoJSON.Feature<GeoJSON.Point, ClusterOrPoint>>;
  clusterIndex: Supercluster<{ venueSlug: string; sessionCount: number; name: string }>;
  selectedVenueSlug?: string;
  onSelectVenue?: (slug?: string) => void;
}) {
  const map = useMap();

  const clusterIconFor = (count: number) =>
    buildDivIcon('classes-map-cluster-icon', String(count), count >= 10 ? [52, 52] : [46, 46], count >= 10 ? [26, 26] : [23, 23]);

  return (
    <>
      {clusterFeatures.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties ?? {};

        if (props.cluster && typeof props.cluster_id === 'number') {
          const count = props.point_count ?? 0;
          return (
            <Marker
              key={`cluster-${props.cluster_id}`}
              position={[lat, lng]}
              icon={clusterIconFor(count)}
              eventHandlers={{
                click: () => {
                  const leaves = clusterIndex.getLeaves(props.cluster_id!, count);
                  if (leaves.length > 1) {
                    const leafBounds = L.latLngBounds(
                      leaves.map((leaf) => [leaf.geometry.coordinates[1], leaf.geometry.coordinates[0]] as [number, number])
                    );
                    map.fitBounds(leafBounds, { padding: [56, 56], maxZoom: 16 });
                    return;
                  }

                  const nextZoom = clusterIndex.getClusterExpansionZoom(props.cluster_id!);
                  map.flyTo([lat, lng], nextZoom, { duration: 0.35 });
                }
              }}
            />
          );
        }

        const venueSlug = props.venueSlug;
        if (!venueSlug) return null;
        const isSelected = selectedVenueSlug === venueSlug;

        return (
          <Marker
            key={venueSlug}
            position={[lat, lng]}
            icon={buildPointIcon(isSelected)}
            eventHandlers={{
              click: () => onSelectVenue?.(venueSlug)
            }}
          />
        );
      })}
    </>
  );
}

export function LeafletMapStage({
  bounds,
  venues,
  selectedVenueSlug,
  onSelectVenue,
  userLocation,
  onReady,
  onTileIssueChange,
  readOnly = false
}: LeafletMapStageProps) {
  const [viewport, setViewport] = useState<{ zoom: number; bbox: [number, number, number, number] }>({
    zoom: 11,
    bbox: bounds
  });
  const tileConfig = getMapTileConfig();

  const venuePoints = useMemo<PointFeature[]>(() => {
    return venues.map((venue) => ({
      type: 'Feature',
      properties: {
        venueSlug: venue.venueSlug,
        sessionCount: venue.matchingSessionCount,
        name: venue.name
      },
      geometry: {
        type: 'Point',
        coordinates: [venue.geo.lng, venue.geo.lat]
      }
    }));
  }, [venues]);

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<{ venueSlug: string; sessionCount: number; name: string }>({
      radius: 64,
      maxZoom: 17,
      minZoom: 0
    });
    index.load(venuePoints);
    return index;
  }, [venuePoints]);

  const clusterFeatures = useMemo(
    () => clusterIndex.getClusters(viewport.bbox, Math.round(viewport.zoom)) as Array<GeoJSON.Feature<GeoJSON.Point, ClusterOrPoint>>,
    [clusterIndex, viewport]
  );

  return (
    <MapContainer
      center={[(bounds[1] + bounds[3]) / 2, (bounds[0] + bounds[2]) / 2]}
      zoom={11}
      minZoom={10}
      scrollWheelZoom
      zoomControl
      attributionControl
      className="classes-map-canvas-node leaflet-map-node"
      whenReady={() => onReady?.()}
    >
      <TileLayer
        url={tileConfig.tileUrl}
        attribution={tileConfig.attribution}
        subdomains={tileConfig.subdomains}
        eventHandlers={{
          tileerror: () => onTileIssueChange?.(true),
          load: () => onTileIssueChange?.(false)
        }}
      />
      <MapViewportController
        bounds={bounds}
        venues={venues}
        selectedVenueSlug={selectedVenueSlug}
        userLocation={userLocation}
        onViewportChange={(zoom, bbox) => setViewport({ zoom, bbox })}
        onMapBackgroundClick={onSelectVenue ? () => onSelectVenue(undefined) : undefined}
        readOnly={readOnly}
      />
      {userLocation ? (
        <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8} pathOptions={{ color: '#fff8ef', weight: 3, fillColor: '#1f6f7a', fillOpacity: 1 }} />
      ) : null}
      <ClusterLayer
        clusterFeatures={clusterFeatures}
        clusterIndex={clusterIndex}
        selectedVenueSlug={selectedVenueSlug}
        onSelectVenue={onSelectVenue}
      />
    </MapContainer>
  );
}
