CREATE TYPE "public"."attendance_model" AS ENUM('drop_in', 'trial', 'cycle', 'term');--> statement-breakpoint
CREATE TYPE "public"."category_visibility" AS ENUM('hidden', 'beta', 'live');--> statement-breakpoint
CREATE TYPE "public"."city_status" AS ENUM('seed', 'private_preview', 'public');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('direct', 'platform', 'whatsapp', 'phone', 'email', 'website');--> statement-breakpoint
CREATE TYPE "public"."discovery_lead_status" AS ENUM('new', 'reviewed', 'imported', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."session_level" AS ENUM('beginner', 'open', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."session_audience" AS ENUM('adults', 'kids', 'families', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."session_format" AS ENUM('in_person', 'online', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."source_cadence" AS ENUM('daily', 'weekly', 'quarterly');--> statement-breakpoint
CREATE TYPE "public"."source_purpose" AS ENUM('catalog', 'discovery');--> statement-breakpoint
CREATE TYPE "public"."source_trust_tier" AS ENUM('tier_a', 'tier_b', 'tier_c');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('verified', 'stale', 'hidden');--> statement-breakpoint
CREATE TABLE "activity_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"visibility" "category_visibility" DEFAULT 'hidden' NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"hero_metric" jsonb NOT NULL,
	CONSTRAINT "activity_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "booking_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"type" "contact_type" NOT NULL,
	"label" varchar(120) NOT NULL,
	"href" text NOT NULL,
	CONSTRAINT "booking_targets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "calendar_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" varchar(2) NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"submitter_type" varchar(24) NOT NULL,
	"organization_name" varchar(200) NOT NULL,
	"contact_name" varchar(160) NOT NULL,
	"email" varchar(160) NOT NULL,
	"phone" varchar(60),
	"source_urls" jsonb NOT NULL,
	"schedule_text" text NOT NULL,
	"consent" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"status" "city_status" DEFAULT 'seed' NOT NULL,
	"bounds" jsonb NOT NULL,
	"name" jsonb NOT NULL,
	"hero" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studio_slug" varchar(120) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(160) NOT NULL,
	"role" varchar(80) NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digest_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(160) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"preferences" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"source_url" text NOT NULL,
	"title" varchar(220) NOT NULL,
	"snippet" text,
	"discovered_from_url" text NOT NULL,
	"status" "discovery_lead_status" DEFAULT 'new' NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"tags" jsonb NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editorial_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"cta" jsonb NOT NULL,
	"kind" varchar(32) NOT NULL,
	CONSTRAINT "editorial_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(160) NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"entity_slug" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freshness_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"cadence" "source_cadence" DEFAULT 'daily' NOT NULL,
	"total_sessions" numeric(10, 0) NOT NULL,
	"stale_sessions" numeric(10, 0) NOT NULL,
	"broken_links" numeric(10, 0) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"short_bio" jsonb NOT NULL,
	"specialties" jsonb NOT NULL,
	"languages" jsonb NOT NULL,
	CONSTRAINT "instructors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "neighborhoods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"center_lat" numeric(9, 6) NOT NULL,
	"center_lng" numeric(9, 6) NOT NULL,
	CONSTRAINT "neighborhoods_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "outbound_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(160),
	"venue_slug" varchar(120) NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"category_slug" varchar(80) NOT NULL,
	"target_type" "contact_type" NOT NULL,
	"href" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(160) PRIMARY KEY NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"venue_slug" varchar(120) NOT NULL,
	"instructor_slug" varchar(120) NOT NULL,
	"category_slug" varchar(80) NOT NULL,
	"style_slug" varchar(80) NOT NULL,
	"title" jsonb NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"level" "session_level" NOT NULL,
	"language" varchar(64) NOT NULL,
	"format" "session_format" NOT NULL,
	"booking_target_slug" varchar(80) NOT NULL,
	"source_url" text NOT NULL,
	"last_verified_at" timestamp with time zone NOT NULL,
	"verification_status" "verification_status" DEFAULT 'verified' NOT NULL,
	"audience" "session_audience" DEFAULT 'adults' NOT NULL,
	"attendance_model" "attendance_model" DEFAULT 'drop_in' NOT NULL,
	"age_min" integer,
	"age_max" integer,
	"age_band" varchar(16),
	"guardian_required" boolean DEFAULT false NOT NULL,
	"price_note" jsonb
);
--> statement-breakpoint
CREATE TABLE "source_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_slug" varchar(160) NOT NULL,
	"source_url" text NOT NULL,
	"source_payload" jsonb,
	"last_verified_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"source_url" text NOT NULL,
	"source_type" varchar(32) NOT NULL,
	"cadence" "source_cadence" DEFAULT 'daily' NOT NULL,
	"trust_tier" "source_trust_tier" DEFAULT 'tier_b' NOT NULL,
	"purpose" "source_purpose" DEFAULT 'catalog' NOT NULL,
	"parser_adapter" varchar(80),
	"tags" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"last_checked_at" timestamp with time zone,
	"next_check_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "styles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_slug" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	CONSTRAINT "styles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"neighborhood_slug" varchar(80) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(200) NOT NULL,
	"tagline" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"address" text NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"amenities" jsonb NOT NULL,
	"languages" jsonb NOT NULL,
	"style_slugs" jsonb NOT NULL,
	"category_slugs" jsonb NOT NULL,
	"booking_target_order" jsonb NOT NULL,
	"freshness_note" jsonb NOT NULL,
	"source_url" text NOT NULL,
	"last_verified_at" timestamp with time zone NOT NULL,
	CONSTRAINT "venues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "activity_categories_city_idx" ON "activity_categories" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "discovery_leads_city_idx" ON "discovery_leads" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "discovery_leads_status_idx" ON "discovery_leads" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "discovery_leads_city_source_uidx" ON "discovery_leads" USING btree ("city_slug","source_url");--> statement-breakpoint
CREATE INDEX "instructors_city_idx" ON "instructors" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "neighborhoods_city_idx" ON "neighborhoods" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "sessions_city_idx" ON "sessions" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "sessions_venue_idx" ON "sessions" USING btree ("venue_slug");--> statement-breakpoint
CREATE INDEX "sessions_start_idx" ON "sessions" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "source_registry_city_idx" ON "source_registry" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "source_registry_cadence_idx" ON "source_registry" USING btree ("cadence");--> statement-breakpoint
CREATE INDEX "source_registry_active_idx" ON "source_registry" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "source_registry_city_source_uidx" ON "source_registry" USING btree ("city_slug","source_url");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "venues_neighborhood_idx" ON "venues" USING btree ("neighborhood_slug");