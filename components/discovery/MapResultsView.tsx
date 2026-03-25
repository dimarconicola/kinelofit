'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { MapCanvas } from '@/components/discovery/MapCanvas';
import type { MapRenderMode, MapUserLocationState, MapVenueSummary } from '@/components/discovery/classes-results.types';
import type { Locale } from '@/lib/catalog/types';
import { haversineKm, type GeoPoint } from '@/lib/map/distance';

type SheetState = 'collapsed' | 'peek' | 'expanded';

interface MapResultsViewProps {
  locale: Locale;
  citySlug: string;
  cityName: string;
  bounds: [number, number, number, number];
  visibleCount: number;
  mapVenueSummaries: MapVenueSummary[];
  selectedVenueSlug?: string;
  onSelectVenue: (slug?: string) => void;
  mapRenderMode: MapRenderMode;
  noResultsLabel: string;
}

const formatDistance = (locale: Locale, value: number) => {
  const formatter = new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    maximumFractionDigits: value >= 10 ? 0 : 1,
    minimumFractionDigits: value < 10 ? 1 : 0
  });

  return `${formatter.format(value)} km`;
};

export function MapResultsView({
  locale,
  citySlug,
  cityName,
  bounds,
  visibleCount,
  mapVenueSummaries,
  selectedVenueSlug,
  onSelectVenue,
  mapRenderMode,
  noResultsLabel
}: MapResultsViewProps) {
  const labels =
    locale === 'it'
      ? {
          visibleClasses: 'classi visibili',
          visibleVenues: 'studi in mappa',
          back: 'Torna alla città',
          filters: 'Filtri',
          locate: 'Trova vicino a me',
          locating: 'Sto cercando la tua posizione',
          locateGranted: 'Mappa riordinata per vicinanza',
          locateDenied: 'Posizione non disponibile. Resto sui confini della città.',
          openSheet: 'Apri risultati',
          collapseSheet: 'Riduci pannello',
          expandSheet: 'Apri dettagli',
          matchingSessions: 'lezioni in vista',
          nextSession: 'Prossima',
          studioPage: 'Apri studio',
          booking: 'Prenota o contatta',
          matchingTitle: 'Studi che corrispondono ai filtri',
          selectedTitle: 'Dettaglio sede',
          browseAll: 'Sfoglia tutte le sedi',
          noMatches: 'Nessuno studio corrisponde ai filtri attuali.',
          addressFallback: 'Indirizzo da confermare',
          geolocationUnavailable: 'Questo dispositivo non espone la geolocalizzazione.',
          mapUnavailable: 'La mappa interattiva non è disponibile qui. Usa lista o calendario per continuare.'
        }
      : {
          visibleClasses: 'visible classes',
          visibleVenues: 'venues on map',
          back: 'Back to city',
          filters: 'Filters',
          locate: 'Find near me',
          locating: 'Checking your location',
          locateGranted: 'Map sorted by proximity',
          locateDenied: 'Location unavailable. Staying on city bounds.',
          openSheet: 'Open results',
          collapseSheet: 'Collapse panel',
          expandSheet: 'Open details',
          matchingSessions: 'matching sessions',
          nextSession: 'Next',
          studioPage: 'View studio',
          booking: 'Book or contact',
          matchingTitle: 'Venues matching your filters',
          selectedTitle: 'Venue detail',
          browseAll: 'Browse all venues',
          noMatches: 'No venues match these filters.',
          addressFallback: 'Address to confirm',
          geolocationUnavailable: 'This device does not expose geolocation.',
          mapUnavailable: 'Interactive map is unavailable here. Use list or calendar to continue.'
        };

  const [sheetState, setSheetState] = useState<SheetState>(selectedVenueSlug ? 'expanded' : 'peek');
  const [userLocationState, setUserLocationState] = useState<MapUserLocationState>('idle');
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);

  useEffect(() => {
    if (selectedVenueSlug) {
      setSheetState('expanded');
      return;
    }

    setSheetState((current) => (current === 'expanded' ? 'peek' : current));
  }, [selectedVenueSlug]);

  const selectedVenue = useMemo(
    () => mapVenueSummaries.find((venue) => venue.venueSlug === selectedVenueSlug),
    [mapVenueSummaries, selectedVenueSlug]
  );

  const orderedVenues = useMemo(() => {
    if (!userLocation) {
      return [...mapVenueSummaries].sort(
        (left, right) =>
          (left.nextSession?.startAt ?? '9999').localeCompare(right.nextSession?.startAt ?? '9999') ||
          left.name.localeCompare(right.name, locale)
      );
    }

    return [...mapVenueSummaries]
      .map((venue) => ({ venue, distanceKm: haversineKm(userLocation, venue.geo) }))
      .sort(
        (left, right) =>
          left.distanceKm - right.distanceKm ||
          (left.venue.nextSession?.startAt ?? '9999').localeCompare(right.venue.nextSession?.startAt ?? '9999') ||
          left.venue.name.localeCompare(right.venue.name, locale)
      )
      .map(({ venue }) => venue);
  }, [locale, mapVenueSummaries, userLocation]);

  const locateMe = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUserLocationState('unavailable');
      return;
    }

    setUserLocationState('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setUserLocationState('granted');
      },
      (error) => {
        setUserLocationState(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 1000 * 60 * 5
      }
    );
  };

  const renderVenueItem = (venue: MapVenueSummary) => {
    const distance = userLocation ? haversineKm(userLocation, venue.geo) : null;

    return (
      <button
        key={venue.venueSlug}
        type="button"
        className={`classes-map-venue-item ${selectedVenueSlug === venue.venueSlug ? 'is-selected' : ''}`}
        onClick={() => onSelectVenue(venue.venueSlug)}
      >
        <div>
          <strong>{venue.name}</strong>
          <span>{venue.neighborhoodName}</span>
        </div>
        <div className="classes-map-venue-meta">
          <span>{venue.matchingSessionCount} {labels.matchingSessions}</span>
          {distance !== null ? <span>{formatDistance(locale, distance)}</span> : null}
        </div>
      </button>
    );
  };

  const mobileSummary = selectedVenue
    ? `${selectedVenue.name} · ${selectedVenue.matchingSessionCount} ${labels.matchingSessions}`
    : `${visibleCount} ${labels.visibleClasses} · ${mapVenueSummaries.length} ${labels.visibleVenues}`;

  return (
    <section className="classes-map-stage panel">
      <div className="classes-map-toolbar">
        <div className="classes-map-toolbar-primary">
          <NextLink href={`/${locale}/${citySlug}`} className="button button-ghost">
            {labels.back}
          </NextLink>
          <a href="#class-filters" className="button button-ghost">
            {labels.filters}
          </a>
        </div>
        <div className="classes-map-toolbar-secondary">
          <span className="meta-pill">
            {visibleCount} {labels.visibleClasses}
          </span>
          <span className="meta-pill">
            {mapVenueSummaries.length} {labels.visibleVenues}
          </span>
          <button
            type="button"
            className="button button-secondary"
            onClick={locateMe}
            disabled={userLocationState === 'locating'}
          >
            {userLocationState === 'locating' ? labels.locating : labels.locate}
          </button>
        </div>
      </div>

      {userLocationState !== 'idle' ? (
        <p className="classes-map-inline-status muted">
          {userLocationState === 'locating'
            ? labels.locating
            : userLocationState === 'granted'
            ? labels.locateGranted
            : userLocationState === 'unavailable'
              ? labels.geolocationUnavailable
              : labels.locateDenied}
        </p>
      ) : null}

      <div className="classes-map-layout">
        <div className="classes-map-stage-canvas">
          <MapCanvas
            locale={locale}
            cityName={cityName}
            bounds={bounds}
            venues={orderedVenues}
            renderMode={mapRenderMode}
            selectedVenueSlug={selectedVenueSlug}
            onSelectVenue={onSelectVenue}
            userLocation={userLocation}
          />
        </div>

        <aside className={`classes-map-sheet classes-map-sheet-${sheetState} ${selectedVenue ? 'has-selection' : ''}`}>
          <button
            type="button"
            className="classes-map-sheet-handle"
            onClick={() =>
              setSheetState((current) =>
                current === 'collapsed' ? 'peek' : current === 'peek' ? 'expanded' : 'collapsed'
              )
            }
            aria-label={sheetState === 'collapsed' ? labels.openSheet : sheetState === 'peek' ? labels.expandSheet : labels.collapseSheet}
          >
            <span />
            <strong>{mobileSummary}</strong>
          </button>

          <div className="classes-map-sheet-scroll">
            {mapRenderMode === 'unavailable' ? <p className="muted">{labels.mapUnavailable}</p> : null}

            {selectedVenue ? (
              <section className="classes-map-selected-venue">
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">{labels.selectedTitle}</p>
                    <h2>{selectedVenue.name}</h2>
                  </div>
                  <button type="button" className="button button-ghost" onClick={() => onSelectVenue(undefined)}>
                    {labels.browseAll}
                  </button>
                </div>
                <p className="muted">{selectedVenue.address || labels.addressFallback}</p>
                <div className="badge-row">
                  <span className="meta-pill">{selectedVenue.neighborhoodName}</span>
                  <span className="meta-pill">{selectedVenue.matchingSessionCount} {labels.matchingSessions}</span>
                </div>
                {selectedVenue.nextSession ? (
                  <div className="classes-map-next-session">
                    <p className="eyebrow">{labels.nextSession}</p>
                    <strong>
                      {selectedVenue.nextSession.startLabel} · {selectedVenue.nextSession.title}
                    </strong>
                    <span>
                      {selectedVenue.nextSession.styleName}
                      {selectedVenue.nextSession.instructorName ? ` · ${selectedVenue.nextSession.instructorName}` : ''}
                    </span>
                  </div>
                ) : null}
                <div className="classes-map-cta-row">
                  <NextLink href={selectedVenue.studioHref} className="button button-primary">
                    {labels.studioPage}
                  </NextLink>
                  {selectedVenue.primaryCtaHref ? (
                    <a href={selectedVenue.primaryCtaHref} className="button button-secondary" target="_blank" rel="noreferrer">
                      {selectedVenue.primaryCtaLabel ?? labels.booking}
                    </a>
                  ) : null}
                </div>
                <div className="classes-map-preview-list">
                  {selectedVenue.sessionsPreview.map((session) => (
                    <article key={session.sessionId} className="classes-map-preview-card">
                      <div>
                        <strong>{session.startLabel}</strong>
                        <span>{session.title}</span>
                      </div>
                      <small>
                        {[session.styleName, session.instructorName].filter(Boolean).join(' · ')}
                      </small>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <section className="classes-map-venue-browser">
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">{labels.matchingTitle}</p>
                    <h2>{mapVenueSummaries.length > 0 ? labels.browseAll : labels.noMatches}</h2>
                  </div>
                </div>
                <div className="classes-map-venue-list">
                  {orderedVenues.length > 0 ? orderedVenues.map(renderVenueItem) : <p className="muted">{noResultsLabel}</p>}
                </div>
              </section>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
