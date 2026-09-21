CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'tentative', 'cancelled');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"berth_id" uuid NOT NULL,
	"vessel_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_all_day" boolean DEFAULT true NOT NULL,
	"arrival_time" time,
	"departure_time" time,
	"created_by_staff_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"overridden" boolean DEFAULT false NOT NULL,
	"override_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "berths" ADD COLUMN "loa_buffer_pct" double precision;--> statement-breakpoint
ALTER TABLE "berths" ADD COLUMN "beam_buffer_pct" double precision;--> statement-breakpoint
ALTER TABLE "berths" ADD COLUMN "ukc_margin_ft" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_berth_id_berths_id_fk" FOREIGN KEY ("berth_id") REFERENCES "public"."berths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_staff_id_users_id_fk" FOREIGN KEY ("created_by_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;