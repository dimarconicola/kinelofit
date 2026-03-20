export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  vercelEnv: process.env.VERCEL_ENV,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY,
  cronSecret: process.env.CRON_SECRET,
  sessionSecret: process.env.APP_SESSION_SECRET ?? 'kinelo-fit-dev-secret',
  requirePersistentStore:
    process.env.KINELO_REQUIRE_PERSISTENT_STORE === 'true' || process.env.VERCEL_ENV === 'production'
};
