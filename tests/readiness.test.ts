import test from 'node:test';
import assert from 'node:assert/strict';

import { getCityReadiness } from '@/lib/catalog/readiness';

test('Palermo real data is below the public launch gate but has minimum city coverage', () => {
  const readiness = getCityReadiness('palermo');
  assert.equal(readiness.passesGate, false);
  assert.ok(readiness.venues >= 12);
  assert.ok(readiness.upcomingSessions >= 50);
  assert.ok(readiness.upcomingSessions < 75);
  assert.ok(readiness.neighborhoods >= 4);
  assert.ok(readiness.styles >= 4);
  assert.ok(readiness.ctaCoverage >= 0.8);
});
