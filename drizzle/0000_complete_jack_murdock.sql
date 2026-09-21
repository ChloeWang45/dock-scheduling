CREATE TYPE "public"."user_role" AS ENUM('admin', 'staff', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'approved');--> statement-breakpoint
CREATE TYPE "public"."vessel_type" AS ENUM('R/V', 'OSV', 'F/V', 'M/Y', 'Barge');--> statement-breakpoint
CREATE TABLE "berths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"length_ft" double precision,
	"depth_at_low_tide_ft" double precision,
	"width_ft" double precision,
	"max_simultaneous_occupants" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "berths_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vessels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "vessel_type" NOT NULL,
	"loa_ft" double precision,
	"draft_ft" double precision,
	"beam_ft" double precision,
	"operator" text,
	"contact_phone" text,
	"contact_email" text,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "vessels_name_unique" UNIQUE("name")
);
