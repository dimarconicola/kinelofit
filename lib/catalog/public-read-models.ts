import { createHash } from 'node:crypto';

import { unstable_cache, revalidateTag } from 'next/cache';
import { desc, eq, max } from 'drizzle-orm';

import { getCatalogSnapshot } from '@/lib/catalog/repository';
import {
  buildPublicCitySearchIndex,
  buildPublicCitySnapshot,
  type PublicCitySearchIndex,
  type PublicCitySnapshot
} from '@/lib/catalog/public-models';
import { getDb } from '@/lib/data/db';
import { publicCitySearchIndexes, publicCitySnapshots } from '@/lib/data/schema';

const tagsForCity = (citySlug: string) => [
  `city:${citySlug}:public`,
  `city:${citySlug}:classes`,
  `city:${citySlug}:studios`,
  `city:${citySlug}:teachers`
];

const buildHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const revalidatePublicCityTags = (citySlug: string) => {
  for (const tag of tagsForCity(citySlug)) {
    try {
      revalidateTag(tag);
    } catch {
      // CLI rebuilds run outside the Next request lifecycle; persisting the read model still matters.
    }
  }
};

const withReadModelFallback = async <T>(action: () => Promise<T | null>, fallback: T | null = null) => {
  try {
    return await action();
  } catch {
    return fallback;
  }
};

const loadLatestSnapshotRow = async (citySlug: string) => {
  const db = getDb();
  if (!db) return null;
  return withReadModelFallback(async () => {
    const [row] = await db
      .select({ payloadJson: publicCitySnapshots.payloadJson })
      .from(publicCitySnapshots)
      .where(eq(publicCitySnapshots.citySlug, citySlug))
      .orderBy(desc(publicCitySnapshots.builtAt))
      .limit(1);
    return row ? (row.payloadJson as unknown as PublicCitySnapshot) : null;
  });
};

const loadLatestSearchIndexRow = async (citySlug: string) => {
  const db = getDb();
  if (!db) return null;
  return withReadModelFallback(async () => {
    const [row] = await db
      .select({ payloadJson: publicCitySearchIndexes.payloadJson })
      .from(publicCitySearchIndexes)
      .where(eq(publicCitySearchIndexes.citySlug, citySlug))
      .orderBy(desc(publicCitySearchIndexes.builtAt))
      .limit(1);
    return row ? (row.payloadJson as unknown as PublicCitySearchIndex) : null;
  });
};

const buildFallbackSnapshot = async (citySlug: string) => {
  const snapshot = buildPublicCitySnapshot(await getCatalogSnapshot(), citySlug);
  if (!snapshot) return null;
  return {
    ...snapshot,
    hash: buildHash({ citySlug, sessions: snapshot.sessions.map((session) => session.id), metrics: snapshot.metrics })
  } satisfies PublicCitySnapshot;
};

export const getPublicCitySnapshot = async (citySlug: string) =>
  unstable_cache(
    async () => {
      const stored = await loadLatestSnapshotRow(citySlug);
      if (stored) return stored;
      return buildFallbackSnapshot(citySlug);
    },
    [`public-city-snapshot:${citySlug}`],
    { tags: tagsForCity(citySlug), revalidate: 60 * 30 }
  )();

export const getPublicCitySearchIndex = async (citySlug: string) =>
  unstable_cache(
    async () => {
      const stored = await loadLatestSearchIndexRow(citySlug);
      if (stored) return stored;
      const snapshot = await getPublicCitySnapshot(citySlug);
      if (!snapshot) return null;
      return {
        ...buildPublicCitySearchIndex(snapshot),
        hash: buildHash(snapshot.sessions.map((session) => session.id))
      } satisfies PublicCitySearchIndex;
    },
    [`public-city-search-index:${citySlug}`],
    { tags: tagsForCity(citySlug), revalidate: 60 * 30 }
  )();

const getNextVersion = async (citySlug: string) => {
  const db = getDb();
  if (!db) return 1;
  const latest = await withReadModelFallback(async () => {
    const [row] = await db
      .select({ version: max(publicCitySnapshots.version) })
      .from(publicCitySnapshots)
      .where(eq(publicCitySnapshots.citySlug, citySlug));
    return row?.version ?? 0;
  }, 0);
  return (latest ?? 0) + 1;
};

export const rebuildPublicCityReadModels = async (citySlug: string) => {
  const snapshot = await buildFallbackSnapshot(citySlug);
  if (!snapshot) return null;

  const db = getDb();
  const version = await getNextVersion(citySlug);
  const nextSnapshot: PublicCitySnapshot = {
    ...snapshot,
    version,
    builtAt: new Date().toISOString(),
    hash: buildHash({ citySlug, sessions: snapshot.sessions.map((session) => session.id), metrics: snapshot.metrics })
  };
  const searchIndex: PublicCitySearchIndex = {
    ...buildPublicCitySearchIndex(nextSnapshot),
    hash: buildHash(nextSnapshot.sessions.map((session) => session.id))
  };

  if (db) {
    const builtAt = new Date(nextSnapshot.builtAt);
    await withReadModelFallback(async () => {
      await db.insert(publicCitySnapshots).values({
        citySlug,
        version: nextSnapshot.version,
        hash: nextSnapshot.hash,
        payloadJson: nextSnapshot as unknown as Record<string, unknown>,
        builtAt
      });
      await db.insert(publicCitySearchIndexes).values({
        citySlug,
        version: searchIndex.version,
        hash: searchIndex.hash,
        payloadJson: searchIndex as unknown as Record<string, unknown>,
        builtAt
      });
      return true;
    });
  }

  revalidatePublicCityTags(citySlug);

  return {
    snapshot: nextSnapshot,
    searchIndex
  };
};

export const getPublicSnapshotRouteTags = (citySlug: string) => tagsForCity(citySlug);
