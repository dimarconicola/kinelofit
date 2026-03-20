CREATE TYPE "public"."review_status" AS ENUM('new', 'reviewing', 'approved', 'rejected', 'imported', 'resolved');--> statement-breakpoint
CREATE TABLE "freshness_run_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"source_url" text NOT NULL,
	"reachable" boolean DEFAULT false NOT NULL,
	"changed" boolean DEFAULT false NOT NULL,
	"impacted" boolean DEFAULT false NOT NULL,
	"status" integer DEFAULT 0 NOT NULL,
	"final_url" text NOT NULL,
	"error" text,
	"parser_signals" integer DEFAULT 0 NOT NULL,
	"auto_reverified" integer DEFAULT 0 NOT NULL,
	"checked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_submissions" ADD COLUMN "review_status" "review_status" DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_submissions" ADD COLUMN "assigned_to" varchar(120);--> statement-breakpoint
ALTER TABLE "calendar_submissions" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "calendar_submissions" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "review_status" "review_status" DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "assigned_to" varchar(120);--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "discovery_leads" ADD COLUMN "assigned_to" varchar(120);--> statement-breakpoint
ALTER TABLE "discovery_leads" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "discovery_leads" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "freshness_run_sources_run_idx" ON "freshness_run_sources" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "freshness_run_sources_city_idx" ON "freshness_run_sources" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "freshness_run_sources_checked_idx" ON "freshness_run_sources" USING btree ("checked_at");