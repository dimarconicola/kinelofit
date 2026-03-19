import { DateTime } from 'luxon';

import { applySessionFilters } from '@/lib/catalog/filters';
export { defaultLocale, locales } from '@/lib/catalog/constants';
import { getCatalogSnapshot, type CatalogSnapshot } from '@/lib/catalog/repository';
import type { DiscoveryFilters, Locale, Session } from '@/lib/catalog/types';

export const getLocaleLabel = (locale: Locale, value: Record<Locale, string>) => value[locale];

const getCityFromSnapshot = (catalog: CatalogSnapshot, citySlug: string) => catalog.cities.find((city) => city.slug === citySlug);
const getVenueFromSnapshot = (catalog: CatalogSnapshot, slug: string) => catalog.venues.find((venue) => venue.slug === slug);
const getInstructorFromSnapshot = (catalog: CatalogSnapshot, slug: string) => catalog.instructors.find((instructor) => instructor.slug === slug);
const getStyleFromSnapshot = (catalog: CatalogSnapshot, slug: string) => catalog.styles.find((style) => style.slug === slug);
const getCategoryFromSnapshot = (catalog: CatalogSnapshot, slug: string) => catalog.categories.find((category) => category.slug === slug);
const getBookingTargetFromSnapshot = (catalog: CatalogSnapshot, slug: string) => catalog.bookingTargets.find((target) => target.slug === slug);

const getCategoriesFromSnapshot = (catalog: CatalogSnapshot, citySlug: string) => catalog.categories.filter((item) => item.citySlug === citySlug);
const getNeighborhoodsFromSnapshot = (catalog: CatalogSnapshot, citySlug: string) =>
  catalog.neighborhoods.filter((item) => item.citySlug === citySlug);
const getCollectionsFromSnapshot = (catalog: CatalogSnapshot, citySlug: string) =>
  catalog.collections.filter((item) => item.citySlug === citySlug);

const getSessionsFromSnapshot = (catalog: CatalogSnapshot, citySlug: string, filters: DiscoveryFilters = {}) => {
  const visibleCategories = new Set(
    getCategoriesFromSnapshot(catalog, citySlug)
      .filter((category) => category.visibility !== 'hidden')
      .map((category) => category.slug)
  );

  const citySessions = catalog.sessions.filter(
    (session) =>
      session.citySlug === citySlug &&
      session.verificationStatus !== 'hidden' &&
      visibleCategories.has(session.categorySlug)
  );

  return applySessionFilters(citySessions, filters).filter((session) => {
    if (!filters.neighborhood) return true;
    const venue = getVenueFromSnapshot(catalog, session.venueSlug);
    return venue?.neighborhoodSlug === filters.neighborhood;
  });
};

export const getCatalogSourceMode = async () => (await getCatalogSnapshot()).sourceMode;

export const getCity = async (citySlug: string) => getCityFromSnapshot(await getCatalogSnapshot(), citySlug);
export const getPublicCities = async () => (await getCatalogSnapshot()).cities.filter((city) => city.status === 'public');
export const getSeedCities = async () => (await getCatalogSnapshot()).cities.filter((city) => city.status !== 'public');
export const getNeighborhoods = async (citySlug: string) => getNeighborhoodsFromSnapshot(await getCatalogSnapshot(), citySlug);
export const getCategories = async (citySlug: string) => getCategoriesFromSnapshot(await getCatalogSnapshot(), citySlug);
export const getPublicCategories = async (citySlug: string) => (await getCategories(citySlug)).filter((item) => item.visibility !== 'hidden');
export const getCollections = async (citySlug: string) => getCollectionsFromSnapshot(await getCatalogSnapshot(), citySlug);
export const getVenue = async (slug: string) => getVenueFromSnapshot(await getCatalogSnapshot(), slug);
export const getInstructor = async (slug: string) => getInstructorFromSnapshot(await getCatalogSnapshot(), slug);
export const getStyle = async (slug: string) => getStyleFromSnapshot(await getCatalogSnapshot(), slug);
export const getStyles = async () => (await getCatalogSnapshot()).styles;
export const getCategory = async (slug: string) => getCategoryFromSnapshot(await getCatalogSnapshot(), slug);
export const getBookingTarget = async (slug: string) => getBookingTargetFromSnapshot(await getCatalogSnapshot(), slug);

export const getSessions = async (citySlug: string, filters: DiscoveryFilters = {}) =>
  getSessionsFromSnapshot(await getCatalogSnapshot(), citySlug, filters);

export const getVenueSessions = async (venueSlug: string) =>
  (await getCatalogSnapshot()).sessions.filter((session) => session.venueSlug === venueSlug);

export const getInstructorSessions = async (instructorSlug: string) =>
  (await getCatalogSnapshot()).sessions.filter((session) => session.instructorSlug === instructorSlug);

export const getCategorySessions = async (citySlug: string, categorySlug: string) => getSessions(citySlug, { category: categorySlug });
export const getNeighborhoodSessions = async (citySlug: string, neighborhoodSlug: string) => getSessions(citySlug, { neighborhood: neighborhoodSlug });

export const getCollectionSessions = async (citySlug: string, slug: string): Promise<Session[]> => {
  const catalog = await getCatalogSnapshot();

  if (slug === 'today-nearby') return getSessionsFromSnapshot(catalog, citySlug, { date: 'today' }).slice(0, 12);

  if (slug === 'new-this-week') {
    return getSessionsFromSnapshot(catalog, citySlug, { date: 'week' })
      .filter((session) => {
        const verifiedAt = DateTime.fromISO(session.lastVerifiedAt).setZone('Europe/Rome');
        return verifiedAt >= DateTime.now().setZone('Europe/Rome').minus({ days: 7 });
      })
      .slice(0, 12);
  }

  if (slug === 'english-speaking-classes') {
    return getSessionsFromSnapshot(catalog, citySlug, { language: 'English' }).slice(0, 12);
  }

  return [];
};

export const getFeaturedSessions = async (citySlug: string) => (await getSessions(citySlug, { date: 'week' })).slice(0, 8);

export const getCityMetrics = async (citySlug: string) => {
  const catalog = await getCatalogSnapshot();
  const cityVenues = catalog.venues.filter((venue) => venue.citySlug === citySlug);
  const citySessions = getSessionsFromSnapshot(catalog, citySlug, { date: 'week' });
  const liveNeighborhoods = new Set(cityVenues.map((venue) => venue.neighborhoodSlug));
  const liveStyles = new Set(citySessions.map((session) => session.styleSlug));

  return {
    venues: cityVenues.length,
    sessions: citySessions.length,
    neighborhoods: liveNeighborhoods.size,
    styles: liveStyles.size
  };
};
