import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import type {
  ActivityCategory,
  BookingTarget,
  City,
  EditorialCollection,
  Instructor,
  KidsAgeBand,
  Neighborhood,
  Session,
  Style,
  Venue
} from '@/lib/catalog/types';
import { normalizePriceNote } from '@/lib/catalog/price-notes';
import { mapSourceEventCandidateToSession, type SourceEventCandidatePayload } from '@/lib/freshness/social-events';
import { getDb } from '@/lib/data/db';
import {
  activityCategories,
  bookingTargets,
  cities,
  editorialCollections,
  instructors,
  neighborhoods,
  sessions,
  sourceRecords,
  styles,
  venues
} from '@/lib/data/schema';
import { and, eq, gt } from 'drizzle-orm';

export interface CatalogSnapshot {
  sourceMode: 'database' | 'seed';
  cities: City[];
  neighborhoods: Neighborhood[];
  categories: ActivityCategory[];
  styles: Style[];
  instructors: Instructor[];
  venues: Venue[];
  bookingTargets: BookingTarget[];
  sessions: Session[];
  collections: EditorialCollection[];
}

const getSeedResources = cache(async () => {
  const seed = await import('@/lib/catalog/seed');
  const seedVenueImages = new Map(seed.venues.filter((venue) => venue.coverImage).map((venue) => [venue.slug, venue.coverImage]));
  const seedInstructorMedia = new Map(
    seed.instructors
      .filter((instructor) => instructor.headshot || instructor.socialLinks?.length)
      .map((instructor) => [instructor.slug, { headshot: instructor.headshot, socialLinks: instructor.socialLinks }])
  );
  const seedSnapshot: CatalogSnapshot = {
    sourceMode: 'seed',
    cities: seed.cities,
    neighborhoods: seed.neighborhoods,
    categories: seed.categories,
    styles: seed.styles,
    instructors: seed.instructors,
    venues: seed.venues,
    bookingTargets: seed.bookingTargets,
    sessions: seed.sessions,
    collections: seed.collections
  };

  return {
    seedSnapshot,
    seedVenueImages,
    seedInstructorMedia
  };
});

const toNumber = (value: string | number | null | undefined) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const toIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

const isKidsAgeBand = (value: string | null | undefined): value is KidsAgeBand =>
  value === '0-2' || value === '3-5' || value === '6-10' || value === '11-14' || value === 'mixed-kids';

const buildSessionIdentity = (session: Pick<Session, 'venueSlug' | 'startAt' | 'title'>) =>
  [session.venueSlug, new Date(session.startAt).toISOString(), session.title.it.trim().toLowerCase()].join('|');

const loadDatabaseSnapshot = async (): Promise<CatalogSnapshot | null> => {
  const db = getDb();
  if (!db) return null;

  try {
    const [
      cityRows,
      neighborhoodRows,
      categoryRows,
      styleRows,
      instructorRows,
      venueRows,
      bookingTargetRows,
      sessionRows,
      sourceEventRows,
      collectionRows,
      { seedVenueImages, seedInstructorMedia }
    ] = await Promise.all([
      db.select().from(cities),
      db.select().from(neighborhoods),
      db.select().from(activityCategories),
      db.select().from(styles),
      db.select().from(instructors),
      db.select().from(venues),
      db.select().from(bookingTargets),
      db.select().from(sessions),
      db
        .select()
        .from(sourceRecords)
        .where(
          and(
            eq(sourceRecords.entityType, 'source_event_candidate'),
            gt(sourceRecords.lastVerifiedAt, new Date(Date.now() - 1000 * 60 * 60 * 24 * 21))
          )
        ),
      db.select().from(editorialCollections),
      getSeedResources()
    ]);

    const baseSessions = sessionRows.map((row) => ({
      id: row.id,
      citySlug: row.citySlug,
      venueSlug: row.venueSlug,
      instructorSlug: row.instructorSlug,
      categorySlug: row.categorySlug,
      styleSlug: row.styleSlug,
      title: row.title,
      startAt: toIso(row.startAt),
      endAt: toIso(row.endAt),
      level: row.level,
      language: row.language,
      format: row.format,
      bookingTargetSlug: row.bookingTargetSlug,
      sourceUrl: row.sourceUrl,
      lastVerifiedAt: toIso(row.lastVerifiedAt),
      verificationStatus: row.verificationStatus,
      audience: row.audience,
      attendanceModel: row.attendanceModel,
      ageMin: row.ageMin ?? undefined,
      ageMax: row.ageMax ?? undefined,
      ageBand: isKidsAgeBand(row.ageBand) ? row.ageBand : undefined,
      guardianRequired: row.guardianRequired,
      priceNote: normalizePriceNote(row.priceNote ?? undefined)
    }));

    const existingSessionIdentities = new Set(baseSessions.map(buildSessionIdentity));

    const oneOffSessions = sourceEventRows
      .map((row) => row.sourcePayload as SourceEventCandidatePayload | null)
      .filter((payload): payload is SourceEventCandidatePayload => Boolean(payload?.id && payload.citySlug))
      .map(mapSourceEventCandidateToSession)
      .filter((session) => Date.parse(session.endAt) >= Date.now() - 1000 * 60 * 60 * 12)
      .filter((session) => !existingSessionIdentities.has(buildSessionIdentity(session)));

    return {
      sourceMode: 'database',
      cities: cityRows.map((row) => ({
        slug: row.slug,
        countryCode: row.countryCode,
        timezone: row.timezone,
        status: row.status,
        bounds: row.bounds,
        name: row.name,
        hero: row.hero
      })),
      neighborhoods: neighborhoodRows.map((row) => ({
        slug: row.slug,
        citySlug: row.citySlug,
        name: row.name,
        description: row.description,
        center: {
          lat: toNumber(row.centerLat),
          lng: toNumber(row.centerLng)
        }
      })),
      categories: categoryRows.map((row) => ({
        slug: row.slug,
        citySlug: row.citySlug,
        name: row.name,
        description: row.description,
        visibility: row.visibility,
        heroMetric: row.heroMetric
      })),
      styles: styleRows.map((row) => ({
        slug: row.slug,
        categorySlug: row.categorySlug,
        name: row.name,
        description: row.description
      })),
      instructors: instructorRows.map((row) => ({
        ...(seedInstructorMedia.get(row.slug) ?? {}),
        slug: row.slug,
        citySlug: row.citySlug,
        name: row.name,
        shortBio: row.shortBio,
        specialties: row.specialties,
        languages: row.languages
      })),
      venues: venueRows.map((row) => ({
        slug: row.slug,
        citySlug: row.citySlug,
        neighborhoodSlug: row.neighborhoodSlug,
        name: row.name,
        tagline: row.tagline,
        description: row.description,
        address: row.address,
        geo: {
          lat: toNumber(row.lat),
          lng: toNumber(row.lng)
        },
        amenities: row.amenities,
        languages: row.languages,
        styleSlugs: row.styleSlugs,
        categorySlugs: row.categorySlugs,
        bookingTargetOrder: row.bookingTargetOrder,
        freshnessNote: row.freshnessNote,
        sourceUrl: row.sourceUrl,
        lastVerifiedAt: toIso(row.lastVerifiedAt),
        coverImage: seedVenueImages.get(row.slug)
      })),
      bookingTargets: bookingTargetRows.map((row) => ({
        slug: row.slug,
        type: row.type,
        label: row.label,
        href: row.href
      })),
      sessions: [...baseSessions, ...oneOffSessions],
      collections: collectionRows.map((row) => ({
        slug: row.slug,
        citySlug: row.citySlug,
        title: row.title,
        description: row.description,
        cta: row.cta,
        kind: row.kind as 'rule' | 'editorial'
      }))
    };
  } catch {
    return null;
  }
};

const loadCatalogSnapshot = async (): Promise<CatalogSnapshot> => {
  const databaseSnapshot = await loadDatabaseSnapshot();
  if (databaseSnapshot) return databaseSnapshot;

  return (await getSeedResources()).seedSnapshot;
};

const getCatalogSnapshotCached = unstable_cache(loadCatalogSnapshot, ['catalog-snapshot'], {
  tags: ['catalog:snapshot'],
  revalidate: 60 * 30
});

export const getCatalogSnapshot = async (): Promise<CatalogSnapshot> => getCatalogSnapshotCached();
