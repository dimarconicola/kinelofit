export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY,
  cronSecret: process.env.CRON_SECRET,
  sessionSecret: process.env.APP_SESSION_SECRET ?? 'kinelo-fit-dev-secret'
};
