import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildPublicCitySearchIndex,
  buildPublicCitySnapshot,
  publicSnapshotToCatalog
} from '@/lib/catalog/public-models';
import { filterSearchIndexSessions, toSessions } from '@/lib/catalog/search-index';
import type { CatalogSnapshot } from '@/lib/catalog/repository';
import {
  bookingTargets,
  categories,
  cities,
  collections,
  instructors,
  neighborhoods,
  sessions,
  styles,
  venues
} from '@/lib/catalog/seed';
import { resolveSessionCardDataFromSnapshot } from '@/lib/catalog/session-card-data.shared';

vi.mock('next/cache', () => ({
  unstable_cache: (callback: (...args: never[]) => unknown) => callback,
  revalidateTag: vi.fn()
}));

const catalog: CatalogSnapshot = {
  sourceMode: 'seed',
  cities,
  neighborhoods,
  categories,
  styles,
  instructors,
  venues,
  bookingTargets,
  sessions,
  collections
};

describe('public city read models', () => {
  it('builds a Palermo snapshot with precomputed summaries', () => {
    const snapshot = buildPublicCitySnapshot(catalog, 'palermo');
    expect(snapshot).toBeTruthy();
    expect(snapshot?.city.slug).toBe('palermo');
    expect(snapshot?.mapVenueSummaries.length).toBeGreaterThan(0);
    expect(snapshot?.studioSummaries.length).toBe(snapshot?.venues.length);
    expect(snapshot?.teacherSummaries.length).toBe(snapshot?.instructors.length);
  });

  it('builds a searchable index and filters by joined neighborhood data', () => {
    const snapshot = buildPublicCitySnapshot(catalog, 'palermo');
    expect(snapshot).toBeTruthy();
    const index = buildPublicCitySearchIndex(snapshot!);
    const probe = index.sessions[0];
    const filtered = filterSearchIndexSessions(index, {
      category: probe.categorySlug,
      neighborhood: probe.neighborhoodSlug,
      style: probe.styleSlug
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((session) => session.categorySlug === probe.categorySlug)).toBe(true);
    expect(filtered.every((session) => session.neighborhoodSlug === probe.neighborhoodSlug)).toBe(true);
    expect(filtered.every((session) => session.styleSlug === probe.styleSlug)).toBe(true);
    expect(toSessions(filtered)).toHaveLength(filtered.length);
  });

  it('resolves session cards from the public snapshot without server fetches', () => {
    const snapshot = buildPublicCitySnapshot(catalog, 'palermo');
    expect(snapshot).toBeTruthy();
    const firstSessions = snapshot!.sessions.slice(0, 3);
    const resolved = resolveSessionCardDataFromSnapshot(publicSnapshotToCatalog(snapshot!), firstSessions);

    expect(resolved.size).toBe(firstSessions.length);
    expect(resolved.get(firstSessions[0]!.id)?.venue.slug).toBe(firstSessions[0]!.venueSlug);
  });
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('public read model runtime fallback', () => {
  it('falls back to canonical catalog when snapshot tables are unavailable', async () => {
    vi.doMock('@/lib/data/db', () => ({
      getDb: () => ({
        select: () => ({
          from: () => {
            throw new Error('relation "public_city_snapshots" does not exist');
          }
        })
      })
    }));
    vi.doMock('@/lib/catalog/repository', () => ({
      getCatalogSnapshot: async () => catalog
    }));

    const { getPublicCitySnapshot } = await import('@/lib/catalog/public-read-models');
    const snapshot = await getPublicCitySnapshot('palermo');

    expect(snapshot?.city.slug).toBe('palermo');
    expect(snapshot?.sessions.length).toBeGreaterThan(0);
  });

  it('builds a search index from the snapshot when search-index storage is unavailable', async () => {
    vi.doMock('@/lib/data/db', () => ({
      getDb: () => ({
        select: () => ({
          from: () => {
            throw new Error('relation "public_city_search_indexes" does not exist');
          }
        })
      })
    }));
    vi.doMock('@/lib/catalog/repository', () => ({
      getCatalogSnapshot: async () => catalog
    }));

    const { getPublicCitySearchIndex } = await import('@/lib/catalog/public-read-models');
    const searchIndex = await getPublicCitySearchIndex('palermo');

    expect(searchIndex?.citySlug).toBe('palermo');
    expect(searchIndex?.sessions.length).toBeGreaterThan(0);
  });
});
