import test from 'node:test';
import assert from 'node:assert/strict';

import { extractSourceEventCandidates, mapSourceEventCandidateToSession } from '@/lib/freshness/social-events';

test('Spazio Terra social extractor emits a one-off kids aerial yoga session when date and time are present', () => {
  const html = `
    <div>13 January · YOGA BIMBI, in VOLO!</div>
    <div>Laboratorio di yoga in volo per bambini, ore 10:30 - 11:30 a Palermo.</div>
  `;

  const candidates = extractSourceEventCandidates(
    'https://www.facebook.com/spazioterrapalermo',
    html,
    '2026-01-10T09:00:00+01:00'
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].venueSlug, 'spazio-terra-palermo');
  assert.equal(candidates[0].categorySlug, 'kids-activities');
  assert.equal(candidates[0].title.it, 'Yoga bimbi in volo');
  assert.equal(candidates[0].startAt, '2026-01-13T10:30:00.000+01:00');
  assert.equal(candidates[0].endAt, '2026-01-13T11:30:00.000+01:00');
  assert.ok(candidates[0].confidence >= 0.8);
});

test('social extractor tolerates punctuation-heavy text from posts', () => {
  const html = `
    <div>🪷✨ YOGA BIMBI, in VOLO! ✨🪷</div>
    <div>13 Gennaio - ore 10:30 / 11:30</div>
  `;

  const candidates = extractSourceEventCandidates(
    'https://www.facebook.com/spazioterrapalermo',
    html,
    '2026-01-10T09:00:00+01:00'
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title.it, 'Yoga bimbi in volo');
});

test('candidate payload maps back into a public session shape', () => {
  const [candidate] = extractSourceEventCandidates(
    'https://www.facebook.com/spazioterrapalermo',
    '<div>13 January · YOGA BIMBI, in VOLO! ore 10:30 - 11:30</div>',
    '2026-01-10T09:00:00+01:00'
  );

  const session = mapSourceEventCandidateToSession(candidate);
  assert.equal(session.id, candidate.id);
  assert.equal(session.sourceUrl, 'https://www.facebook.com/spazioterrapalermo');
  assert.equal(session.bookingTargetSlug, 'spazio-terra-facebook');
  assert.equal(session.verificationStatus, 'verified');
});
