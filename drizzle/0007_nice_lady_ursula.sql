CREATE TYPE "public"."recurrence_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "recurrence_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"frequency" "recurrence_frequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"end_date" date,
	"end_count" integer,
	"created_by_staff_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "recurrence_series" ADD CONSTRAINT "recurrence_series_created_by_staff_id_users_id_fk" FOREIGN KEY ("created_by_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_series_id_recurrence_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."recurrence_series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_series_id_recurrence_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."recurrence_series"("id") ON DELETE no action ON UPDATE no action;