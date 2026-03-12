import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSourceSignalHash, buildSourceSlug, getCitySourceUrls } from '@/lib/freshness/service';

test('source slug is stable for semantically equivalent URLs', () => {
  const a = buildSourceSlug('https://example.com/path/');
  const b = buildSourceSlug('https://example.com/path');
  assert.equal(a, b);
});

test('source signal hash changes when headers change', () => {
  const baseline = buildSourceSignalHash({
    sourceUrl: 'https://example.com/a',
    finalUrl: 'https://example.com/a',
    status: 200,
    reachable: true,
    etag: 'etag-1',
    lastModified: 'Tue, 01 Jan 2026 10:00:00 GMT',
    contentLength: '1000'
  });

  const changed = buildSourceSignalHash({
    sourceUrl: 'https://example.com/a',
    finalUrl: 'https://example.com/a',
    status: 200,
    reachable: true,
    etag: 'etag-2',
    lastModified: 'Tue, 01 Jan 2026 10:00:00 GMT',
    contentLength: '1000'
  });

  assert.notEqual(baseline, changed);
});

test('city source list is deduplicated and non-empty for Palermo', () => {
  const sources = getCitySourceUrls('palermo');
  assert.ok(sources.length > 0);
  assert.equal(new Set(sources).size, sources.length);
  assert.equal(sources.every((url) => url.startsWith('http://') || url.startsWith('https://')), true);
});
