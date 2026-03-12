import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  const formData = await request.formData();
  const csv = String(formData.get('csv') ?? '');
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  const missing = requiredHeaders.filter((header) => !headers.includes(header));

  return NextResponse.json({
    ok: missing.length === 0 && rows.length > 0,
    rows: rows.length,
    missingHeaders: missing
  });
}
