CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(160) NOT NULL,
	"email" varchar(160) NOT NULL,
	"display_name" varchar(120),
	"home_city_slug" varchar(80) DEFAULT 'palermo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_uidx" ON "user_profiles" USING btree ("user_id");
