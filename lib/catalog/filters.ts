import { DateTime } from 'luxon';

import type { DiscoveryFilters, Session, TimeBucket } from '@/lib/catalog/types';

export const getTimeBucket = (iso: string): TimeBucket => {
  const hour = DateTime.fromISO(iso).hour;
  if (hour < 8) return 'early';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'midday';
  return 'evening';
};

const datePresetMatches = (session: Session, preset: DiscoveryFilters['date']) => {
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

export const applySessionFilters = (sessions: Session[], filters: DiscoveryFilters) => {
  const now = DateTime.now().setZone('Europe/Rome');

  return sessions.filter((session) => {
    const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');
    const end = DateTime.fromISO(session.endAt).setZone('Europe/Rome');

    if (!datePresetMatches(session, filters.date)) return false;
    if (filters.time_bucket && getTimeBucket(session.startAt) !== filters.time_bucket) return false;
    if (filters.category && session.categorySlug !== filters.category) return false;
    if (filters.style && session.styleSlug !== filters.style) return false;
    if (filters.level && session.level !== filters.level) return false;
    if (filters.language && session.language.toLowerCase() !== filters.language.toLowerCase()) return false;
    if (filters.neighborhood) {
      // neighborhood filtering happens after session to venue join in catalog service
    }
    if (filters.format && session.format !== filters.format) return false;
    if (filters.open_now === 'true' && !(start <= now && end >= now)) return false;

    return start >= now.minus({ hours: 2 });
  });
};

export const parseFilters = (searchParams: Record<string, string | string[] | undefined>): DiscoveryFilters => {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  return {
    date: one(searchParams.date) as DiscoveryFilters['date'],
    time_bucket: one(searchParams.time_bucket) as DiscoveryFilters['time_bucket'],
    category: one(searchParams.category),
    style: one(searchParams.style),
    level: one(searchParams.level) as DiscoveryFilters['level'],
    language: one(searchParams.language),
    neighborhood: one(searchParams.neighborhood),
    format: one(searchParams.format) as DiscoveryFilters['format'],
    open_now: one(searchParams.open_now) as DiscoveryFilters['open_now'],
    view: one(searchParams.view) as DiscoveryFilters['view']
  };
};
