import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const cityStatusEnum = pgEnum('city_status', ['seed', 'private_preview', 'public']);
export const categoryVisibilityEnum = pgEnum('category_visibility', ['hidden', 'beta', 'live']);
export const sessionFormatEnum = pgEnum('session_format', ['in_person', 'online', 'hybrid']);
export const levelEnum = pgEnum('session_level', ['beginner', 'open', 'intermediate', 'advanced']);
export const verificationStatusEnum = pgEnum('verification_status', ['verified', 'stale', 'hidden']);
export const contactTypeEnum = pgEnum('contact_type', ['direct', 'platform', 'whatsapp', 'phone', 'email', 'website']);
export const sessionAudienceEnum = pgEnum('session_audience', ['adults', 'kids', 'families', 'mixed']);
export const attendanceModelEnum = pgEnum('attendance_model', ['drop_in', 'trial', 'cycle', 'term']);
export const sourceCadenceEnum = pgEnum('source_cadence', ['daily', 'weekly', 'quarterly']);
export const sourceTrustTierEnum = pgEnum('source_trust_tier', ['tier_a', 'tier_b', 'tier_c']);
export const sourcePurposeEnum = pgEnum('source_purpose', ['catalog', 'discovery']);
export const discoveryLeadStatusEnum = pgEnum('discovery_lead_status', ['new', 'reviewed', 'imported', 'rejected']);
export const reviewStatusEnum = pgEnum('review_status', ['new', 'reviewing', 'approved', 'rejected', 'imported', 'resolved']);

export const cities = pgTable('cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull(),
  status: cityStatusEnum('status').notNull().default('seed'),
  bounds: jsonb('bounds').$type<[number, number, number, number]>().notNull(),
  name: jsonb('name').$type<Record<'en' | 'it', string>>().notNull(),
  hero: jsonb('hero').$type<Record<'en' | 'it', string>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const neighborhoods = pgTable('neighborhoods', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: jsonb('name').$type<Record<'en' | 'it', string>>().notNull(),
  description: jsonb('description').$type<Record<'en' | 'it', string>>().notNull(),
  centerLat: numeric('center_lat', { precision: 9, scale: 6 }).notNull(),
  centerLng: numeric('center_lng', { precision: 9, scale: 6 }).notNull()
}, (table) => ({
  cityIndex: index('neighborhoods_city_idx').on(table.citySlug)
}));

export const activityCategories = pgTable('activity_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  visibility: categoryVisibilityEnum('visibility').notNull().default('hidden'),
  name: jsonb('name').$type<Record<'en' | 'it', string>>().notNull(),
  description: jsonb('description').$type<Record<'en' | 'it', string>>().notNull(),
  heroMetric: jsonb('hero_metric').$type<Record<'en' | 'it', string>>().notNull()
}, (table) => ({
  cityIndex: index('activity_categories_city_idx').on(table.citySlug)
}));

export const styles = pgTable('styles', {
  id: uuid('id').defaultRandom().primaryKey(),
  categorySlug: varchar('category_slug', { length: 80 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: jsonb('name').$type<Record<'en' | 'it', string>>().notNull(),
  description: jsonb('description').$type<Record<'en' | 'it', string>>().notNull()
});

export const instructors = pgTable('instructors', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 160 }).notNull(),
  shortBio: jsonb('short_bio').$type<Record<'en' | 'it', string>>().notNull(),
  specialties: jsonb('specialties').$type<string[]>().notNull(),
  languages: jsonb('languages').$type<string[]>().notNull()
}, (table) => ({
  cityIndex: index('instructors_city_idx').on(table.citySlug)
}));

export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  neighborhoodSlug: varchar('neighborhood_slug', { length: 80 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  tagline: jsonb('tagline').$type<Record<'en' | 'it', string>>().notNull(),
  description: jsonb('description').$type<Record<'en' | 'it', string>>().notNull(),
  address: text('address').notNull(),
  lat: numeric('lat', { precision: 9, scale: 6 }).notNull(),
  lng: numeric('lng', { precision: 9, scale: 6 }).notNull(),
  amenities: jsonb('amenities').$type<string[]>().notNull(),
  languages: jsonb('languages').$type<string[]>().notNull(),
  styleSlugs: jsonb('style_slugs').$type<string[]>().notNull(),
  categorySlugs: jsonb('category_slugs').$type<string[]>().notNull(),
  bookingTargetOrder: jsonb('booking_target_order').$type<string[]>().notNull(),
  freshnessNote: jsonb('freshness_note').$type<Record<'en' | 'it', string>>().notNull(),
  sourceUrl: text('source_url').notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).notNull()
}, (table) => ({
  cityIndex: index('venues_city_idx').on(table.citySlug),
  neighborhoodIndex: index('venues_neighborhood_idx').on(table.neighborhoodSlug)
}));

export const bookingTargets = pgTable('booking_targets', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  type: contactTypeEnum('type').notNull(),
  label: varchar('label', { length: 120 }).notNull(),
  href: text('href').notNull()
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 160 }).primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  venueSlug: varchar('venue_slug', { length: 120 }).notNull(),
  instructorSlug: varchar('instructor_slug', { length: 120 }).notNull(),
  categorySlug: varchar('category_slug', { length: 80 }).notNull(),
  styleSlug: varchar('style_slug', { length: 80 }).notNull(),
  title: jsonb('title').$type<Record<'en' | 'it', string>>().notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  level: levelEnum('level').notNull(),
  language: varchar('language', { length: 64 }).notNull(),
  format: sessionFormatEnum('format').notNull(),
  bookingTargetSlug: varchar('booking_target_slug', { length: 80 }).notNull(),
  sourceUrl: text('source_url').notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).notNull(),
  verificationStatus: verificationStatusEnum('verification_status').notNull().default('verified'),
  audience: sessionAudienceEnum('audience').notNull().default('adults'),
  attendanceModel: attendanceModelEnum('attendance_model').notNull().default('drop_in'),
  ageMin: integer('age_min'),
  ageMax: integer('age_max'),
  ageBand: varchar('age_band', { length: 16 }),
  guardianRequired: boolean('guardian_required').notNull().default(false),
  priceNote: jsonb('price_note').$type<Partial<Record<'en' | 'it', string>> | null>()
}, (table) => ({
  cityIndex: index('sessions_city_idx').on(table.citySlug),
  venueIndex: index('sessions_venue_idx').on(table.venueSlug),
  startIndex: index('sessions_start_idx').on(table.startAt),
  cityStatusStartIndex: index('sessions_city_status_start_idx').on(table.citySlug, table.verificationStatus, table.startAt),
  instructorIndex: index('sessions_instructor_idx').on(table.instructorSlug),
  categoryIndex: index('sessions_category_idx').on(table.categorySlug),
  styleIndex: index('sessions_style_idx').on(table.styleSlug)
}));

export const editorialCollections = pgTable('editorial_collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  title: jsonb('title').$type<Record<'en' | 'it', string>>().notNull(),
  description: jsonb('description').$type<Record<'en' | 'it', string>>().notNull(),
  cta: jsonb('cta').$type<Record<'en' | 'it', string>>().notNull(),
  kind: varchar('kind', { length: 32 }).notNull()
});

export const publicCitySnapshots = pgTable('public_city_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  version: integer('version').notNull(),
  hash: varchar('hash', { length: 64 }).notNull(),
  payloadJson: jsonb('payload_json').$type<Record<string, unknown>>().notNull(),
  builtAt: timestamp('built_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  cityIndex: index('public_city_snapshots_city_idx').on(table.citySlug),
  cityBuiltIndex: index('public_city_snapshots_city_built_idx').on(table.citySlug, table.builtAt),
  cityVersionUnique: uniqueIndex('public_city_snapshots_city_version_uidx').on(table.citySlug, table.version)
}));

export const publicCitySearchIndexes = pgTable('public_city_search_indexes', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  version: integer('version').notNull(),
  hash: varchar('hash', { length: 64 }).notNull(),
  payloadJson: jsonb('payload_json').$type<Record<string, unknown>>().notNull(),
  builtAt: timestamp('built_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  cityIndex: index('public_city_search_indexes_city_idx').on(table.citySlug),
  cityBuiltIndex: index('public_city_search_indexes_city_built_idx').on(table.citySlug, table.builtAt),
  cityVersionUnique: uniqueIndex('public_city_search_indexes_city_version_uidx').on(table.citySlug, table.version)
}));

export const favorites = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 160 }).notNull(),
  entityType: varchar('entity_type', { length: 32 }).notNull(),
  entitySlug: varchar('entity_slug', { length: 160 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 160 }).notNull(),
  email: varchar('email', { length: 160 }).notNull(),
  displayName: varchar('display_name', { length: 120 }),
  homeCitySlug: varchar('home_city_slug', { length: 80 }).notNull().default('palermo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userUnique: uniqueIndex('user_profiles_user_uidx').on(table.userId)
}));

export const digestSubscriptions = pgTable('digest_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 160 }).notNull(),
  locale: varchar('locale', { length: 2 }).notNull(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  preferences: jsonb('preferences').$type<string[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const claims = pgTable('claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  studioSlug: varchar('studio_slug', { length: 120 }).notNull(),
  locale: varchar('locale', { length: 2 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 160 }).notNull(),
  role: varchar('role', { length: 80 }).notNull(),
  notes: text('notes').notNull(),
  reviewStatus: reviewStatusEnum('review_status').notNull().default('new'),
  assignedTo: varchar('assigned_to', { length: 120 }),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const calendarSubmissions = pgTable('calendar_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  locale: varchar('locale', { length: 2 }).notNull(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  submitterType: varchar('submitter_type', { length: 24 }).notNull(),
  organizationName: varchar('organization_name', { length: 200 }).notNull(),
  contactName: varchar('contact_name', { length: 160 }).notNull(),
  email: varchar('email', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 60 }),
  sourceUrls: jsonb('source_urls').$type<string[]>().notNull(),
  scheduleText: text('schedule_text').notNull(),
  consent: boolean('consent').notNull().default(true),
  reviewStatus: reviewStatusEnum('review_status').notNull().default('new'),
  assignedTo: varchar('assigned_to', { length: 120 }),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const importBatches = pgTable('import_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  locale: varchar('locale', { length: 2 }).notNull(),
  fileName: varchar('file_name', { length: 220 }).notNull(),
  sourceLabel: varchar('source_label', { length: 160 }),
  csvContent: text('csv_content').notNull(),
  rowsCount: integer('rows_count').notNull().default(0),
  errorsCount: integer('errors_count').notNull().default(0),
  warningsCount: integer('warnings_count').notNull().default(0),
  validationSummary: jsonb('validation_summary').$type<Record<string, unknown>>().notNull(),
  reviewStatus: reviewStatusEnum('review_status').notNull().default('new'),
  assignedTo: varchar('assigned_to', { length: 120 }),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  importedAt: timestamp('imported_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  cityIndex: index('import_batches_city_idx').on(table.citySlug),
  statusIndex: index('import_batches_status_idx').on(table.reviewStatus),
  createdIndex: index('import_batches_created_idx').on(table.createdAt)
}));

export const sourceRegistry = pgTable('source_registry', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  sourceUrl: text('source_url').notNull(),
  sourceType: varchar('source_type', { length: 32 }).notNull(),
  cadence: sourceCadenceEnum('cadence').notNull().default('daily'),
  trustTier: sourceTrustTierEnum('trust_tier').notNull().default('tier_b'),
  purpose: sourcePurposeEnum('purpose').notNull().default('catalog'),
  parserAdapter: varchar('parser_adapter', { length: 80 }),
  tags: jsonb('tags').$type<string[]>().notNull(),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  nextCheckAt: timestamp('next_check_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  cityIndex: index('source_registry_city_idx').on(table.citySlug),
  cadenceIndex: index('source_registry_cadence_idx').on(table.cadence),
  activeIndex: index('source_registry_active_idx').on(table.active),
  citySourceUnique: uniqueIndex('source_registry_city_source_uidx').on(table.citySlug, table.sourceUrl)
}));

export const discoveryLeads = pgTable('discovery_leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  sourceUrl: text('source_url').notNull(),
  title: varchar('title', { length: 220 }).notNull(),
  snippet: text('snippet'),
  discoveredFromUrl: text('discovered_from_url').notNull(),
  status: discoveryLeadStatusEnum('status').notNull().default('new'),
  assignedTo: varchar('assigned_to', { length: 120 }),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  confidence: numeric('confidence', { precision: 4, scale: 3 }).notNull(),
  tags: jsonb('tags').$type<string[]>().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  cityIndex: index('discovery_leads_city_idx').on(table.citySlug),
  statusIndex: index('discovery_leads_status_idx').on(table.status),
  citySourceUnique: uniqueIndex('discovery_leads_city_source_uidx').on(table.citySlug, table.sourceUrl)
}));

export const outboundClicks = pgTable('outbound_clicks', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: varchar('session_id', { length: 160 }),
  venueSlug: varchar('venue_slug', { length: 120 }).notNull(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  categorySlug: varchar('category_slug', { length: 80 }).notNull(),
  targetType: contactTypeEnum('target_type').notNull(),
  href: text('href').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const sourceRecords = pgTable('source_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 40 }).notNull(),
  entitySlug: varchar('entity_slug', { length: 160 }).notNull(),
  sourceUrl: text('source_url').notNull(),
  sourcePayload: jsonb('source_payload').$type<Record<string, unknown>>(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).notNull()
});

export const freshnessRuns = pgTable('freshness_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  cadence: sourceCadenceEnum('cadence').notNull().default('daily'),
  totalSessions: numeric('total_sessions', { precision: 10, scale: 0 }).notNull(),
  staleSessions: numeric('stale_sessions', { precision: 10, scale: 0 }).notNull(),
  brokenLinks: numeric('broken_links', { precision: 10, scale: 0 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const freshnessRunSources = pgTable('freshness_run_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull(),
  citySlug: varchar('city_slug', { length: 80 }).notNull(),
  sourceUrl: text('source_url').notNull(),
  reachable: boolean('reachable').notNull().default(false),
  changed: boolean('changed').notNull().default(false),
  impacted: boolean('impacted').notNull().default(false),
  status: integer('status').notNull().default(0),
  finalUrl: text('final_url').notNull(),
  error: text('error'),
  parserSignals: integer('parser_signals').notNull().default(0),
  autoReverified: integer('auto_reverified').notNull().default(0),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull()
}, (table) => ({
  runIndex: index('freshness_run_sources_run_idx').on(table.runId),
  cityIndex: index('freshness_run_sources_city_idx').on(table.citySlug),
  checkedIndex: index('freshness_run_sources_checked_idx').on(table.checkedAt)
}));
