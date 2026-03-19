# Database Workflow

`kinelo.fit` now supports a DB-first catalog backed by Supabase Postgres.

## Minimal setup

Create a local `.env.local` with:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

For Supabase, prefer the transaction pooler URL for app/runtime access.

## Commands

Generate SQL migration files from schema changes:

```bash
npm run db:generate
```

Apply schema changes to the configured database:

```bash
set -a && source .env.local && set +a && npm run db:push
```

Bootstrap the canonical Palermo catalog:

```bash
set -a && source .env.local && set +a && npm run db:bootstrap
```

One-shot schema + bootstrap:

```bash
set -a && source .env.local && set +a && npm run db:setup
```

## Operational rule

- Use `db:generate` and commit the SQL in `drizzle/` whenever schema changes.
- Use `db:push` only to apply a reviewed schema to a real environment.
- Keep `catalog:bootstrap` idempotent so seed-to-DB sync can be rerun safely.
