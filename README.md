# kinelo.fit

A Palermo-first, bilingual discovery app for recurring classes, studios, and teachers in movement and mind-body practice.

## What exists today

The current product includes:
- public city discovery for Palermo
- classes discovery with list, map, and calendar views
- public studios directory with list and map
- public teachers directory
- single-class detail pages for direct sharing
- favorites and saved schedule for signed-in users
- account and digest preference flows
- public suggestion and claim flows
- admin surfaces for moderation, imports, freshness, sources, health, collections, and taxonomy
- DB-first catalog reads with seed fallback
- cached public read models and a client-side search index for faster discovery
- Leaflet public maps with Carto/OSM-compatible tiles by default
- structured freshness automation, parser adapters, and discovery leads

## Documentation map

### Product and UX
- [Product overview](/Users/nicoladimarco/code/kinelofit/docs/product-overview.md)
- [Features and UX flows](/Users/nicoladimarco/code/kinelofit/docs/features-and-flows.md)
- [Catalog policy](/Users/nicoladimarco/code/kinelofit/docs/catalog-policy.md)

### Architecture and operations
- [Architecture](/Users/nicoladimarco/code/kinelofit/docs/architecture.md)
- [Automation and operations](/Users/nicoladimarco/code/kinelofit/docs/automation.md)
- [Database workflow](/Users/nicoladimarco/code/kinelofit/docs/database.md)

### Testing and release
- [UX flow coverage](/Users/nicoladimarco/code/kinelofit/docs/testing/ux-flows.md)
- [Test strategy](/Users/nicoladimarco/code/kinelofit/docs/testing/test-strategy.md)
- [Release checklist](/Users/nicoladimarco/code/kinelofit/docs/testing/release-checklist.md)

### Future plans
- [AI-assisted calendar ingestion plan](/Users/nicoladimarco/code/kinelofit/docs/plans/ai-calendar-ingestion.md)

## Tech stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- HeroUI
- Drizzle ORM
- Supabase Postgres and Supabase Auth
- Leaflet + Supercluster for public maps
- Luxon for time handling
- Vitest, Node test runner, and Playwright for quality gates

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000/it`.

## Useful commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:routes
npm run test:e2e
npm run catalog:bootstrap
npm run freshness:run
npm run freshness:run -- palermo --cadence=weekly
npm run freshness:run -- palermo --cadence=quarterly
npm run readiness
npm run validate:import
npm run catalog:coverage
npm run freshness:report
npm run perf:check
```

## Environment variables

See `.env.example`.

Important values:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `APP_SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_MAP_TILE_URL`
- `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION`
- `NEXT_PUBLIC_MAP_TILE_SUBDOMAINS`
- `CRON_SECRET`

## Current runtime behavior

- browsing is public
- favorites and saved schedule require sign-in
- auth is Supabase-first, with a controlled local-preview fallback path
- claims, digest signups, outbound events, favorites, saved schedule, and submissions persist to Postgres when `DATABASE_URL` is configured
- where allowed, runtime state can fall back to `/tmp/kinelo-fit-runtime`
- public city snapshots and search indexes are cached and rebuilt from the canonical catalog
- freshness runs are scheduled by cadence and can also be triggered manually
- parser adapters and source-event candidate extraction help maintain the Palermo catalog without turning the app into a blind scraper

## Product principles

- Palermo-first before expansion
- trust over breadth
- public reliability before account complexity
- direct action over marketplace lock-in
- automation with explicit confidence and moderation boundaries

## Related operational notes

- Admin base route: `/it/admin`
- Admin inbox: `/it/admin/inbox`
- The public submission flow writes into moderation storage; it does not auto-publish.
- The AI ingestion plan is intentionally documented but not active in runtime today.
