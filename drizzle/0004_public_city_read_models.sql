CREATE TABLE "public_city_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"version" integer NOT NULL,
	"hash" varchar(64) NOT NULL,
	"payload_json" jsonb NOT NULL,
	"built_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_city_search_indexes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"version" integer NOT NULL,
	"hash" varchar(64) NOT NULL,
	"payload_json" jsonb NOT NULL,
	"built_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "public_city_snapshots_city_idx" ON "public_city_snapshots" USING btree ("city_slug");
--> statement-breakpoint
CREATE INDEX "public_city_snapshots_city_built_idx" ON "public_city_snapshots" USING btree ("city_slug","built_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "public_city_snapshots_city_version_uidx" ON "public_city_snapshots" USING btree ("city_slug","version");
--> statement-breakpoint
CREATE INDEX "public_city_search_indexes_city_idx" ON "public_city_search_indexes" USING btree ("city_slug");
--> statement-breakpoint
CREATE INDEX "public_city_search_indexes_city_built_idx" ON "public_city_search_indexes" USING btree ("city_slug","built_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "public_city_search_indexes_city_version_uidx" ON "public_city_search_indexes" USING btree ("city_slug","version");
--> statement-breakpoint
CREATE INDEX "sessions_city_status_start_idx" ON "sessions" USING btree ("city_slug","verification_status","start_at");
--> statement-breakpoint
CREATE INDEX "sessions_instructor_idx" ON "sessions" USING btree ("instructor_slug");
--> statement-breakpoint
CREATE INDEX "sessions_category_idx" ON "sessions" USING btree ("category_slug");
--> statement-breakpoint
CREATE INDEX "sessions_style_idx" ON "sessions" USING btree ("style_slug");
