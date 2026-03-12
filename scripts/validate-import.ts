import { readFile } from 'node:fs/promises';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: tsx scripts/validate-import.ts <csv-file>');
  process.exit(1);
}

const requiredHeaders = [
  'city_slug',
  'venue_slug',
  'venue_name',
  'neighborhood_slug',
  'address',
  'lat',
  'lng',
  'category_slug',
  'style_slug',
  'title',
  'start_at',
  'end_at',
  'level',
  'language',
  'format',
  'booking_target_type',
  'booking_target_href',
  'source_url',
  'last_verified_at',
  'verification_status'
];

const main = async () => {
  const raw = await readFile(filePath, 'utf8');
  const [headerLine, ...rows] = raw.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  const missing = requiredHeaders.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    console.error(`Missing headers: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.error('CSV contains no rows.');
    process.exit(1);
  }

  console.log(`Import file valid: ${rows.length} rows, ${headers.length} columns.`);
};

void main();
