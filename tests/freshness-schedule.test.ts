import test from 'node:test';
import assert from 'node:assert/strict';

import { computeNextCheckAt, getCadenceIntervalDays, isSourceDueAt } from '@/lib/freshness/schedule';

test('cadence interval days match expected ops policy', () => {
  assert.equal(getCadenceIntervalDays('daily'), 1);
  assert.equal(getCadenceIntervalDays('weekly'), 7);
  assert.equal(getCadenceIntervalDays('quarterly'), 90);
});

test('computeNextCheckAt advances based on cadence', () => {
  const next = computeNextCheckAt('2026-03-20T10:00:00.000Z', 'weekly');
  assert.equal(next?.startsWith('2026-03-27T10:00:00.000Z'), true);
});

test('isSourceDueAt returns true when next check is missing or in the past', () => {
  assert.equal(isSourceDueAt(undefined, '2026-03-20T10:00:00.000Z'), true);
  assert.equal(isSourceDueAt('2026-03-19T10:00:00.000Z', '2026-03-20T10:00:00.000Z'), true);
  assert.equal(isSourceDueAt('2026-03-21T10:00:00.000Z', '2026-03-20T10:00:00.000Z'), false);
});
