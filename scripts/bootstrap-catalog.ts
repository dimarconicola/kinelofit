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
import { rebuildPublicCityReadModels } from '@/lib/catalog/public-read-models';
import { getSeedSourceRegistry } from '@/lib/freshness/source-registry';
import { sql } from 'drizzle-orm';

const excluded = <T extends { name: string }>(column: T) => sql.raw(`excluded.${column.name}`);

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
          countryCode: excluded(cities.countryCode),
          timezone: excluded(cities.timezone),
          status: excluded(cities.status),
          bounds: excluded(cities.bounds),
          name: excluded(cities.name),
          hero: excluded(cities.hero),
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
          citySlug: excluded(neighborhoods.citySlug),
          name: excluded(neighborhoods.name),
          description: excluded(neighborhoods.description),
          centerLat: excluded(neighborhoods.centerLat),
          centerLng: excluded(neighborhoods.centerLng)
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
          citySlug: excluded(activityCategories.citySlug),
          visibility: excluded(activityCategories.visibility),
          name: excluded(activityCategories.name),
          description: excluded(activityCategories.description),
          heroMetric: excluded(activityCategories.heroMetric)
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
          categorySlug: excluded(styles.categorySlug),
          name: excluded(styles.name),
          description: excluded(styles.description)
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
          citySlug: excluded(instructors.citySlug),
          name: excluded(instructors.name),
          shortBio: excluded(instructors.shortBio),
          specialties: excluded(instructors.specialties),
          languages: excluded(instructors.languages)
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
          type: excluded(bookingTargets.type),
          label: excluded(bookingTargets.label),
          href: excluded(bookingTargets.href)
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
          citySlug: excluded(venues.citySlug),
          neighborhoodSlug: excluded(venues.neighborhoodSlug),
          name: excluded(venues.name),
          tagline: excluded(venues.tagline),
          description: excluded(venues.description),
          address: excluded(venues.address),
          lat: excluded(venues.lat),
          lng: excluded(venues.lng),
          amenities: excluded(venues.amenities),
          languages: excluded(venues.languages),
          styleSlugs: excluded(venues.styleSlugs),
          categorySlugs: excluded(venues.categorySlugs),
          bookingTargetOrder: excluded(venues.bookingTargetOrder),
          freshnessNote: excluded(venues.freshnessNote),
          sourceUrl: excluded(venues.sourceUrl),
          lastVerifiedAt: excluded(venues.lastVerifiedAt)
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
          citySlug: excluded(sessions.citySlug),
          venueSlug: excluded(sessions.venueSlug),
          instructorSlug: excluded(sessions.instructorSlug),
          categorySlug: excluded(sessions.categorySlug),
          styleSlug: excluded(sessions.styleSlug),
          title: excluded(sessions.title),
          startAt: excluded(sessions.startAt),
          endAt: excluded(sessions.endAt),
          level: excluded(sessions.level),
          language: excluded(sessions.language),
          format: excluded(sessions.format),
          bookingTargetSlug: excluded(sessions.bookingTargetSlug),
          sourceUrl: excluded(sessions.sourceUrl),
          lastVerifiedAt: excluded(sessions.lastVerifiedAt),
          verificationStatus: excluded(sessions.verificationStatus),
          audience: excluded(sessions.audience),
          attendanceModel: excluded(sessions.attendanceModel),
          ageMin: excluded(sessions.ageMin),
          ageMax: excluded(sessions.ageMax),
          ageBand: excluded(sessions.ageBand),
          guardianRequired: excluded(sessions.guardianRequired),
          priceNote: excluded(sessions.priceNote)
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
          citySlug: excluded(editorialCollections.citySlug),
          title: excluded(editorialCollections.title),
          description: excluded(editorialCollections.description),
          cta: excluded(editorialCollections.cta),
          kind: excluded(editorialCollections.kind)
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
            sourceType: excluded(sourceRegistry.sourceType),
            cadence: excluded(sourceRegistry.cadence),
            trustTier: excluded(sourceRegistry.trustTier),
            purpose: excluded(sourceRegistry.purpose),
            parserAdapter: excluded(sourceRegistry.parserAdapter),
            tags: excluded(sourceRegistry.tags),
            active: excluded(sourceRegistry.active),
            notes: excluded(sourceRegistry.notes),
            lastCheckedAt: excluded(sourceRegistry.lastCheckedAt),
            nextCheckAt: excluded(sourceRegistry.nextCheckAt),
            updatedAt: new Date()
          }
        });
    }
  });

  for (const city of seedCities) {
    await rebuildPublicCityReadModels(city.slug);
  }

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
