import { NextResponse } from 'next/server';

import { getPublicCitySearchIndex } from '@/lib/catalog/public-read-models';

export async function GET(_request: Request, { params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const index = await getPublicCitySearchIndex(city);

  if (!index) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json(index, {
    headers: {
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400'
    }
  });
}
