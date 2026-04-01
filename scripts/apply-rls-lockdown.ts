import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const main = async () => {
  const sql = postgres(databaseUrl, { prepare: false });

  try {
    await sql.unsafe(`
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('drizzle_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
  END LOOP;
END $$;
`);

    await sql.unsafe(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;`);
    await sql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;`);
    await sql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;`);
    await sql.unsafe(`
    COMMENT ON SCHEMA public IS
    'Public schema locked down for PostgREST access. App reads and writes run through backend DB connection and auth APIs, not direct anon/authenticated table access.';
  `);

    console.log(JSON.stringify({ ok: true }));
  } finally {
    await sql.end({ timeout: 5 });
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
