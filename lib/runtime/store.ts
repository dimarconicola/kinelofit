import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { and, desc, eq, inArray } from 'drizzle-orm';

import type { CalendarSubmission, ClaimSubmission, DigestSubscription, OutboundEvent, ReviewStatus, UserProfile } from '@/lib/catalog/types';
import { getDb, isDatabaseConfigured } from '@/lib/data/db';
import { env } from '@/lib/env';
import { AppError } from '@/lib/errors/handler';
import { calendarSubmissions, claims, digestSubscriptions, favorites, outboundClicks, userProfiles } from '@/lib/data/schema';

type FavoriteEntityType = 'venue' | 'session' | 'instructor';
type StoredEntityType = FavoriteEntityType | 'schedule';

interface StoredEntityRow {
  userId: string;
  entityType: StoredEntityType;
  entitySlug: string;
  createdAt: string;
}

interface StoredFavorite {
  entityType: FavoriteEntityType;
  entitySlug: string;
  createdAt: string;
}

const baseDir = '/tmp/kinelo-fit-runtime';

const ensureStore = async () => {
  await mkdir(baseDir, { recursive: true });
};

const fileFor = (name: string) => join(baseDir, `${name}.json`);

const readCollection = async <T,>(name: string): Promise<T[]> => {
  await ensureStore();

  try {
    const raw = await readFile(fileFor(name), 'utf8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
};

const writeCollection = async <T,>(name: string, value: T[]) => {
  await ensureStore();
  await writeFile(fileFor(name), JSON.stringify(value, null, 2));
};

const toIso = (value: Date | string) => new Date(value).toISOString();

export const isPersistentStoreConfigured = () => isDatabaseConfigured;

const assertPersistentStoreAvailable = () => {
  if (!env.requirePersistentStore) return;
  if (getDb()) return;
  throw new AppError('Servizio temporaneamente non disponibile.', 503, 'STORE_UNAVAILABLE');
};

const canFallbackToLocalRuntimeStore = () => !env.requirePersistentStore;

const normalizeReviewStatus = (value: string | null | undefined): ReviewStatus =>
  value === 'reviewing' || value === 'approved' || value === 'rejected' || value === 'imported' || value === 'resolved' ? value : 'new';

export const appendClaim = async (payload: ClaimSubmission) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const items = await readCollection<ClaimSubmission>('claims');
    items.unshift({ ...payload, reviewStatus: payload.reviewStatus ?? 'new' });
    await writeCollection('claims', items);
    return;
  }

  try {
    await db.insert(claims).values({
      studioSlug: payload.studioSlug,
      locale: payload.locale,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      notes: payload.notes,
      reviewStatus: payload.reviewStatus ?? 'new',
      assignedTo: payload.assignedTo ?? null,
      reviewNotes: payload.reviewNotes ?? null,
      reviewedAt: payload.reviewedAt ? new Date(payload.reviewedAt) : null,
      createdAt: new Date(payload.createdAt)
    });
  } catch (error) {
    if (!canFallbackToLocalRuntimeStore()) throw error;
    const items = await readCollection<ClaimSubmission>('claims');
    items.unshift({ ...payload, reviewStatus: payload.reviewStatus ?? 'new' });
    await writeCollection('claims', items);
  }
};

export const listClaims = async (): Promise<ClaimSubmission[]> => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    return readCollection<ClaimSubmission>('claims');
  }

  try {
    const rows = await db.select().from(claims).orderBy(desc(claims.createdAt)).limit(300);
    return rows.map((row) => ({
      id: row.id,
      studioSlug: row.studioSlug,
      locale: row.locale as 'en' | 'it',
      name: row.name,
      email: row.email,
      role: row.role,
      notes: row.notes,
      reviewStatus: normalizeReviewStatus(row.reviewStatus),
      assignedTo: row.assignedTo ?? undefined,
      reviewNotes: row.reviewNotes ?? undefined,
      reviewedAt: row.reviewedAt ? toIso(row.reviewedAt) : undefined,
      createdAt: toIso(row.createdAt)
    }));
  } catch {
    return readCollection<ClaimSubmission>('claims');
  }
};

export const updateClaimReview = async (id: string, payload: { reviewStatus: ReviewStatus; assignedTo?: string; reviewNotes?: string }) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const items = await readCollection<ClaimSubmission & { id?: string }>('claims');
    const next = items.map((item) =>
      item.createdAt === id || item.email === id
        ? { ...item, reviewStatus: payload.reviewStatus, assignedTo: payload.assignedTo, reviewNotes: payload.reviewNotes, reviewedAt: new Date().toISOString() }
        : item
    );
    await writeCollection('claims', next);
    return;
  }

  await db
    .update(claims)
    .set({
      reviewStatus: payload.reviewStatus,
      assignedTo: payload.assignedTo ?? null,
      reviewNotes: payload.reviewNotes ?? null,
      reviewedAt: new Date()
    })
    .where(eq(claims.id, id));
};

export const appendCalendarSubmission = async (payload: CalendarSubmission) => {
  const db = getDb();
  if (!db) {
    const items = await readCollection<CalendarSubmission>('calendar-submissions');
    items.unshift({ ...payload, reviewStatus: payload.reviewStatus ?? 'new' });
    await writeCollection('calendar-submissions', items);
    return;
  }

  try {
    await db.insert(calendarSubmissions).values({
      locale: payload.locale,
      citySlug: payload.citySlug,
      submitterType: payload.submitterType,
      organizationName: payload.organizationName,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone ?? null,
      sourceUrls: payload.sourceUrls,
      scheduleText: payload.scheduleText,
      consent: payload.consent,
      reviewStatus: payload.reviewStatus ?? 'new',
      assignedTo: payload.assignedTo ?? null,
      reviewNotes: payload.reviewNotes ?? null,
      reviewedAt: payload.reviewedAt ? new Date(payload.reviewedAt) : null,
      createdAt: new Date(payload.createdAt)
    });
  } catch {
    const items = await readCollection<CalendarSubmission>('calendar-submissions');
    items.unshift({ ...payload, reviewStatus: payload.reviewStatus ?? 'new' });
    await writeCollection('calendar-submissions', items);
  }
};

export const listCalendarSubmissions = async (): Promise<CalendarSubmission[]> => {
  const db = getDb();
  if (!db) {
    return readCollection<CalendarSubmission>('calendar-submissions');
  }

  try {
    const rows = await db.select().from(calendarSubmissions).orderBy(desc(calendarSubmissions.createdAt)).limit(500);
    return rows.map((row) => ({
      id: row.id,
      locale: row.locale as 'en' | 'it',
      citySlug: row.citySlug,
      submitterType: row.submitterType as 'studio' | 'teacher',
      organizationName: row.organizationName,
      contactName: row.contactName,
      email: row.email,
      phone: row.phone ?? undefined,
      sourceUrls: row.sourceUrls,
      scheduleText: row.scheduleText,
      consent: row.consent,
      reviewStatus: normalizeReviewStatus(row.reviewStatus),
      assignedTo: row.assignedTo ?? undefined,
      reviewNotes: row.reviewNotes ?? undefined,
      reviewedAt: row.reviewedAt ? toIso(row.reviewedAt) : undefined,
      createdAt: toIso(row.createdAt)
    }));
  } catch {
    return readCollection<CalendarSubmission>('calendar-submissions');
  }
};

export const updateCalendarSubmissionReview = async (
  id: string,
  payload: { reviewStatus: ReviewStatus; assignedTo?: string; reviewNotes?: string }
) => {
  const db = getDb();
  if (!db) {
    const items = await readCollection<CalendarSubmission & { id?: string }>('calendar-submissions');
    const next = items.map((item) =>
      item.createdAt === id || item.email === id
        ? {
            ...item,
            reviewStatus: payload.reviewStatus,
            assignedTo: payload.assignedTo,
            reviewNotes: payload.reviewNotes,
            reviewedAt: new Date().toISOString()
          }
        : item
    );
    await writeCollection('calendar-submissions', next);
    return;
  }

  await db
    .update(calendarSubmissions)
    .set({
      reviewStatus: payload.reviewStatus,
      assignedTo: payload.assignedTo ?? null,
      reviewNotes: payload.reviewNotes ?? null,
      reviewedAt: new Date()
    })
    .where(eq(calendarSubmissions.id, id));
};

export const appendDigestSubscription = async (payload: DigestSubscription) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const items = await readCollection<DigestSubscription>('digests');
    const exists = items.some((item) => item.email === payload.email && item.citySlug === payload.citySlug);
    if (exists) return { created: false };
    items.unshift(payload);
    await writeCollection('digests', items);
    return { created: true };
  }

  try {
    const existing = await db
      .select({ id: digestSubscriptions.id })
      .from(digestSubscriptions)
      .where(and(eq(digestSubscriptions.email, payload.email), eq(digestSubscriptions.citySlug, payload.citySlug)))
      .limit(1);

    if (existing.length > 0) {
      return { created: false };
    }

    await db.insert(digestSubscriptions).values({
      email: payload.email,
      locale: payload.locale,
      citySlug: payload.citySlug,
      preferences: payload.preferences,
      createdAt: new Date(payload.createdAt)
    });

    return { created: true };
  } catch (error) {
    if (!canFallbackToLocalRuntimeStore()) throw error;
    const items = await readCollection<DigestSubscription>('digests');
    const exists = items.some((item) => item.email === payload.email && item.citySlug === payload.citySlug);
    if (exists) return { created: false };
    items.unshift(payload);
    await writeCollection('digests', items);
    return { created: true };
  }
};

export const getDigestSubscription = async (email: string, citySlug: string): Promise<DigestSubscription | null> => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const items = await readCollection<DigestSubscription>('digests');
    return items.find((item) => item.email === email && item.citySlug === citySlug) ?? null;
  }

  const row = await db
    .select()
    .from(digestSubscriptions)
    .where(and(eq(digestSubscriptions.email, email), eq(digestSubscriptions.citySlug, citySlug)))
    .limit(1)
    .then((items) => items[0]);

  if (!row) return null;

  return {
    email: row.email,
    locale: row.locale as 'en' | 'it',
    citySlug: row.citySlug,
    preferences: row.preferences,
    createdAt: toIso(row.createdAt)
  };
};

export const upsertDigestSubscription = async (payload: DigestSubscription) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const items = await readCollection<DigestSubscription>('digests');
    const existingIndex = items.findIndex((item) => item.email === payload.email && item.citySlug === payload.citySlug);
    if (existingIndex >= 0) {
      items[existingIndex] = payload;
    } else {
      items.unshift(payload);
    }
    await writeCollection('digests', items);
    return { created: existingIndex < 0 };
  }

  const existing = await db
    .select({ id: digestSubscriptions.id })
    .from(digestSubscriptions)
    .where(and(eq(digestSubscriptions.email, payload.email), eq(digestSubscriptions.citySlug, payload.citySlug)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(digestSubscriptions)
      .set({
        locale: payload.locale,
        preferences: payload.preferences
      })
      .where(and(eq(digestSubscriptions.email, payload.email), eq(digestSubscriptions.citySlug, payload.citySlug)));
    return { created: false };
  }

  await db.insert(digestSubscriptions).values({
    email: payload.email,
    locale: payload.locale,
    citySlug: payload.citySlug,
    preferences: payload.preferences,
    createdAt: new Date(payload.createdAt)
  });
  return { created: true };
};

export const removeDigestSubscription = async (email: string, citySlug: string) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const items = await readCollection<DigestSubscription>('digests');
    await writeCollection(
      'digests',
      items.filter((item) => !(item.email === email && item.citySlug === citySlug))
    );
    return;
  }

  await db
    .delete(digestSubscriptions)
    .where(and(eq(digestSubscriptions.email, email), eq(digestSubscriptions.citySlug, citySlug)));
};

export const listDigestSubscriptions = async (): Promise<DigestSubscription[]> => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    return readCollection<DigestSubscription>('digests');
  }

  try {
    const rows = await db.select().from(digestSubscriptions).orderBy(desc(digestSubscriptions.createdAt)).limit(500);
    return rows.map((row) => ({
      email: row.email,
      locale: row.locale as 'en' | 'it',
      citySlug: row.citySlug,
      preferences: row.preferences,
      createdAt: toIso(row.createdAt)
    }));
  } catch {
    return readCollection<DigestSubscription>('digests');
  }
};

export const appendOutboundEvent = async (payload: OutboundEvent) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const items = await readCollection<OutboundEvent>('outbound-events');
    items.unshift(payload);
    await writeCollection('outbound-events', items);
    return;
  }

  await db.insert(outboundClicks).values({
    sessionId: payload.sessionId,
    venueSlug: payload.venueSlug,
    citySlug: payload.citySlug,
    categorySlug: payload.categorySlug,
    targetType: payload.targetType,
    href: payload.href,
    createdAt: new Date(payload.createdAt)
  });
};

export const listOutboundEvents = async (): Promise<OutboundEvent[]> => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    return readCollection<OutboundEvent>('outbound-events');
  }

  try {
    const rows = await db.select().from(outboundClicks).orderBy(desc(outboundClicks.createdAt)).limit(1000);
    return rows.map((row) => ({
      sessionId: row.sessionId ?? undefined,
      venueSlug: row.venueSlug,
      citySlug: row.citySlug,
      categorySlug: row.categorySlug,
      targetType: row.targetType,
      href: row.href,
      createdAt: toIso(row.createdAt)
    }));
  } catch {
    return readCollection<OutboundEvent>('outbound-events');
  }
};

const listStoredEntities = () => readCollection<StoredEntityRow>('user-entities');

const writeStoredEntities = (items: StoredEntityRow[]) => writeCollection('user-entities', items);

export const listUserFavorites = async (userId: string): Promise<StoredFavorite[]> => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const rows = await listStoredEntities();
    return rows
      .filter((row) => row.userId === userId && row.entityType !== 'schedule')
      .map((row) => ({
        entityType: row.entityType as FavoriteEntityType,
        entitySlug: row.entitySlug,
        createdAt: row.createdAt
      }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const rows = await db
    .select({
      entityType: favorites.entityType,
      entitySlug: favorites.entitySlug,
      createdAt: favorites.createdAt
    })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), inArray(favorites.entityType, ['venue', 'session', 'instructor'])))
    .orderBy(desc(favorites.createdAt));

  return rows.map((row) => ({
    entityType: row.entityType as FavoriteEntityType,
    entitySlug: row.entitySlug,
    createdAt: toIso(row.createdAt)
  }));
};

export const isUserFavorite = async (userId: string, entityType: FavoriteEntityType, entitySlug: string) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const rows = await listStoredEntities();
    return rows.some((row) => row.userId === userId && row.entityType === entityType && row.entitySlug === entitySlug);
  }

  const rows = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.entityType, entityType), eq(favorites.entitySlug, entitySlug)))
    .limit(1);

  return rows.length > 0;
};

export const toggleUserFavorite = async (userId: string, entityType: FavoriteEntityType, entitySlug: string) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const rows = await listStoredEntities();
    const index = rows.findIndex((row) => row.userId === userId && row.entityType === entityType && row.entitySlug === entitySlug);
    if (index >= 0) {
      rows.splice(index, 1);
      await writeStoredEntities(rows);
      return false;
    }
    rows.unshift({ userId, entityType, entitySlug, createdAt: new Date().toISOString() });
    await writeStoredEntities(rows);
    return true;
  }

  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.entityType, entityType), eq(favorites.entitySlug, entitySlug)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.entityType, entityType), eq(favorites.entitySlug, entitySlug)));
    return false;
  }

  await db.insert(favorites).values({
    userId,
    entityType,
    entitySlug,
    createdAt: new Date()
  });
  return true;
};

export const listUserSchedule = async (userId: string): Promise<string[]> => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const rows = await listStoredEntities();
    return rows
      .filter((row) => row.userId === userId && row.entityType === 'schedule')
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((row) => row.entitySlug);
  }

  const rows = await db
    .select({ entitySlug: favorites.entitySlug })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.entityType, 'schedule')))
    .orderBy(desc(favorites.createdAt));

  return rows.map((row) => row.entitySlug);
};

const defaultUserProfile = (userId: string, email: string): UserProfile => {
  const timestamp = new Date().toISOString();
  return {
    userId,
    email,
    homeCitySlug: 'palermo',
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export const getUserProfile = async (userId: string, email: string): Promise<UserProfile> => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const rows = await readCollection<UserProfile>('profiles');
    return rows.find((row) => row.userId === userId) ?? defaultUserProfile(userId, email);
  }

  const row = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)
    .then((items) => items[0]);

  if (!row) {
    return defaultUserProfile(userId, email);
  }

  return {
    userId: row.userId,
    email: row.email,
    displayName: row.displayName ?? undefined,
    homeCitySlug: row.homeCitySlug,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt)
  };
};

export const upsertUserProfile = async (payload: Pick<UserProfile, 'userId' | 'email' | 'displayName' | 'homeCitySlug'>): Promise<UserProfile> => {
  const db = getDb();
  const nextProfile: UserProfile = {
    userId: payload.userId,
    email: payload.email,
    displayName: payload.displayName?.trim() || undefined,
    homeCitySlug: payload.homeCitySlug,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db) {
    assertPersistentStoreAvailable();
    const rows = await readCollection<UserProfile>('profiles');
    const existing = rows.find((row) => row.userId === payload.userId);
    const merged = existing
      ? { ...existing, ...nextProfile, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
      : nextProfile;
    const rest = rows.filter((row) => row.userId !== payload.userId);
    rest.unshift(merged);
    await writeCollection('profiles', rest);
    return merged;
  }

  await db
    .insert(userProfiles)
    .values({
      userId: payload.userId,
      email: payload.email,
      displayName: payload.displayName?.trim() || null,
      homeCitySlug: payload.homeCitySlug,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        email: payload.email,
        displayName: payload.displayName?.trim() || null,
        homeCitySlug: payload.homeCitySlug,
        updatedAt: new Date()
      }
    });

  return getUserProfile(payload.userId, payload.email);
};

export const isUserScheduleSaved = async (userId: string, sessionId: string) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const rows = await listStoredEntities();
    return rows.some((row) => row.userId === userId && row.entityType === 'schedule' && row.entitySlug === sessionId);
  }

  const rows = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.entityType, 'schedule'), eq(favorites.entitySlug, sessionId)))
    .limit(1);

  return rows.length > 0;
};

export const toggleUserSchedule = async (userId: string, sessionId: string) => {
  const db = getDb();
  if (!db) {
    assertPersistentStoreAvailable();
    const rows = await listStoredEntities();
    const index = rows.findIndex((row) => row.userId === userId && row.entityType === 'schedule' && row.entitySlug === sessionId);
    if (index >= 0) {
      rows.splice(index, 1);
      await writeStoredEntities(rows);
      return false;
    }
    rows.unshift({ userId, entityType: 'schedule', entitySlug: sessionId, createdAt: new Date().toISOString() });
    await writeStoredEntities(rows);
    return true;
  }

  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.entityType, 'schedule'), eq(favorites.entitySlug, sessionId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.entityType, 'schedule'), eq(favorites.entitySlug, sessionId)));
    return false;
  }

  await db.insert(favorites).values({
    userId,
    entityType: 'schedule',
    entitySlug: sessionId,
    createdAt: new Date()
  });
  return true;
};
