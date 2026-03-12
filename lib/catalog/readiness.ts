import { DateTime } from 'luxon';

import { sessions, styles, venues } from '@/lib/catalog/seed';
import type { CityReadiness } from '@/lib/catalog/types';

export const getCityReadiness = (citySlug: string): CityReadiness => {
  const now = DateTime.now().setZone('Europe/Rome');
  const limit = now.plus({ days: 7 }).endOf('day');
  const citySessions = sessions.filter((session) => {
    const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');
    return session.citySlug === citySlug && session.verificationStatus !== 'hidden' && start >= now.startOf('day') && start <= limit;
  });
  const cityVenues = venues.filter((venue) => venue.citySlug === citySlug);
  const styleCount = new Set(citySessions.map((session) => session.styleSlug)).size || styles.length;
  const neighborhoods = new Set(cityVenues.map((venue) => venue.neighborhoodSlug)).size;
  const ctaCoverage = citySessions.length === 0 ? 0 : citySessions.filter((session) => Boolean(session.bookingTargetSlug)).length / citySessions.length;

  return {
    citySlug,
    venues: cityVenues.length,
    upcomingSessions: citySessions.length,
    neighborhoods,
    styles: styleCount,
    ctaCoverage,
    passesGate: cityVenues.length >= 12 && citySessions.length >= 75 && neighborhoods >= 4 && styleCount >= 4 && ctaCoverage >= 0.8
  };
};
