import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveKidsAgeBand, inferKidsAgeRangeFromStyle, isCategoryInScope, isSessionInScope } from '@/lib/catalog/policy';

test('kids age band derivation maps expected ranges', () => {
  assert.equal(deriveKidsAgeBand(3, 5), '3-5');
  assert.equal(deriveKidsAgeBand(6, 10), '6-10');
  assert.equal(deriveKidsAgeBand(6, 14), 'mixed-kids');
});

test('kids style mapping includes known Palermo styles', () => {
  const capoeira = inferKidsAgeRangeFromStyle('kids-capoeira');
  assert.equal(capoeira.min, 6);
  assert.equal(capoeira.max, 14);
});

test('category scope keeps mind-body and excludes unrelated sports', () => {
  assert.equal(isCategoryInScope('yoga'), true);
  assert.equal(isCategoryInScope('kids-activities'), true);
  assert.equal(isCategoryInScope('tennis'), false);
});

test('session policy excludes out-of-scope sports keywords', () => {
  const allowed = isSessionInScope({
    categorySlug: 'yoga',
    attendanceModel: 'drop_in',
    title: { en: 'Morning Vinyasa', it: 'Vinyasa mattino' }
  });
  const excluded = isSessionInScope({
    categorySlug: 'movement',
    attendanceModel: 'drop_in',
    title: { en: 'Rugby conditioning', it: 'Preparazione rugby' }
  });

  assert.equal(allowed, true);
  assert.equal(excluded, false);
});
