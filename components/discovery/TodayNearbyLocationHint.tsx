'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { Locale } from '@/lib/catalog/types';

interface TodayNearbyLocationHintProps {
  locale: Locale;
  cityName: string;
  hasGeolocation: boolean;
}

type GeoState = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable';

const STORAGE_KEY = 'kinelofit_today_nearby_geo_state';

export function TodayNearbyLocationHint({ locale, cityName, hasGeolocation }: TodayNearbyLocationHintProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [geoState, setGeoState] = useState<GeoState>(hasGeolocation ? 'granted' : 'idle');

  const labels = useMemo(
    () =>
      locale === 'it'
        ? {
            locating: 'Cerco la tua posizione per ordinare le classi più vicine.',
            granted: `Classi ordinate per distanza dalla tua posizione a ${cityName}.`,
            denied: 'Geolocalizzazione negata: ordine dal centro città.',
            unavailable: 'Geolocalizzazione non disponibile: ordine dal centro città.'
          }
        : {
            locating: 'Checking your location to sort nearby sessions.',
            granted: `Sessions sorted by distance from your location in ${cityName}.`,
            denied: 'Location denied: falling back to city-center ordering.',
            unavailable: 'Location unavailable: falling back to city-center ordering.'
          },
    [cityName, locale]
  );

  useEffect(() => {
    if (hasGeolocation) {
      setGeoState('granted');
      return;
    }

    if (typeof window === 'undefined') return;

    const remembered = window.localStorage.getItem(STORAGE_KEY);
    if (remembered === 'denied' || remembered === 'unavailable') {
      setGeoState(remembered);
      return;
    }

    if (!('geolocation' in navigator)) {
      window.localStorage.setItem(STORAGE_KEY, 'unavailable');
      setGeoState('unavailable');
      return;
    }

    setGeoState('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = new URLSearchParams(searchParams.toString());
        next.set('lat', position.coords.latitude.toFixed(6));
        next.set('lng', position.coords.longitude.toFixed(6));
        window.localStorage.setItem(STORAGE_KEY, 'granted');
        setGeoState('granted');
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      },
      (error) => {
        const nextState: GeoState = error.code === 1 ? 'denied' : 'unavailable';
        window.localStorage.setItem(STORAGE_KEY, nextState);
        setGeoState(nextState);
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 10 * 60 * 1000
      }
    );
  }, [hasGeolocation, pathname, router, searchParams]);

  if (geoState === 'idle') return null;

  return (
    <p className="muted">
      {geoState === 'locating' ? labels.locating : null}
      {geoState === 'granted' ? labels.granted : null}
      {geoState === 'denied' ? labels.denied : null}
      {geoState === 'unavailable' ? labels.unavailable : null}
    </p>
  );
}
