import { DateTime } from 'luxon';

import type { DiscoveryFilters, Session } from '@/lib/catalog/types';
import type { PublicCitySearchIndex, PublicCitySearchSessionRecord } from '@/lib/catalog/public-models';

const weekdayMap = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7
} as const;

const datePresetMatches = (session: PublicCitySearchSessionRecord, preset: DiscoveryFilters['date']) => {
  if (!preset) return true;

  const now = DateTime.now().setZone('Europe/Rome');
  const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');

  if (preset === 'today') return start.hasSame(now, 'day');
  if (preset === 'tomorrow') return start.hasSame(now.plus({ days: 1 }), 'day');
  if (preset === 'week') return start >= now.startOf('day') && start <= now.plus({ days: 7 }).endOf('day');

  const saturday = now.startOf('week').plus({ days: 5 });
  const sunday = saturday.plus({ days: 1 });
  return start.hasSame(saturday, 'day') || start.hasSame(sunday, 'day');
};

export const filterSearchIndexSessions = (index: PublicCitySearchIndex, filters: DiscoveryFilters) => {
  const now = DateTime.now().setZone('Europe/Rome');
  const selectedTimeBuckets = filters.time_buckets?.length
    ? filters.time_buckets
    : filters.time_bucket
      ? [filters.time_bucket]
      : [];

  return index.sessions
    .filter((session) => {
      const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');
      const end = DateTime.fromISO(session.endAt).setZone('Europe/Rome');

      if (!datePresetMatches(session, filters.date)) return false;
      if (filters.weekday && start.weekday !== weekdayMap[filters.weekday]) return false;
      if (selectedTimeBuckets.length > 0 && !selectedTimeBuckets.includes(session.timeBucket)) return false;
      if (filters.category && session.categorySlug !== filters.category) return false;
      if (filters.style && session.styleSlug !== filters.style) return false;
      if (filters.level && session.level !== filters.level) return false;
      if (filters.language && session.language.toLowerCase() !== filters.language.toLowerCase()) return false;
      if (filters.neighborhood && session.neighborhoodSlug !== filters.neighborhood) return false;
      if (filters.format && session.format !== filters.format) return false;
      if (filters.open_now === 'true' && !(start <= now && end >= now)) return false;
      if (filters.drop_in === 'true' && session.attendanceModel !== 'drop_in') return false;

      return start >= now.minus({ hours: 2 });
    })
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
};

export const toSessions = (records: PublicCitySearchSessionRecord[]): Session[] =>
  records.map((record) => ({
    id: record.id,
    citySlug: record.citySlug,
    venueSlug: record.venueSlug,
    instructorSlug: record.instructorSlug,
    categorySlug: record.categorySlug,
    styleSlug: record.styleSlug,
    title: record.title,
    startAt: record.startAt,
    endAt: record.endAt,
    level: record.level,
    language: record.language,
    format: record.format,
    bookingTargetSlug: record.bookingTargetSlug,
    sourceUrl: record.sourceUrl,
    lastVerifiedAt: record.lastVerifiedAt,
    verificationStatus: record.verificationStatus,
    audience: record.audience,
    attendanceModel: record.attendanceModel,
    ageMin: record.ageMin,
    ageMax: record.ageMax,
    ageBand: record.ageBand,
    guardianRequired: record.guardianRequired,
    priceNote: record.priceNote
  }));
