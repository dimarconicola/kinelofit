import test from 'node:test';
import assert from 'node:assert/strict';

import { validateImportCsv } from '@/lib/catalog/import-validator';

const validCsv = `city_slug,venue_slug,venue_name,neighborhood_slug,address,lat,lng,category_slug,style_slug,title,start_at,end_at,level,language,format,booking_target_type,booking_target_href,source_url,last_verified_at,verification_status,attendance_model,price_note_it\npalermo,test-studio,Test Studio,centro,Via Roma 1,38.12,13.36,yoga,vinyasa,Sunrise Flow,2026-03-10T07:00:00+01:00,2026-03-10T08:00:00+01:00,open,Italian,in_person,direct,https://example.com/book,https://example.com/source,2026-03-08T09:00:00+01:00,verified,drop_in,€15 drop-in`;

test('import validator accepts scoped valid CSV rows', () => {
  const result = validateImportCsv(validCsv);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test('import validator blocks out-of-scope categories and invalid URLs', () => {
  const result = validateImportCsv(validCsv.replace('yoga', 'tennis').replace('https://example.com/book', 'notaurl'));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((issue) => issue.field === 'category_slug'));
  assert.ok(result.errors.some((issue) => issue.field === 'booking_target_href'));
});

test('import validator warns when attendance model and pricing are missing', () => {
  const csv = validCsv
    .replace(',attendance_model,price_note_it', '')
    .replace(',drop_in,€15 drop-in', '');

  const result = validateImportCsv(csv);
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((issue) => issue.field === 'attendance_model'));
  assert.ok(result.warnings.some((issue) => issue.field === 'price_note_it'));
});
