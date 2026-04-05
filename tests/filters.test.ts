import test from 'node:test';
import assert from 'node:assert/strict';
import { DateTime, Settings } from 'luxon';

import { getSessions } from '@/lib/catalog/data';
import { applySessionFilters } from '@/lib/catalog/filters';
import type { Session } from '@/lib/catalog/types';

test('Italian filter returns only Italian sessions', () => {
  const results = getSessions('palermo', { language: 'Italian' });
  assert.ok(results.length > 0);
  assert.equal(results.every((session) => session.language === 'Italian'), true);
});

test('Weekend filter returns weekend sessions only', () => {
  const realNow = Settings.now;
  const fixedNow = DateTime.fromISO('2026-04-05T12:00:00', { zone: 'Europe/Rome' });
  Settings.now = () => fixedNow.toMillis();

  const saturday = fixedNow.startOf('week').plus({ days: 5 }).set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
  const sunday = saturday.plus({ days: 1 }).set({ hour: 13, minute: 0, second: 0, millisecond: 0 });
  const monday = saturday.minus({ days: 5 });

  try {
    const sessions = [
      {
        id: 'weekend-session',
        citySlug: 'palermo',
        venueSlug: 'venue-1',
        instructorSlug: 'teacher-1',
        categorySlug: 'yoga',
        styleSlug: 'hatha',
        title: { en: 'Weekend class', it: 'Lezione weekend' },
        startAt: sunday.toISO()!,
        endAt: sunday.plus({ hours: 1 }).toISO()!,
        level: 'open',
        language: 'Italian',
        format: 'in_person',
        bookingTargetSlug: 'target-1',
        sourceUrl: 'https://example.com/weekend',
        lastVerifiedAt: fixedNow.toISO()!,
        verificationStatus: 'verified',
        audience: 'adults',
        attendanceModel: 'drop_in'
      },
      {
        id: 'weekday-session',
        citySlug: 'palermo',
        venueSlug: 'venue-1',
        instructorSlug: 'teacher-1',
        categorySlug: 'yoga',
        styleSlug: 'hatha',
        title: { en: 'Weekday class', it: 'Lezione feriale' },
        startAt: monday.toISO()!,
        endAt: monday.plus({ hours: 1 }).toISO()!,
        level: 'open',
        language: 'Italian',
        format: 'in_person',
        bookingTargetSlug: 'target-1',
        sourceUrl: 'https://example.com/weekday',
        lastVerifiedAt: monday.minus({ days: 1 }).toISO()!,
        verificationStatus: 'verified',
        audience: 'adults',
        attendanceModel: 'drop_in'
      }
    ] satisfies Session[];

    const results = applySessionFilters(sessions, { date: 'weekend' });
    assert.deepEqual(results.map((session) => session.id), ['weekend-session']);
  } finally {
    Settings.now = realNow;
  }
});
