CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_slug" varchar(80) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"file_name" varchar(220) NOT NULL,
	"source_label" varchar(160),
	"csv_content" text NOT NULL,
	"rows_count" integer DEFAULT 0 NOT NULL,
	"errors_count" integer DEFAULT 0 NOT NULL,
	"warnings_count" integer DEFAULT 0 NOT NULL,
	"validation_summary" jsonb NOT NULL,
	"review_status" "review_status" DEFAULT 'new' NOT NULL,
	"assigned_to" varchar(120),
	"review_notes" text,
	"reviewed_at" timestamp with time zone,
	"imported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "import_batches_city_idx" ON "import_batches" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "import_batches_status_idx" ON "import_batches" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "import_batches_created_idx" ON "import_batches" USING btree ("created_at");