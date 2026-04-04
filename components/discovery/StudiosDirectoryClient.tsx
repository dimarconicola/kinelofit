'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { MapCanvas } from '@/components/discovery/MapCanvas';
import type { MapRenderMode, MapUserLocationState, MapVenueSummary } from '@/components/discovery/classes-results.types';
import type { Locale } from '@/lib/catalog/types';
import { haversineKm, type GeoPoint } from '@/lib/map/distance';
import { buildOpenStreetMapHref } from '@/lib/ui/maps';

export interface StudioDirectoryCard {
  slug: string;
  name: string;
  neighborhoodName: string;
  address: string;
  geo: { lat: number; lng: number };
  tagline: string;
  sessionCount: number;
  nextSessionLabel?: string;
  styles: string[];
  studioHref: string;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
}

interface StudiosDirectoryClientProps {
  locale: Locale;
  citySlug: string;
  cityName: string;
  bounds: [number, number, number, number];
  cards: StudioDirectoryCard[];
  mapVenueSummaries: MapVenueSummary[];
  initialView: 'list' | 'map';
  initialSelectedVenueSlug?: string;
  mapRenderMode: MapRenderMode;
}

export function StudiosDirectoryClient({
  locale,
  cityName,
  bounds,
  cards,
  mapVenueSummaries,
  initialView,
  initialSelectedVenueSlug,
  mapRenderMode
}: StudiosDirectoryClientProps) {
  const pathname = usePathname();
  const [view, setView] = useState<'list' | 'map'>(initialView);
  const [selectedVenueSlug, setSelectedVenueSlug] = useState<string | undefined>(initialSelectedVenueSlug);
  const [userLocationState, setUserLocationState] = useState<MapUserLocationState>('idle');
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);

  const labels =
    locale === 'it'
      ? {
          list: 'Lista',
          map: 'Vista mappa',
          studios: 'studi',
          matchingSessions: 'lezioni nei prossimi 7 giorni',
          nextSession: 'Prossima',
          browseTitle: 'Studi in ordine alfabetico',
          mapTitle: 'Tutte le sedi sulla mappa',
          mapLead: 'Seleziona una sede per vedere il ritmo della settimana e passare alla pagina studio.',
          locate: 'Trova vicino a me',
          locating: 'Sto cercando la tua posizione',
          locateGranted: 'Sedi riordinate per vicinanza',
          locateDenied: 'Posizione non disponibile. Resto sui confini della città.',
          geolocationUnavailable: 'Questo dispositivo non espone la geolocalizzazione.',
          openStudio: 'Apri studio',
          openMap: 'Mappa',
          noNext: 'Calendario pubblico non ancora visibile.'
        }
      : {
          list: 'List',
          map: 'Map view',
          studios: 'studios',
          matchingSessions: 'classes over the next 7 days',
          nextSession: 'Next',
          browseTitle: 'Studios in alphabetical order',
          mapTitle: 'All studios on the map',
          mapLead: 'Select a venue to inspect the weekly rhythm and jump into the studio page.',
          locate: 'Find near me',
          locating: 'Checking your location',
          locateGranted: 'Venues sorted by proximity',
          locateDenied: 'Location unavailable. Staying on city bounds.',
          geolocationUnavailable: 'This device does not expose geolocation.',
          openStudio: 'Open studio',
          openMap: 'Map',
          noNext: 'No public next session visible yet.'
        };

  useEffect(() => {
    if (!selectedVenueSlug) return;
    if (mapVenueSummaries.some((venue) => venue.venueSlug === selectedVenueSlug)) return;
    setSelectedVenueSlug(undefined);
  }, [mapVenueSummaries, selectedVenueSlug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = new URLSearchParams(window.location.search);
    next.set('view', view);
    if (selectedVenueSlug) {
      next.set('venue', selectedVenueSlug);
    } else {
      next.delete('venue');
    }
    const query = next.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [pathname, selectedVenueSlug, view]);

  const selectedVenue = useMemo(
    () => mapVenueSummaries.find((venue) => venue.venueSlug === selectedVenueSlug),
    [mapVenueSummaries, selectedVenueSlug]
  );

  const cardsByProximity = useMemo(() => {
    if (!userLocation) return cards;

    return [...cards].sort((left, right) => {
      const leftVenue = mapVenueSummaries.find((venue) => venue.venueSlug === left.slug);
      const rightVenue = mapVenueSummaries.find((venue) => venue.venueSlug === right.slug);
      const leftDistance = leftVenue ? haversineKm(userLocation, leftVenue.geo) : Number.POSITIVE_INFINITY;
      const rightDistance = rightVenue ? haversineKm(userLocation, rightVenue.geo) : Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance || left.name.localeCompare(right.name, locale);
    });
  }, [cards, locale, mapVenueSummaries, userLocation]);

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

  return (
    <div className="stack-list">
      <section className="panel view-switcher-panel">
        <div className="view-switcher">
          <button type="button" className={`button ${view === 'list' ? 'button-primary' : 'button-ghost'}`} onClick={() => setView('list')}>
            {labels.list}
          </button>
          <button type="button" className={`button ${view === 'map' ? 'button-primary' : 'button-ghost'}`} onClick={() => setView('map')}>
            {labels.map}
          </button>
        </div>
      </section>

      {view === 'list' ? (
        <section className="panel studios-directory-browser">
          <div className="detail-header">
            <div>
              <p className="eyebrow">{cityName}</p>
              <h2>{labels.browseTitle}</h2>
            </div>
            <span className="meta-pill">
              {cards.length} {labels.studios}
            </span>
          </div>

          <div className="studios-directory-grid">
            {cards.map((card) => (
              <article key={card.slug} className="studios-directory-list-card">
                <div className="studios-directory-list-copy">
                  <div className="studios-directory-list-top">
                    <div>
                      <p className="eyebrow">{card.neighborhoodName}</p>
                      <h3>{card.name}</h3>
                    </div>
                    <span className="meta-pill">
                      {card.sessionCount} {labels.matchingSessions}
                    </span>
                  </div>
                  <p className="muted">{card.tagline}</p>
                  <p className="studios-directory-address">{card.address}</p>
                  <div className="badge-row">
                    {card.styles.map((style) => (
                      <span key={`${card.slug}-${style}`} className="meta-pill">
                        {style}
                      </span>
                    ))}
                  </div>
                  <div className="studios-directory-list-actions">
                    <a href={card.studioHref} className="button button-primary">
                      {labels.openStudio}
                    </a>
                    <a href={buildOpenStreetMapHref({ address: card.address, geo: card.geo })} target="_blank" rel="noreferrer" className="button button-secondary">
                      {labels.openMap}
                    </a>
                    {card.primaryCtaHref && card.primaryCtaLabel ? (
                      <a href={card.primaryCtaHref} target="_blank" rel="noreferrer" className="button button-ghost">
                        {card.primaryCtaLabel}
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="studios-directory-list-meta">
                  <p className="eyebrow">{labels.nextSession}</p>
                  <p className="muted">{card.nextSessionLabel ?? labels.noNext}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {view === 'map' ? (
        <section className="studios-map-stage panel">
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
          <div className="studios-map-shell">
            <div className="studios-map-canvas">
              <MapCanvas
                locale={locale}
                cityName={cityName}
                bounds={bounds}
                venues={mapVenueSummaries}
                renderMode={mapRenderMode}
                selectedVenueSlug={selectedVenueSlug}
                onSelectVenue={setSelectedVenueSlug}
                userLocation={userLocation}
              />
            </div>
            <aside className="studios-map-panel">
              <div className="detail-header">
                <div>
                  <p className="eyebrow">{cityName}</p>
                  <h2>{labels.mapTitle}</h2>
                  <p className="muted">{labels.mapLead}</p>
                </div>
                <div className="studios-map-panel-actions">
                  <span className="meta-pill">
                    {mapVenueSummaries.length} {labels.studios}
                  </span>
                  <button type="button" className="button button-secondary" onClick={locateMe} disabled={userLocationState === 'locating'}>
                    {userLocationState === 'locating' ? labels.locating : labels.locate}
                  </button>
                </div>
              </div>

              {selectedVenue ? (
                <article className="studios-map-selected">
                  <div className="studios-map-selected-top">
                    <div>
                      <p className="eyebrow">{selectedVenue.neighborhoodName}</p>
                      <h3>{selectedVenue.name}</h3>
                    </div>
                    <span className="meta-pill">
                      {selectedVenue.matchingSessionCount} {labels.matchingSessions}
                    </span>
                  </div>
                  <p className="studios-directory-address">{selectedVenue.address}</p>
                  <div className="studios-map-session-stack">
                    {selectedVenue.sessionsPreview.map((session) => (
                      <div key={session.sessionId} className="studios-map-session-card">
                        <strong>{session.title}</strong>
                        <span>
                          {session.startLabel} - {session.endLabel}
                        </span>
                        {session.instructorName ? <small>{session.instructorName}</small> : null}
                      </div>
                    ))}
                  </div>
                  <div className="studios-directory-list-actions">
                    <a href={selectedVenue.studioHref} className="button button-primary">
                      {labels.openStudio}
                    </a>
                    <a
                      href={buildOpenStreetMapHref({ address: selectedVenue.address, geo: selectedVenue.geo })}
                      target="_blank"
                      rel="noreferrer"
                      className="button button-secondary"
                    >
                      {labels.openMap}
                    </a>
                    {selectedVenue.primaryCtaHref && selectedVenue.primaryCtaLabel ? (
                      <a href={selectedVenue.primaryCtaHref} target="_blank" rel="noreferrer" className="button button-ghost">
                        {selectedVenue.primaryCtaLabel}
                      </a>
                    ) : null}
                  </div>
                </article>
              ) : (
                <div className="studios-map-list">
                  {cardsByProximity.map((card) => (
                    <button key={card.slug} type="button" className="studios-map-list-item" onClick={() => setSelectedVenueSlug(card.slug)}>
                      <div>
                        <strong>{card.name}</strong>
                        <span>{card.neighborhoodName}</span>
                      </div>
                      <span className="meta-pill">{card.sessionCount}</span>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </section>
      ) : null}
    </div>
  );
}
