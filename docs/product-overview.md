# Product Overview

## What kinelo.fit is

`kinelo.fit` is a Palermo-first discovery product for recurring movement, mind-body, and selected kids activities.

The product is designed around a simple weekly job:
- help a person decide what to do
- help them understand where to go
- help them understand who is leading
- let them act quickly without forcing them through a marketplace flow

It is intentionally local, narrow, and editorial.
It is not trying to be a national fitness directory or a generic gym marketplace.

## Product thesis

The real local problem is fragmentation.
For Palermo, schedule information is typically spread across:
- official studio websites
- Instagram profiles
- Facebook pages
- directory listings
- WhatsApp-first contact flows
- partially updated timetable images

The product exists to collapse that fragmented research into one interface that is:
- easier to scan than social feeds
- more trustworthy than broad directories
- more actionable than a static editorial guide

The trust goal is not encyclopedic completeness.
The trust goal is decision-ready local discovery.

## Who the product serves

Primary audiences:
- residents looking for a recurring practice near them
- people comparing studios, teachers, and styles before committing
- parents looking for recurring kids activities in a narrow age range
- curious users who want to browse by map, neighborhood, or teacher rather than by a generic search box

Secondary audiences:
- studios and teachers who want to submit or claim structured information
- operators maintaining the Palermo catalog

## Product boundaries

The catalog is intentionally scoped.

In scope:
- yoga and yoga-adjacent mind-body practice
- pilates
- meditation, breathwork, mobility, somatic work
- selected adjacent recurring movement offers when they fit the product shape
- selected kids activities for ages `0-14`
- some combat, movement, dance, climbing, and calisthenics supply when it is recurring, class-led, and locally meaningful

Out of scope:
- generic gym memberships without a real class calendar
- broad team sports
- one-off events with no credible calendar signal
- offers without a usable contact or booking path
- random venue pages with no recurring schedule value

Operational source of truth for scope:
- [docs/catalog-policy.md](/Users/nicoladimarco/code/kinelofit/docs/catalog-policy.md)

## Product model: three discovery units

The core information architecture is built around three distinct discovery units.

### Classes

`Classes` are the schedule-first surface.

Users come here when they care about:
- day and time
- style
- level
- neighborhood
- in-person vs online
- what is on today, tomorrow, this week, or this weekend

This is the main tactical discovery surface.
It includes:
- list view
- interactive map view
- calendar view
- persistent filter state across views
- single-class pages for direct sharing

### Studios

`Studios` are the place-first surface.

Users come here when they care about:
- where the practice happens
- what kind of place it is
- the local rhythm of classes in that venue
- atmosphere, neighborhood, and practical orientation

The studios directory includes:
- alphabetical list view
- synchronized map view
- geolocation-based nearby sorting
- detail pages with calendar context and contact routes

### Teachers

`Teachers` are the person-first surface.

Users come here when they care about:
- who is leading
- teaching identity
- specialties and language
- social or official links
- whether they want to follow a person across venues

Teacher pages are deliberately lighter than studio pages, but they provide:
- profile summary
- recurring sessions
- headshot where verified
- external social/official links when verified

## Public product surfaces

### Homepage

Route:
- `/{locale}`

Role:
- explain the product quickly
- establish Palermo as the active city
- carry editorial identity through typography, video, and curation
- route the user into practical discovery, not abstract brand content

### City hub

Route:
- `/{locale}/{city}`

Role:
- act as the public gateway for one city
- summarize live density, categories, neighborhoods, and editorial collections
- route the user into classes, studios, teachers, and curated shortcuts

Current operating city:
- Palermo is public

Secondary city model:
- the app supports hidden/seeded cities, but a city should only become public when trust and density are good enough

### Classes

Route:
- `/{locale}/{city}/classes`

Key behavior:
- list, map, and calendar views share the same filters
- filter state survives view switches
- map view is a primary discovery surface, not a decorative panel
- each session card supports direct actions:
  - open studio
  - open teacher
  - open map address
  - open Google Calendar prefill
  - save class
  - save to personal schedule
  - share the single class link

### Single class pages

Route:
- `/{locale}/{city}/classes/{sessionId}`

Role:
- provide a stable share target for one class
- preserve context around teacher, venue, and timing
- surface next related classes from the same venue

This is intentionally more useful than sharing the generic classes page with filters.

### Studios directory

Route:
- `/{locale}/{city}/studios`

Role:
- give a venue-centric entry point into the city
- support list and map browsing
- help users choose a place before choosing an exact time slot

### Studio pages

Route:
- `/{locale}/{city}/studios/{slug}`

Role:
- consolidate identity, neighborhood, contact path, and recurring class context for one venue
- support claiming and ongoing trust maintenance

### Teachers directory

Route:
- `/{locale}/{city}/teachers`

Role:
- give a complete alphabetical teacher list for the city
- make person-first browsing explicit instead of hidden behind class cards

### Teacher pages

Route:
- `/{locale}/{city}/teachers/{slug}`

Role:
- show who the teacher is
- show specialties, short bio, recurring sessions, and external links

### Category, neighborhood, and editorial surfaces

Supporting surfaces exist for:
- category pages
- neighborhood pages
- editorial collections

These act as secondary entry points into the same catalog, not as separate products.

## Signed-in utility surfaces

The signed-in layer is intentionally lightweight.
Auth is there to improve continuity, not to gate public discovery.

### Favorites

Route:
- `/{locale}/favorites`

Role:
- keep studios, teachers, and classes a user wants to follow or compare
- act as a shortlist, not as a personal calendar

### Saved schedule

Route:
- `/{locale}/schedule`

Role:
- keep only actual class time slots the user intends to attend
- separate "things I might want to revisit" from "slots I want to plan around"

The distinction matters:
- `Favorites` are entity and comparison memory
- `Saved schedule` is time-slot planning

### Account

Route:
- `/{locale}/account`

Role:
- keep account-level preferences and signed-in visibility lightweight
- avoid becoming a bloated dashboard

### Sign-in

Route:
- `/{locale}/sign-in`

Role:
- provide passwordless access through magic link or OAuth where available
- degrade cleanly when auth is unavailable

## Contribution surfaces

### Suggest calendar

Route:
- `/{locale}/suggest-calendar`

Role:
- let studios or teachers submit schedules without admin access
- require public source URLs so the team can verify before publishing

Current behavior:
- submission writes to moderated storage
- it does not auto-publish to the catalog
- review happens in the admin inbox

### Claim studio

Route:
- `/{locale}/claim/{studioSlug}`

Role:
- let a venue operator claim a profile through a lightweight public form
- avoid forcing a full onboarding system before the catalog is useful

### Digest signup

Digest signup is used as a retention signal and lightweight owned-audience flow.
It is intentionally simple and operationally cheap.

## Operational surfaces

### Admin overview

Route:
- `/{locale}/admin`

Role:
- surface operational truth before expansion
- summarize public city status, source mode, runtime health, and moderation load

### Unified moderation inbox

Route:
- `/{locale}/admin/inbox`

Role:
- review claims
- review calendar submissions
- review discovery leads
- update moderation status and operator notes

### Additional operator surfaces

The admin layer also includes dedicated views for:
- imports
- health
- freshness
- sources
- collections
- taxonomy

The admin area is not a public feature surface. It is the operating layer that keeps the public catalog reliable.

## UX principles

The product follows a few strong UX rules.

### Public-first reliability

The public experience should remain useful even when:
- auth is unavailable
- the persistent store is unavailable
- a third-party source is stale
- a tile provider is degraded

Known unavailable states should render as readable product states, not exception pages.

### Direct action over platform lock-in

The product does not try to trap the user in a marketplace.
It prefers to hand off quickly through:
- official booking/contact CTAs
- map links
- Google Calendar links
- shareable URLs

### Strong distinction between browsing modes

List, map, calendar, studios, and teachers are not cosmetic variants of the same page.
Each surface answers a different user intent.

### Editorial rather than neutral

The UI is meant to feel curated and local, not like a generic SaaS data grid.
That is why the product leans on:
- typography
- image and video-led sections
- editorial collections
- city-specific language

## Trust model

The product combines curation and automation.
Trust comes from:
- explicit scope policy
- verified source URLs
- direct contact/booking paths
- freshness timestamps
- suppression of stale or broken sessions
- city-specific catalog policy
- review queues for ambiguous input

The system is allowed to be incomplete.
It is not allowed to be casually misleading.

## City strategy

The architecture is multi-city, but operations are intentionally concentrated.

Current position:
- Palermo is the active public city
- additional cities can exist in seed or hidden state
- a city should only go public after it clears quality and density gates

This protects the product from thin, low-trust expansion.

## What the product is not

`kinelo.fit` is not:
- a booking engine with inventory control
- a class management SaaS for studios
- a social network
- a review marketplace
- a national search engine for every possible activity

Those would all dilute the product and weaken the quality bar.

## Current limitations

The current system is strong where sources are:
- official
- recurring
- structured
- publicly readable

It is weaker where supply exists only as:
- private Instagram content
- noisy Facebook roots with little machine-readable structure
- image-only social posts
- ambiguous timetable screenshots without context

This is why the automation stack uses trust tiers, parser adapters, and moderation rather than blind scraping.

## What success looks like

For a user:
- they find the right class, place, or teacher faster than by jumping across multiple sites and social profiles
- they trust what they see enough to act on it
- they can save, share, and plan without friction

For operations:
- the Palermo catalog stays fresh enough through disciplined automation
- weak signals are reviewed instead of auto-published
- product releases do not routinely break public discovery

## Related docs

- [docs/features-and-flows.md](/Users/nicoladimarco/code/kinelofit/docs/features-and-flows.md)
- [docs/architecture.md](/Users/nicoladimarco/code/kinelofit/docs/architecture.md)
- [docs/automation.md](/Users/nicoladimarco/code/kinelofit/docs/automation.md)
- [docs/catalog-policy.md](/Users/nicoladimarco/code/kinelofit/docs/catalog-policy.md)
- [docs/testing/ux-flows.md](/Users/nicoladimarco/code/kinelofit/docs/testing/ux-flows.md)
