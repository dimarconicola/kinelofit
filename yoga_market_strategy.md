Below is the market analysis and the strategy.

## 1. Market reality

This market is already split into three layers, and that matters because your MVP should not accidentally try to compete with the wrong layer.

**Layer A: consumer aggregators / marketplaces**
These are apps where users discover classes across many studios, browse schedules, see maps, and often book in-app. The main references are **ClassPass**, **Urban Sports Club**, **Eversports**, and **Mindbody Explore**. ClassPass is now a broad wellness marketplace using credits, dynamic inventory, and partner yield management. Urban Sports Club is a multi-activity membership marketplace with very large venue coverage in Berlin. Eversports combines studio software with a consumer booking marketplace, especially strong in DACH. Mindbody is the heavyweight software-plus-marketplace stack in wellness. ([classpass.com](https://classpass.com/blog/what-is-classpass-and-how-does-it-work/?utm_source=chatgpt.com))

**Layer B: studio operating systems**
These are B2B systems used by studios to manage schedules, payments, check-ins, CRM, and reporting. Mindbody and Eversports are in this layer too. This is important because if you want booking later, you either integrate with these systems or force studios into manual updates, which will break scale. Both Mindbody and Eversports explicitly support APIs/integrations for schedules and bookings. ([developers.mindbodyonline.com](https://developers.mindbodyonline.com/?utm_source=chatgpt.com))

**Layer C: corporate wellness distribution**
ClassPass has a corporate program. Eversports has a corporate product. Urban Sports Club’s business has strong partner and employer distribution, and USC was acquired by Wellhub in 2025, which reinforces how important B2B2C distribution is in this market. ([classpass.com](https://classpass.com/corporate-wellness?utm_source=chatgpt.com))

Conclusion: if you start with “calendar + map + studio pages,” you are **not** starting as a ClassPass clone. You are starting as a **discovery and scheduling layer**. That is good. It is far more realistic.

## 2. Where the market is still weak

The incumbents are good at breadth, but they are not optimized for a narrow, local, category-specific use case such as “find the right yoga practice in this city right now.” Their strength is inventory aggregation. Their weakness is depth, curation, and local trust.

The gap is:

- fragmented studio information
- poor local curation
- weak identity around teachers, neighborhoods, style, language, vibe, and community fit
- discovery often optimized for “available slots” rather than “best fit”
- many studios still rely on separate websites, Instagram, WhatsApp, and booking tools
- integration complexity means long-tail studios are inconsistently represented across marketplaces ([urbansportsclub.com](https://urbansportsclub.com/en/venues/yogatribe?utm_source=chatgpt.com))

This means your best wedge is **not “one more booking app.”**
Your wedge is:

**“The best city-level yoga discovery graph.”**

That means:
- best class calendar in the city
- best studio directory
- best teacher directory
- best map
- best filtering by style, level, language, time, neighborhood, price band, amenities, and vibe
- optionally booking links first, native booking later

That is strategically much better than trying to launch credits, passes, payouts, inventory optimization, cancellations, partner billing, and payment rails from day one.

## 3. The right MVP

Your instinct is correct. The MVP should be useful **before** it is transactional.

### Core MVP proposition

A mobile-first web app that answers one job:

**“Show me the yoga classes I can actually attend, from studios across the city, with enough context to choose fast.”**

### MVP scope

#### User-facing
- city-level class calendar
- map view
- studio profile pages
- class detail pages
- teacher / yogi profile pages only if data is available
- filters:
  - today / tomorrow / weekend
  - neighborhood
  - start time
  - style
  - level
  - language
  - online / in person
- studio info:
  - name
  - address
  - map pin
  - phone
  - email
  - website
  - Instagram
  - WhatsApp if available
  - amenities
  - style tags
- class info:
  - title
  - time
  - duration
  - studio
  - teacher
  - level
  - style
  - booking method
  - price if public
  - cancellation note if public
- CTA:
  - “Book on studio site”
  - not native booking at first
- account:
  - free sign-up required to save favorites, alerts, and personal schedule
- personal utility:
  - save favorite studios
  - save favorite teachers
  - bookmark classes
  - create a simple personal calendar
  - email / push-like browser reminders later

#### Studio-facing
- claim studio page
- edit studio details
- submit or sync schedule
- upload teacher list
- publish contact links
- optionally promote featured classes

#### Admin-facing
- moderation dashboard
- schedule import / correction
- taxonomy control
- city coverage dashboard
- studio claim approvals
- broken link / stale schedule alerts

### What to exclude from MVP
Do not build these initially:
- membership credits
- native payments
- refunds
- dynamic inventory pricing
- cross-studio bundles
- waitlists
- reviews
- class attendance check-in
- complex CRM
- studio billing engine
- corporate packages
- mobile app

Reason: those are not MVP features. Those are scale features.

## 4. The correct MVP business logic

The MVP is a **demand aggregator**, not a booking intermediary.

That means:
- users discover on your platform
- they click out to book on studio site / Eversports / Mindbody / another booking page
- you collect user identity and demand signals
- you build city coverage and SEO
- you prove recurring intent before touching payments

This reduces operational load massively. It also avoids becoming responsible for cancellations, no-shows, payouts, VAT/payment compliance, reconciliation, and dispute handling, which are all expensive operational layers already central to players like ClassPass and studio software platforms. ClassPass’s own partner and cancellation systems show how much operational machinery exists once you intermediate the transaction. ([help.classpass.com](https://help.classpass.com/hc/en-us/articles/207942743-What-is-the-reservation-cancellation-policy?utm_source=chatgpt.com))

## 5. Best go-to-market wedge

Do not launch as “all fitness.”
Do not launch in multiple cities.
Do not launch with multiple verticals.

Launch as:

**“The best yoga class finder for one city.”**

Berlin is a rational precedent because it already has dense yoga supply and user familiarity with aggregation behavior. Urban Sports Club publicly shows hundreds of Berlin yoga venues. ClassPass and Eversports also have Berlin yoga discovery pages. That proves supply density and user behavior already exist. ([urbansportsclub.com](https://urbansportsclub.com/en/sports/yoga/berlin?utm_source=chatgpt.com))

But the actual best launch city is not necessarily Berlin. The best city is where you can win local density fastest.

The winning city criteria:
- many yoga studios
- fragmented digital presence
- many expats / English-speaking users
- neighborhood-based discovery behavior
- enough boutique identity
- founder access to local operators
- weak local editorial layer

That usually favors:
- Berlin
- Lisbon
- Barcelona
- Milan
- Amsterdam
- Prague
- maybe Palermo only as a niche experiment, not as the first venture-scale city

## 6. User acquisition strategy for MVP

You need two loops.

### Loop 1: SEO / utility loop
Pages that can rank:
- yoga in [city]
- yoga in [neighborhood]
- yin yoga [city]
- vinyasa yoga [city]
- prenatal yoga [city]
- yoga in english [city]
- beginner yoga [city]
- weekend yoga [city]
- morning yoga [city]
- hot yoga [city]

This works because the product is fundamentally structured local search.

### Loop 2: studio distribution loop
Studios need visibility.
You offer:
- free listing
- free class page
- free “claim your studio”
- free teacher page
- optional featured placement later

Studios then link back to their profile, share their page, and use it as another discovery surface.

### Loop 3: user retention loop
Users create an account to:
- save favorites
- build weekly routine
- get alerts when favorite teachers/classes appear
- receive a personalized digest: “best classes for you this week”

This is where requiring free sign-up can make sense, but not for first visit.
Do **not** gate basic discovery.
Gate only persistence and personalization.

Correct model:
- browse freely
- sign up to save, follow, alert, and personalize

If you force sign-up before the first useful interaction, conversion will drop.

## 7. Supply acquisition strategy

Supply is the hard side.

### Phase 1: seed supply manually
Get the first 50–100 studios / teachers into the system manually.
Use public data:
- websites
- Instagram
- Google Maps
- booking pages
- public schedules

Then invite studios to claim and correct.

### Phase 2: lightweight claim flow
Studio can:
- verify ownership
- fix details
- add classes
- add booking links
- add teacher bios
- mark class language and level
- mark amenities

### Phase 3: sync where possible
For studios on platforms with APIs or stable feeds, integrate.
Mindbody has developer APIs. Eversports documents API-based schedule retrieval and partner integrations. ([developers.mindbodyonline.com](https://developers.mindbodyonline.com/?utm_source=chatgpt.com))

### Phase 4: premium supply tools
Only after demand exists:
- analytics
- featured listings
- lead capture
- conversion tracking
- “new students this month”
- class fill-rate insights
- website widgets

## 8. Recommended product progression

### Stage 1 — Discovery product
Goal: useful without transactions.

Deliver:
- city calendar
- studio pages
- map
- filters
- accounts
- favorites
- claim flow
- click-out booking

Monetization:
- none or tiny featured listings

### Stage 2 — Demand intelligence product
Goal: become valuable to studios.

Add:
- studio dashboard
- profile analytics
- outbound click analytics
- popular time windows
- teacher following
- lead capture
- “request to join class” or “notify me”

Monetization:
- freemium B2B
- sponsored placement
- featured classes
- promoted neighborhood visibility

### Stage 3 — Soft transaction layer
Goal: own the intent, not full inventory economics.

Add:
- booking request handoff
- embedded booking where integrations allow
- saved payment optionally
- referral / affiliate agreements with selected studios
- intro offers and packs

Monetization:
- referral fee
- promoted offers
- partner subscriptions

### Stage 4 — Full marketplace
Only if warranted.

Add:
- native booking
- native payment
- cancellations
- class packs
- memberships
- no-show handling
- revenue settlement

This is where you start becoming operationally similar to existing category leaders. It is much harder.

## 9. Best monetization path from MVP to commercial tier

### Best path
**B2C utility first, B2B monetization second, transactions third.**

That is the correct sequence.

### Commercial tiers

#### Tier 0 — Free listing
For all studios.
Includes:
- profile
- map placement
- contact links
- basic schedule listing
- claim access

Purpose:
- maximize supply density

#### Tier 1 — Pro profile
Monthly fee.
Includes:
- richer gallery
- teacher pages
- featured classes
- SEO-enhanced page
- analytics
- lead/contact capture
- event/workshop promotion

Best for:
- boutique studios
- independent teachers

#### Tier 2 — Growth
Monthly fee.
Includes:
- schedule sync
- outbound click analytics
- lead export
- neighborhood/category sponsorship
- newsletter placement
- custom landing pages
- first-party CRM-lite

#### Tier 3 — Performance / transactional
Either subscription or take rate.
Includes:
- embedded booking
- intro offers
- bundles
- affiliate/referral setup
- conversion reporting

### Alternative monetization
- sponsored newsletter
- paid teacher verification / enhanced profiles
- workshop/event promotion
- city guides
- employer wellness mini-curation for local companies

## 10. Whether free subscription requirement makes sense

Yes, but only in the right place.

### Correct
Require registration for:
- favorites
- reminders
- following teachers/studios
- personalized weekly picks
- custom calendar
- price/watch alerts
- saved filters

### Incorrect
Require registration for:
- basic browsing
- map
- viewing class details
- reading studio profiles

If you gate discovery, your SEO and first-use value collapse.

## 11. Web app vs native app

For MVP, **mobile-first web app** is the right decision.

Why:
- cheaper
- faster
- indexable
- shareable
- SEO-friendly
- easier studio onboarding
- no app-store friction
- easier city-by-city testing

You do not need a native app until one of these becomes true:
- users rely heavily on recurring bookings
- reminders and retention become critical
- saved payment and one-tap booking matter
- push notifications are a core growth lever

Before that, responsive web wins.

## 12. Open source: should you do it?

Full open source is probably the wrong move.

Reason:
- your moat is not code
- your moat is supply graph, normalization, curation, distribution, and brand
- open-sourcing the whole stack gives away leverage without solving the hard side

What could make sense:
- open-source a narrow technical component
  - calendar widget
  - studio schedule embed
  - taxonomy schema
  - import connector
- or publish an open data format for yoga class feeds

That can help adoption and integrations without giving away the whole business.

Best position:
- **closed product**
- optionally **open protocol / feed spec / widgets**

That is strategically cleaner.

## 13. Competitive positioning

You should position against pain, not against brand names.

Not:
- “better than ClassPass”

Instead:
- “the easiest way to find the right yoga class in your city”
- “city-level yoga discovery, finally organized”
- “find by neighborhood, style, language, teacher, and time”
- “all local yoga classes in one place”

For studios:
- “be discoverable without another expensive software migration”
- “get found by the right students”
- “claim your page, sync your schedule, convert local demand”

This positioning avoids head-on competition with the membership giants.

## 14. Recommended initial stack and operating model

### Product model
- mobile-first web app
- marketplace-style information architecture
- strong local SEO
- manual + semi-automated data ingestion
- click-out booking first

### Data model
Core entities:
- city
- neighborhood
- studio
- location
- teacher
- class type
- class instance
- class schedule rule
- booking method
- contact methods
- amenities
- language
- level
- tags
- source / freshness / verification status

### Operational model
- start editorially managed
- high QA on first city
- normalize messy schedules manually
- use claim flows to shift maintenance to studios over time

## 15. What I would actually do

### The sharpest strategy

Build **“the best yoga discovery layer for one city”**.

#### Version 1
- responsive web app
- no native payments
- no native booking
- no credits
- no reviews
- no app

#### What it does extremely well
- citywide class calendar
- map
- studio pages
- teacher pages where possible
- precise filters
- clean mobile UX
- save/follow/alert after free sign-up
- click-out booking
- claim-your-profile for studios

#### First monetization
- featured placement
- promoted events/workshops
- pro studio profiles
- analytics

#### Second monetization
- referral agreements / affiliate bookings
- embedded booking with selected software integrations

#### Only much later
- own checkout
- own subscriptions
- own class packs

## 16. Brutal truth

A generic “wellness booking app” is weak.
A “ClassPass but smaller” strategy is weak.
A “studio SaaS + marketplace + membership + payments” launch is too broad.

The strong strategy is narrow:

**one category, one city, one core job, one superior UX.**

That is the path from MVP to something commercially credible.

## 17. Final recommendation

Best strategy:

**Phase 1**
Launch a mobile-first web app for one city and one vertical: yoga.
Core product = calendar + studio pages + map + filters + click-out booking.
Free browsing, account required for favorites and alerts.

**Phase 2**
Turn it into the best local demand layer:
teacher profiles, personalization, notifications, newsletters, saved routines, claim flow, studio dashboard.

**Phase 3**
Monetize studios first:
featured listings, analytics, promoted workshops, premium profiles, sync tools.

**Phase 4**
Add transactionality selectively where integration economics are favorable.

**Do not open-source the whole product.**
At most, open-source a narrow feed spec or widget layer.

If you want this converted next into a founder-grade market strategy doc plus MVP PRD and monetization roadmap, I will produce the full document set.
