# UX Flows

## Scope
This document defines the canonical user flows that must remain stable across major releases of `kinelo.fit`.

The product has two classes of flows:
- `always-on public flows`: must work in every environment
- `env-gated account flows`: must degrade cleanly when auth or persistence is unavailable

## Flow Inventory

### F01. Free Exploration
- Goal: an anonymous user can understand the product and browse Palermo without friction.
- Entry points: `/it`, `/it/palermo`, `/it/palermo/classes`
- Happy path:
  1. Open the Italian homepage.
  2. Enter Palermo discovery.
  3. Open classes.
  4. Switch between `Lista`, `Vista mappa`, and `Calendario`.
  5. Apply filters and keep them while switching views.
  6. Open studio, teacher, category, and neighborhood pages.
- Failure path:
  - no global error boundary
  - no technical/dev copy on public pages
  - map remains usable without vendor-token setup
- Automated by:
  - smoke routes
  - Playwright critical E2E

### F02. Class Card Details and Outbound Links
- Goal: every visible class card is trustworthy and actionable.
- Happy path:
  1. A class card shows time, level, format, venue, teacher, and localized pricing when available.
  2. The user can open the studio page and teacher page.
  3. The user can use the outbound booking/contact CTA.
- Failure path:
  - cards with invalid CTA should be suppressed upstream
  - Italian pages must not leak English pricing strings
- Automated by:
  - domain tests for price normalization
  - smoke routes
  - Playwright studio/card checks

### F03. Sign-in Surface
- Goal: auth entry points are understandable and never crash.
- Entry point: `/it/sign-in`
- Happy path when auth is available:
  1. Open sign-in page.
  2. Submit magic link or start OAuth.
  3. Return to the correct locale after callback.
- Failure path when auth is unavailable:
  - show a neutral unavailable state
  - never show technical copy or global error boundary
- Automated by:
  - smoke routes
  - Playwright sign-in surface checks
  - env-gated auth integration tests when auth credentials are available

### F04. Logout and Signed-in Header
- Goal: signed-in state is explicit and non-destructive.
- Happy path:
  1. Signed-in email appears as account label.
  2. Logout is a separate explicit action.
  3. Logout returns to the same locale root.
- Failure path:
  - clicking the email must never sign the user out
  - long emails must remain contained in the header
- Automated by:
  - UI regression checks
  - env-gated account E2E when auth is available

### F05. Favorites
- Goal: saved entities are reliable and never collapse into generic errors.
- Entry point: `/it/favorites`
- Happy path when auth/store is available:
  1. Save favorite entities.
  2. Reload.
  3. See venues, teachers, and classes in favorites.
- Failure path:
  - if auth is unavailable, show a neutral unavailable state
  - if auth is available but the user is anonymous, show a sign-in prompt
  - never show the global error boundary for predictable missing-session/store states
- Automated by:
  - route contract tests
  - Playwright degraded-state checks
  - env-gated signed-in E2E

### F06. Saved Schedule
- Goal: saved schedule remains distinct from favorites and tracks class time slots.
- Entry point: `/it/schedule`
- Happy path when auth/store is available:
  1. Save a class to schedule.
  2. Reload.
  3. See only saved time slots.
- Failure path:
  - same degradation rules as favorites
  - no generic error boundary
- Automated by:
  - route contract tests
  - Playwright degraded-state checks
  - env-gated signed-in E2E

### F07. Suggest Calendar
- Goal: studios and teachers can submit their schedule without admin access.
- Entry point: `/it/suggest-calendar`
- Happy path:
  1. Fill required fields.
  2. Submit.
  3. Receive confirmation.
- Failure path:
  - invalid payload returns inline failure state
  - no crash
- Automated by:
  - API contract tests
  - Playwright form submission test

### F08. Claim Studio
- Goal: a studio can send a claim request through a lightweight public flow.
- Entry point: `/{locale}/claim/{studioSlug}`
- Happy path:
  1. Open claim page.
  2. Fill required fields.
  3. Submit.
  4. Receive confirmation.
- Failure path:
  - invalid payload fails without breaking the page
- Automated by:
  - API contract tests
  - Playwright form submission test

### F09. Digest Signup
- Goal: digest signup gives correct success or unavailable feedback.
- Entry points: homepage digest surfaces
- Happy path when store is available:
  - submit email and receive success state
- Failure path:
  - unavailable state is readable and non-technical
  - no false-positive success
- Automated by:
  - route contract tests
  - env-sensitive E2E assertions

### F10. Catalog Quality and Freshness
- Goal: the public catalog is useful, localized, and fresh enough to trust.
- Checks:
  - readiness thresholds
  - import validator
  - freshness cadence
  - CTA coverage
  - localized price notes
  - no public technical copy leakage
- Automated by:
  - node/domain tests
  - smoke routes
  - release data checks

## Automation Levels
- `L1 domain`: pure logic, data normalization, policy, readiness, freshness
- `L2 server/API`: route contracts and predictable failure states
- `L3 browser`: critical Playwright flows in a production-like app runtime
- `L4 release gate`: smoke, catalog coverage, freshness reports, manual spot-checks

## Environment-Gated Flows
The following flows should be executed in CI only when the relevant credentials are present:
- real magic-link request/callback
- real OAuth start/callback
- signed-in header/logout
- signed-in favorites persistence
- signed-in saved schedule persistence

In default CI without auth credentials, these flows must still pass their degraded-state checks.
