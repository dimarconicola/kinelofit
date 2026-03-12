import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { runDailyFreshnessCheck } from '@/lib/freshness/service';

const isAuthorized = (request: NextRequest) => {
  if (!env.cronSecret) return true;

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = request.headers.get('x-cron-secret')?.trim();
  const querySecret = request.nextUrl.searchParams.get('secret')?.trim();

  return bearer === env.cronSecret || headerSecret === env.cronSecret || querySecret === env.cronSecret;
};

const parsePositiveNumber = (value: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const intValue = Math.trunc(parsed);
  return intValue > 0 ? intValue : undefined;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const citySlug = request.nextUrl.searchParams.get('city') ?? 'palermo';
    const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
    const maxSources = parsePositiveNumber(request.nextUrl.searchParams.get('maxSources'));

    const report = await runDailyFreshnessCheck({
      citySlug,
      dryRun,
      maxSources
    });

    return NextResponse.json({ ok: true, report }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'freshness_run_failed'
      },
      { status: 500 }
    );
  }
}
