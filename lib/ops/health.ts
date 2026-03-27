import { getCatalogSourceMode } from '@/lib/catalog/server-data';
import { getDb, isDatabaseConfigured } from '@/lib/data/db';
import { env } from '@/lib/env';
import { getLatestFreshnessSnapshot } from '@/lib/freshness/service';
import { getMapRuntimeDetail } from '@/lib/map/runtime';
import { isPersistentStoreConfigured } from '@/lib/runtime/store';

export type HealthStatus = 'ok' | 'warn' | 'fail';

export interface HealthCheck {
  label: string;
  status: HealthStatus;
  detail: string;
}

export const getRuntimeHealth = async (citySlug = 'palermo') => {
  const latestFreshness = await getLatestFreshnessSnapshot(citySlug);
  const catalogSource = await getCatalogSourceMode();
  const db = getDb();
  const mapRuntime = getMapRuntimeDetail();

  const checks: HealthCheck[] = [
    {
      label: 'Catalog source',
      status: catalogSource === 'database' ? 'ok' : 'warn',
      detail: catalogSource === 'database' ? 'Reading catalog from Postgres snapshot.' : 'Running on seed fallback.'
    },
    {
      label: 'Database',
      status: isDatabaseConfigured && Boolean(db) ? 'ok' : 'fail',
      detail: isDatabaseConfigured && Boolean(db) ? 'DATABASE_URL configured and client booted.' : 'DATABASE_URL missing or database client unavailable.'
    },
    {
      label: 'Persistent store',
      status: isPersistentStoreConfigured() ? 'ok' : env.requirePersistentStore ? 'fail' : 'warn',
      detail: isPersistentStoreConfigured()
        ? 'Claims, submissions, favorites, and schedule use Postgres.'
        : env.requirePersistentStore
          ? 'Persistent store is required in this environment but Postgres is unavailable.'
          : 'Local fallback is allowed in this environment.'
    },
    {
      label: 'Public map engine',
      status: mapRuntime.renderMode === 'interactive' ? 'ok' : 'fail',
      detail:
        mapRuntime.renderMode === 'interactive'
          ? `Leaflet map active with ${mapRuntime.usingDefaultProvider ? 'default Carto tiles' : 'custom tile provider'}.`
          : 'Tile provider configuration is malformed, so the public map cannot initialize cleanly.'
    },
    {
      label: 'Supabase public auth',
      status: env.supabaseUrl && env.supabaseAnonKey ? 'ok' : 'warn',
      detail: env.supabaseUrl && env.supabaseAnonKey ? 'Public auth envs configured.' : 'Supabase public auth envs incomplete.'
    },
    {
      label: 'Session secret',
      status: env.sessionSecret !== 'kinelo-fit-dev-secret' ? 'ok' : env.nodeEnv === 'development' ? 'warn' : 'fail',
      detail:
        env.sessionSecret !== 'kinelo-fit-dev-secret'
          ? 'APP_SESSION_SECRET configured.'
          : 'Using development session secret.'
    },
    {
      label: 'Freshness snapshot',
      status: latestFreshness ? 'ok' : 'warn',
      detail: latestFreshness
        ? `Latest ${latestFreshness.cadence} run recorded at ${latestFreshness.createdAt}.`
        : 'No freshness run recorded yet.'
    }
  ];

  return {
    checks,
    hasFailures: checks.some((check) => check.status === 'fail'),
    hasWarnings: checks.some((check) => check.status === 'warn')
  };
};
