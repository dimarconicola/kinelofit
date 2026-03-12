import test from 'node:test';
import assert from 'node:assert/strict';

import { getSessions } from '@/lib/catalog/data';
import { getTimeBucket } from '@/lib/catalog/filters';

test('Italian filter returns only Italian sessions', () => {
  const results = getSessions('palermo', { language: 'Italian' });
  assert.ok(results.length > 0);
  assert.equal(results.every((session) => session.language === 'Italian'), true);
});

test('Weekend filter returns weekend sessions only', () => {
  const results = getSessions('palermo', { date: 'weekend' });
  assert.ok(results.length > 0);
  assert.equal(results.every((session) => ['morning', 'midday', 'evening', 'early'].includes(getTimeBucket(session.startAt))), true);
});
