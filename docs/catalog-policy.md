# kinelo.fit catalog policy

## Positioning
kinelo.fit is a Palermo-first local discovery utility for yoga, mind-body practice, and kids activities. The catalog should stay narrow enough to feel trustworthy and broad enough to be useful every week.

## In scope
- Yoga and yoga-adjacent mind-body classes
- Pilates
- Meditation, breathwork, somatic movement, mobility, gentle movement classes
- Kids activities for ages 0-14 when they are course-based, recurring, and locally relevant
- Martial arts only when the offer is class-led, recurring, and compatible with the mind-body / guided-practice profile
- Gyms only if they expose a clear recurring class calendar with direct CTAs and discovery value

## Out of scope
- Field or team sports such as tennis, rugby, football, basketball, volleyball
- Generic gym memberships with no clear class schedule
- One-off events without a recurring or upcoming calendar signal
- Offers with no verifiable booking/contact path
- Kids offers above age 14 for the current Palermo cycle

## Venue profiles
Supported venue profiles:
- studio
- association
- independent_teacher
- gym_with_classes
- event_series

Unsupported profiles should not enter the canonical catalog.

## Attendance model
Every recurring session should carry one of:
- drop_in
- trial
- cycle
- term

Defaulting to `drop_in` is allowed during import, but it should be treated as a warning until manually verified.

## Kids policy
- Kids coverage is limited to 0-14
- Every kids item should include age range when possible
- Family/mixed activities can be included if they are clearly labeled and have a valid CTA
- Term-based offers are allowed for kids only; non-kids term-only offers stay out of scope for v1

## Data quality gates
Each imported or manually created row should have:
- valid source URL
- valid booking target URL or verified contact method
- freshness timestamp
- city/category/style mapping
- coordinates and address
- verification status

Palermo ops targets:
- pricing note on at least venue or session level for most visible supply
- attendance model on every recurring session
- CTA coverage above 95%
- stale sessions suppressed after policy thresholds

## Operational workflow
- new claims, calendar submissions, and discovery leads enter moderation first
- low-confidence freshness diffs do not auto-publish
- quarterly discovery sweeps feed leads, not auto-imports
- secondary cities stay hidden until they pass the same density and trust rules as Palermo
