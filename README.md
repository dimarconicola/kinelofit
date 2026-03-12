# kinelo.fit

A Palermo-seeded, bilingual, yoga-led discovery app for local mind-body classes.

## What is implemented

- Next.js App Router app with `en` and `it` locale routing.
- Palermo public city hub, classes calendar, studio pages, teacher pages, category pages, neighborhood pages, and editorial collections.
- Multi-city architecture with city status control; Palermo is public, Catania is seeded only.
- Strong typed catalog domain with Drizzle Postgres schema ready for Supabase/Postgres migration.
- Manual ingestion workflow backed by a CSV sample and a readiness gate script.
- Supabase-first auth path (magic link + Google OAuth) with a demo fallback when credentials are not configured.
- Postgres-backed persistence for claims, digest signups, outbound click tracking, favorites, and saved schedule when `DATABASE_URL` is configured.
- Admin overview, imports, freshness, claims, collections, and taxonomy pages.
- MDX-backed editorial collections.

## Stack

- Next.js 15
- TypeScript
- Drizzle ORM schema for PostgreSQL
- Supabase-ready auth/data environment contract
- Mapbox-enhanced map with a graceful fallback map layer when no token is configured
- Luxon for time handling

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000/en`.

## Useful commands

```bash
npm run lint
npm run typecheck
npm run test
npm run readiness
npm run freshness:run
npm run validate:import
npm run build
```

## Environment variables

See `.env.example`.

Important values:

- `NEXT_PUBLIC_MAPBOX_TOKEN`: enables the real Mapbox map instead of the fallback map.
- `APP_SESSION_SECRET`: signs the local demo auth cookie.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: enable Supabase Auth in the app.
- `DATABASE_URL`: enables Drizzle/Postgres persistence for operator and user state.
- `CRON_SECRET`: protects `/api/cron/freshness` (used by Vercel cron or manual runs).

## Current product behavior

- Browsing is public.
- Favorites and saved schedule require sign-in.
- Claim and digest forms, outbound events, and user state persist to Postgres when `DATABASE_URL` is configured.
- If `DATABASE_URL` is unset, state falls back to `/tmp/kinelo-fit-runtime`.
- Palermo currently sits below the launch gate at 72 sessions over the next 7 days with 100% CTA coverage.
- A low-resource daily freshness check is available at `/api/cron/freshness?city=palermo` and scheduled via `vercel.json`.
- The freshness job checks unique source URLs (HEAD-first, GET fallback only on 405/501), compares lightweight header signatures, marks impacted sessions stale, applies stale/hidden aging windows, and writes run metrics to `freshness_runs`.
- Parser adapters currently support Rishi and Taiji sources to auto-reverify matching weekday/time sessions when those pages change.

## Next implementation moves

- Move the seed dataset into Postgres and wire the Drizzle schema to live queries.
- Expand parser-specific source adapters for higher-confidence automatic schedule extraction on top of freshness signals.
- Turn admin queues into persistent operational tooling.
