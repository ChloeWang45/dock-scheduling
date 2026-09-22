CREATE TABLE "fit_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"loa_buffer_pct" double precision NOT NULL,
	"beam_buffer_pct" double precision NOT NULL,
	"ukc_margin_ft" double precision NOT NULL,
	"updated_by_staff_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit_settings" ADD CONSTRAINT "fit_settings_updated_by_staff_id_users_id_fk" FOREIGN KEY ("updated_by_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;