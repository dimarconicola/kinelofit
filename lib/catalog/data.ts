import { DateTime } from 'luxon';

import { applySessionFilters } from '@/lib/catalog/filters';
import { bookingTargets, categories, cities, collections, instructors, neighborhoods, sessions, styles, venues } from '@/lib/catalog/seed';
import type { DiscoveryFilters, Locale, Session } from '@/lib/catalog/types';

export const defaultLocale: Locale = 'it';
export const locales: Locale[] = ['en', 'it'];

export const getLocaleLabel = (locale: Locale, value: Record<Locale, string>) => value[locale];

export const getCity = (citySlug: string) => cities.find((city) => city.slug === citySlug);
export const getPublicCities = () => cities.filter((city) => city.status === 'public');
export const getSeedCities = () => cities.filter((city) => city.status !== 'public');
export const getNeighborhoods = (citySlug: string) => neighborhoods.filter((item) => item.citySlug === citySlug);
export const getCategories = (citySlug: string) => categories.filter((item) => item.citySlug === citySlug);
export const getPublicCategories = (citySlug: string) => getCategories(citySlug).filter((item) => item.visibility !== 'hidden');
export const getCollections = (citySlug: string) => collections.filter((item) => item.citySlug === citySlug);
export const getVenue = (slug: string) => venues.find((venue) => venue.slug === slug);
export const getInstructor = (slug: string) => instructors.find((instructor) => instructor.slug === slug);
export const getStyle = (slug: string) => styles.find((style) => style.slug === slug);
export const getCategory = (slug: string) => categories.find((category) => category.slug === slug);
export const getBookingTarget = (slug: string) => bookingTargets.find((target) => target.slug === slug);

export const getSessions = (citySlug: string, filters: DiscoveryFilters = {}) => {
  const visibleCategories = new Set(
    getCategories(citySlug)
      .filter((category) => category.visibility !== 'hidden')
      .map((category) => category.slug)
  );

  const citySessions = sessions.filter(
    (session) =>
      session.citySlug === citySlug &&
      session.verificationStatus !== 'hidden' &&
      visibleCategories.has(session.categorySlug)
  );
  const filtered = applySessionFilters(citySessions, filters).filter((session) => {
    if (!filters.neighborhood) return true;
    const venue = getVenue(session.venueSlug);
    return venue?.neighborhoodSlug === filters.neighborhood;
  });

  return filtered;
};

export const getVenueSessions = (venueSlug: string) => sessions.filter((session) => session.venueSlug === venueSlug);
export const getInstructorSessions = (instructorSlug: string) => sessions.filter((session) => session.instructorSlug === instructorSlug);
export const getCategorySessions = (citySlug: string, categorySlug: string) => getSessions(citySlug, { category: categorySlug });
export const getNeighborhoodSessions = (citySlug: string, neighborhoodSlug: string) => getSessions(citySlug, { neighborhood: neighborhoodSlug });

export const getCollectionSessions = (citySlug: string, slug: string): Session[] => {
  if (slug === 'today-nearby') return getSessions(citySlug, { date: 'today' }).slice(0, 12);

  if (slug === 'new-this-week') {
    return getSessions(citySlug, { date: 'week' })
      .filter((session) => {
        const verifiedAt = DateTime.fromISO(session.lastVerifiedAt).setZone('Europe/Rome');
        return verifiedAt >= DateTime.now().setZone('Europe/Rome').minus({ days: 7 });
      })
      .slice(0, 12);
  }

  if (slug === 'english-speaking-classes') return getSessions(citySlug, { language: 'English' }).slice(0, 12);

  return [];
};

export const getFeaturedSessions = (citySlug: string) => getSessions(citySlug, { date: 'week' }).slice(0, 8);

export const getCityMetrics = (citySlug: string) => {
  const cityVenues = venues.filter((venue) => venue.citySlug === citySlug);
  const citySessions = getSessions(citySlug, { date: 'week' });
  const liveNeighborhoods = new Set(cityVenues.map((venue) => venue.neighborhoodSlug));
  const liveStyles = new Set(citySessions.map((session) => session.styleSlug));

  return {
    venues: cityVenues.length,
    sessions: citySessions.length,
    neighborhoods: liveNeighborhoods.size,
    styles: liveStyles.size
  };
};
