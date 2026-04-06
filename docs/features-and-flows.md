# Features and UX Flows

## Purpose

This document explains the product feature set and the intended UX behavior of each major surface.
It is broader than the test docs: the test docs define what must not regress, while this document explains how the product is supposed to behave and why.

## Navigation model

Primary public navigation is organized around:
- city entry
- classes
- studios
- teachers
- suggestion / contribution entry points

Secondary navigation is organized around:
- neighborhoods
- categories
- editorial collections
- signed-in utilities

The product should never feel like a maze of deep filters before a user sees value.
The default path is:
1. land on the homepage
2. enter Palermo
3. choose whether the problem is about a class, a place, or a person

## Homepage flow

Route:
- `/{locale}`

### Job
- explain the product in one screenful
- route the user into Palermo quickly
- establish the visual language of the brand
- use editorial media to communicate atmosphere without blocking the practical next step

### Expected behavior
- hero video starts immediately
- supporting videos lazy-start when they enter the viewport
- copy remains clear in both Italian and English
- the main CTA is always Palermo-oriented, not generic marketing fluff

## City hub flow

Route:
- `/{locale}/{city}`

### Job
- give the city-level mental model
- summarize live supply and neighborhoods
- route users into the three primary discovery units

### Expected behavior
- the page should answer "what exists here?" before it asks for commitment
- collections and featured content should help orientation, not distract from core browsing
- city metrics should reflect current catalog density without pretending to be real-time analytics

## Classes flow

Route:
- `/{locale}/{city}/classes`

This is the flagship discovery experience.

### Available views
- `view=list`
- `view=map`
- `view=calendar`

### Filter behavior
Classes filtering is shared across all three views.
Changing view should not reset filters.
Compact filter states should still expose a visible reset action.

Expected filter concepts include:
- date preset
- weekday
- time bucket
- category
- style
- level
- language
- neighborhood
- format
- drop-in
- open now

### List view

Job:
- enable dense comparison of upcoming sessions

Expected behavior:
- each card carries time, duration, style, teacher, venue, format, level, language, and price note where available
- the CTA block stays practical and low-friction
- cards must not show broken or dead-end booking flows

### Map view

Job:
- help users decide spatially, not just chronologically

Expected behavior:
- the map is interactive and first-class
- markers cluster at low zoom
- selecting a venue opens venue-level session context
- mobile uses a map-first layout with a bottom-sheet style result surface
- desktop uses a dominant map with a docked panel
- the same filters drive list, map, and calendar
- geolocation is additive, not mandatory

### Calendar view

Job:
- help users understand a week rhythm rather than isolated cards

Expected behavior:
- it should remain consistent with the same filtered result set
- it should be easy to jump back to list or map without losing state

## Session card actions

Session cards are intentionally dense because they are where most decisions happen.

Each session card can expose:
- studio link
- teacher link
- direct map/address link
- direct booking or contact CTA
- Google Calendar prefill link
- `Share`
- `Save class`
- `Save to schedule`

### Save vs schedule

The product now separates:
- `Save class` for comparison and memory
- `Save to schedule` for intent and planning

This separation is important and should stay visible in the UX.

### Share

Sharing a class should not dump users onto a generic filter page.
It should point to the single-class route:
- `/{locale}/{city}/classes/{sessionId}`

The share control uses:
- Web Share API where available
- clipboard fallback on desktop

### Google Calendar

Each session can generate a Google Calendar prefill link.
This is intentionally outbound and lightweight.
The product does not attempt to become the user's primary calendar system.

## Single class flow

Route:
- `/{locale}/{city}/classes/{sessionId}`

### Job
- create a stable share target for one class
- provide a clean, readable session detail surface
- preserve the important actions from the card

### Expected behavior
- the page should show what the class is, where it is, who is leading, and when it happens
- it should link back to the generic classes page
- it should expose next classes from the same venue
- the page should feel like a clean share landing page, not a thin debug view

## Studios flow

Route:
- `/{locale}/{city}/studios`

### Job
- let a user browse Palermo as a set of places
- support people who decide by neighborhood or venue identity first

### Available views
- list
- map

### List view behavior
- sorted cleanly and legibly
- each studio card should expose name, neighborhood, activity signal, and map/address path
- the surface should feel distinct from classes; it is not just a venue slug list

### Map view behavior
- one marker per studio/venue
- nearby sorting can be triggered by geolocation
- the side panel should support venue comparison without forcing a full studio-page open

## Studio detail flow

Route:
- `/{locale}/{city}/studios/{slug}`

### Job
- give a venue-level operating picture

Expected content:
- venue identity and address
- map/address access
- recurring classes
- direct booking/contact paths where available
- claim path for operators

This is the right place for "should I treat this as my base venue?" decisions.

## Teachers flow

Route:
- `/{locale}/{city}/teachers`

### Job
- make person-first discovery explicit
- support users who remember a teacher more than a venue name

### Directory behavior
- alphabetical list
- not hidden behind search only
- each teacher card should feel curated rather than skeletal

## Teacher detail flow

Route:
- `/{locale}/{city}/teachers/{slug}`

### Job
- help a user assess a teacher as a person-led discovery unit

Expected content:
- headshot when verified
- short bio and specialties
- recurring classes
- official or social links when verified

The product should not invent authority where none exists.
If there is no verified headshot or official link, the profile should stay honest rather than padded.

## Editorial collections

Collections are used to create rule-based or curated discovery shortcuts.
Examples include:
- today-nearby
- new-this-week
- english-speaking-classes

Their job is to shape discovery without forcing users into a search box.

## Sign-in flow

Route:
- `/{locale}/sign-in`

### Job
- explain what account functionality is for
- make sign-in feel light, not bureaucratic

### Behavior
- if Supabase auth is configured, the page offers magic link and Google OAuth
- if auth is unavailable, the page shows a normal unavailable state
- in development or preview, the runtime can fall back to a local demo auth mode

The product should never make public browsing depend on sign-in.

## Favorites flow

Route:
- `/{locale}/favorites`

### Job
- keep entities and shortlist classes for calm comparison

Expected behavior:
- a user sees studios, teachers, and classes separately
- the page clearly explains that schedule lives elsewhere
- sharing is available at collection level
- if auth or store is unavailable, the page degrades into a clear, readable state rather than crashing

## Saved schedule flow

Route:
- `/{locale}/schedule`

### Job
- keep only the actual saved time slots a user wants to plan around

Expected behavior:
- the page lists scheduled sessions only
- export to `.ics` is available
- sharing is available
- the page stays distinct from favorites in both structure and copy

## Account flow

Route:
- `/{locale}/account`

### Job
- show light account-level state and preferences
- avoid building a noisy dashboard

## Suggest calendar flow

Route:
- `/{locale}/suggest-calendar`

### Job
- allow public inbound schedule suggestions without opening admin access

### Current behavior
- at least one public source URL is required
- users are told why: kinelo.fit verifies before publishing
- submission writes to moderated storage
- the flow does not auto-publish
- failure states should explain whether the issue is validation or temporary storage unavailability

## Claim studio flow

Route:
- `/{locale}/claim/{studioSlug}`

### Job
- let a venue operator claim or correct a studio through a lightweight path

### Current behavior
- the claim enters moderation
- it does not grant a self-serve management panel
- this keeps operational control centralized while the catalog is still curated

## Admin and moderation flow

Routes:
- `/{locale}/admin`
- `/{locale}/admin/inbox`
- `/{locale}/admin/imports`
- `/{locale}/admin/freshness`
- `/{locale}/admin/sources`
- `/{locale}/admin/health`

### Job
- give operators a single place to see runtime truth, review inbound signals, and manage catalog reliability

### Current moderation objects
- claims
- calendar submissions
- discovery leads
- import batches
- digest and outbound signals for context

### Status model
Current moderation statuses include:
- `new`
- `reviewing`
- `approved`
- `rejected`
- `imported`
- `resolved`

## Localization and copy

The public product is bilingual:
- `it`
- `en`

The Italian experience is the primary public voice.
English should remain coherent and complete, but the product is not trying to sound like a generic international SaaS.

Localization expectations:
- route locale should be preserved across major flows
- pricing notes should not leak English strings onto Italian pages
- copy should stay low-jargon and product-readable in both languages

## Failure and degraded states

The UX has explicit degraded modes rather than silent breakage.

Examples:
- auth unavailable -> public browsing still works
- store unavailable -> signed-in utilities show neutral unavailable states
- map provider degraded -> map remains as usable as possible or shows a clean unavailable state
- stale sessions -> card or catalog policy suppresses rather than misleading the user

The product should never show technical setup errors to normal users on core public pages.

## Related docs

- [docs/product-overview.md](/Users/nicoladimarco/code/kinelofit/docs/product-overview.md)
- [docs/architecture.md](/Users/nicoladimarco/code/kinelofit/docs/architecture.md)
- [docs/automation.md](/Users/nicoladimarco/code/kinelofit/docs/automation.md)
- [docs/testing/ux-flows.md](/Users/nicoladimarco/code/kinelofit/docs/testing/ux-flows.md)
