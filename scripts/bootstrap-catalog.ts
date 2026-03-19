import {
  bookingTargets as seedBookingTargets,
  categories as seedCategories,
  cities as seedCities,
  collections as seedCollections,
  instructors as seedInstructors,
  neighborhoods as seedNeighborhoods,
  sessions as seedSessions,
  styles as seedStyles,
  venues as seedVenues
} from '@/lib/catalog/seed';
import { getDb, isDatabaseConfigured } from '@/lib/data/db';
import {
  activityCategories,
  bookingTargets,
  cities,
  editorialCollections,
  instructors,
  neighborhoods,
  sessions,
  sourceRegistry,
  styles,
  venues
} from '@/lib/data/schema';
import { getSeedSourceRegistry } from '@/lib/freshness/source-registry';

const upsertCatalog = async () => {
  if (!isDatabaseConfigured) {
    throw new Error('DATABASE_URL is not configured. Catalog bootstrap requires a writable Postgres database.');
  }

  const db = getDb();
  if (!db) {
    throw new Error('Database client could not be created.');
  }

  const registryEntries = seedCities.flatMap((city) => getSeedSourceRegistry(city.slug));

  await db.transaction(async (tx) => {
    await tx
      .insert(cities)
      .values(
        seedCities.map((city) => ({
          slug: city.slug,
          countryCode: city.countryCode,
          timezone: city.timezone,
          status: city.status,
          bounds: city.bounds,
          name: city.name,
          hero: city.hero
        }))
      )
      .onConflictDoUpdate({
        target: cities.slug,
        set: {
          countryCode: cities.countryCode,
          timezone: cities.timezone,
          status: cities.status,
          bounds: cities.bounds,
          name: cities.name,
          hero: cities.hero,
          updatedAt: new Date()
        }
      });

    await tx
      .insert(neighborhoods)
      .values(
        seedNeighborhoods.map((neighborhood) => ({
          citySlug: neighborhood.citySlug,
          slug: neighborhood.slug,
          name: neighborhood.name,
          description: neighborhood.description,
          centerLat: neighborhood.center.lat.toString(),
          centerLng: neighborhood.center.lng.toString()
        }))
      )
      .onConflictDoUpdate({
        target: neighborhoods.slug,
        set: {
          citySlug: neighborhoods.citySlug,
          name: neighborhoods.name,
          description: neighborhoods.description,
          centerLat: neighborhoods.centerLat,
          centerLng: neighborhoods.centerLng
        }
      });

    await tx
      .insert(activityCategories)
      .values(
        seedCategories.map((category) => ({
          citySlug: category.citySlug,
          slug: category.slug,
          visibility: category.visibility,
          name: category.name,
          description: category.description,
          heroMetric: category.heroMetric
        }))
      )
      .onConflictDoUpdate({
        target: activityCategories.slug,
        set: {
          citySlug: activityCategories.citySlug,
          visibility: activityCategories.visibility,
          name: activityCategories.name,
          description: activityCategories.description,
          heroMetric: activityCategories.heroMetric
        }
      });

    await tx
      .insert(styles)
      .values(
        seedStyles.map((style) => ({
          categorySlug: style.categorySlug,
          slug: style.slug,
          name: style.name,
          description: style.description
        }))
      )
      .onConflictDoUpdate({
        target: styles.slug,
        set: {
          categorySlug: styles.categorySlug,
          name: styles.name,
          description: styles.description
        }
      });

    await tx
      .insert(instructors)
      .values(
        seedInstructors.map((instructor) => ({
          citySlug: instructor.citySlug,
          slug: instructor.slug,
          name: instructor.name,
          shortBio: instructor.shortBio,
          specialties: instructor.specialties,
          languages: instructor.languages
        }))
      )
      .onConflictDoUpdate({
        target: instructors.slug,
        set: {
          citySlug: instructors.citySlug,
          name: instructors.name,
          shortBio: instructors.shortBio,
          specialties: instructors.specialties,
          languages: instructors.languages
        }
      });

    await tx
      .insert(bookingTargets)
      .values(
        seedBookingTargets.map((target) => ({
          slug: target.slug,
          type: target.type,
          label: target.label,
          href: target.href
        }))
      )
      .onConflictDoUpdate({
        target: bookingTargets.slug,
        set: {
          type: bookingTargets.type,
          label: bookingTargets.label,
          href: bookingTargets.href
        }
      });

    await tx
      .insert(venues)
      .values(
        seedVenues.map((venue) => ({
          citySlug: venue.citySlug,
          neighborhoodSlug: venue.neighborhoodSlug,
          slug: venue.slug,
          name: venue.name,
          tagline: venue.tagline,
          description: venue.description,
          address: venue.address,
          lat: venue.geo.lat.toString(),
          lng: venue.geo.lng.toString(),
          amenities: venue.amenities,
          languages: venue.languages,
          styleSlugs: venue.styleSlugs,
          categorySlugs: venue.categorySlugs,
          bookingTargetOrder: venue.bookingTargetOrder,
          freshnessNote: venue.freshnessNote,
          sourceUrl: venue.sourceUrl,
          lastVerifiedAt: new Date(venue.lastVerifiedAt)
        }))
      )
      .onConflictDoUpdate({
        target: venues.slug,
        set: {
          citySlug: venues.citySlug,
          neighborhoodSlug: venues.neighborhoodSlug,
          name: venues.name,
          tagline: venues.tagline,
          description: venues.description,
          address: venues.address,
          lat: venues.lat,
          lng: venues.lng,
          amenities: venues.amenities,
          languages: venues.languages,
          styleSlugs: venues.styleSlugs,
          categorySlugs: venues.categorySlugs,
          bookingTargetOrder: venues.bookingTargetOrder,
          freshnessNote: venues.freshnessNote,
          sourceUrl: venues.sourceUrl,
          lastVerifiedAt: venues.lastVerifiedAt
        }
      });

    await tx
      .insert(sessions)
      .values(
        seedSessions.map((session) => ({
          id: session.id,
          citySlug: session.citySlug,
          venueSlug: session.venueSlug,
          instructorSlug: session.instructorSlug,
          categorySlug: session.categorySlug,
          styleSlug: session.styleSlug,
          title: session.title,
          startAt: new Date(session.startAt),
          endAt: new Date(session.endAt),
          level: session.level,
          language: session.language,
          format: session.format,
          bookingTargetSlug: session.bookingTargetSlug,
          sourceUrl: session.sourceUrl,
          lastVerifiedAt: new Date(session.lastVerifiedAt),
          verificationStatus: session.verificationStatus,
          audience: session.audience,
          attendanceModel: session.attendanceModel,
          ageMin: session.ageMin ?? null,
          ageMax: session.ageMax ?? null,
          ageBand: session.ageBand ?? null,
          guardianRequired: session.guardianRequired ?? false,
          priceNote: session.priceNote ?? null
        }))
      )
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          citySlug: sessions.citySlug,
          venueSlug: sessions.venueSlug,
          instructorSlug: sessions.instructorSlug,
          categorySlug: sessions.categorySlug,
          styleSlug: sessions.styleSlug,
          title: sessions.title,
          startAt: sessions.startAt,
          endAt: sessions.endAt,
          level: sessions.level,
          language: sessions.language,
          format: sessions.format,
          bookingTargetSlug: sessions.bookingTargetSlug,
          sourceUrl: sessions.sourceUrl,
          lastVerifiedAt: sessions.lastVerifiedAt,
          verificationStatus: sessions.verificationStatus,
          audience: sessions.audience,
          attendanceModel: sessions.attendanceModel,
          ageMin: sessions.ageMin,
          ageMax: sessions.ageMax,
          ageBand: sessions.ageBand,
          guardianRequired: sessions.guardianRequired,
          priceNote: sessions.priceNote
        }
      });

    await tx
      .insert(editorialCollections)
      .values(
        seedCollections.map((collection) => ({
          citySlug: collection.citySlug,
          slug: collection.slug,
          title: collection.title,
          description: collection.description,
          cta: collection.cta,
          kind: collection.kind
        }))
      )
      .onConflictDoUpdate({
        target: editorialCollections.slug,
        set: {
          citySlug: editorialCollections.citySlug,
          title: editorialCollections.title,
          description: editorialCollections.description,
          cta: editorialCollections.cta,
          kind: editorialCollections.kind
        }
      });

    if (registryEntries.length > 0) {
      await tx
        .insert(sourceRegistry)
        .values(
          registryEntries.map((entry) => ({
            citySlug: entry.citySlug,
            sourceUrl: entry.sourceUrl,
            sourceType: entry.sourceType,
            cadence: entry.cadence,
            trustTier: entry.trustTier,
            purpose: entry.purpose,
            parserAdapter: entry.parserAdapter ?? null,
            tags: entry.tags,
            active: entry.active,
            notes: entry.notes ?? null,
            lastCheckedAt: entry.lastCheckedAt ? new Date(entry.lastCheckedAt) : null,
            nextCheckAt: entry.nextCheckAt ? new Date(entry.nextCheckAt) : null
          }))
        )
        .onConflictDoUpdate({
          target: [sourceRegistry.citySlug, sourceRegistry.sourceUrl],
          set: {
            sourceType: sourceRegistry.sourceType,
            cadence: sourceRegistry.cadence,
            trustTier: sourceRegistry.trustTier,
            purpose: sourceRegistry.purpose,
            parserAdapter: sourceRegistry.parserAdapter,
            tags: sourceRegistry.tags,
            active: sourceRegistry.active,
            notes: sourceRegistry.notes,
            lastCheckedAt: sourceRegistry.lastCheckedAt,
            nextCheckAt: sourceRegistry.nextCheckAt,
            updatedAt: new Date()
          }
        });
    }
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        cities: seedCities.length,
        neighborhoods: seedNeighborhoods.length,
        categories: seedCategories.length,
        styles: seedStyles.length,
        instructors: seedInstructors.length,
        venues: seedVenues.length,
        bookingTargets: seedBookingTargets.length,
        sessions: seedSessions.length,
        collections: seedCollections.length,
        sourceRegistry: registryEntries.length
      },
      null,
      2
    )
  );
};

upsertCatalog().catch((error) => {
  console.error(error);
  process.exit(1);
});
