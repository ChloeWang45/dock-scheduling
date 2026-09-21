import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { users, berths, vessels } from "@/db/schema";

// Temporary one-shot endpoint: applies the Phase 1 schema and seed data
// directly against the runtime DATABASE_URL, since Vercel marks the
// Neon-marketplace-provisioned connection string as non-retrievable via
// `vercel env pull` (by design). Delete this route once it has run.

const MIGRATION_STATEMENTS = [
  `CREATE TYPE "public"."user_role" AS ENUM('admin', 'staff', 'viewer');`,
  `CREATE TYPE "public"."user_status" AS ENUM('pending', 'approved');`,
  `CREATE TYPE "public"."vessel_type" AS ENUM('R/V', 'OSV', 'F/V', 'M/Y', 'Barge');`,
  `CREATE TABLE "berths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"length_ft" double precision,
	"depth_at_low_tide_ft" double precision,
	"width_ft" double precision,
	"max_simultaneous_occupants" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "berths_name_unique" UNIQUE("name")
);`,
  `CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);`,
  `CREATE TABLE "vessels" (
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
);`,
];

async function runMigration() {
  for (const statement of MIGRATION_STATEMENTS) {
    try {
      await db.execute(sql.raw(statement));
    } catch (err) {
      if (!(err instanceof Error && /already exists/i.test(err.message))) {
        throw err;
      }
    }
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "wangyuesu13572@gmail.com";
  const password = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(users)
    .values({ name: "Admin", email, passwordHash, role: "admin", status: "approved" })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, role: "admin", status: "approved" },
    });

  return { email, password };
}

async function seedBerths() {
  const rows = [
    { name: "North Pier West", lengthFt: 410 },
    { name: "North Pier East", lengthFt: 240 },
    { name: "North Pier Face", lengthFt: 75 },
    { name: "South Float West", lengthFt: 90 },
    { name: "South Float East", lengthFt: 90 },
    { name: "Inner Channel", lengthFt: 55 },
    { name: "North Finger Piers", lengthFt: null },
    { name: "Small craft slips (institution boats)", lengthFt: null },
  ];
  for (const row of rows) {
    await db.insert(berths).values(row).onConflictDoNothing();
  }
  return rows.length;
}

async function seedVessels() {
  const rows = [
    { name: "R/V Blue Heron", type: "R/V" as const, loaFt: 86, beamFt: 23, draftFt: 12 },
    { name: "R/V Hugh R. Sharp", type: "R/V" as const, loaFt: 150, beamFt: 32, draftFt: 9.5 },
    { name: "R/V Sikuliaq", type: "R/V" as const, loaFt: 261, beamFt: 52, draftFt: 18.75 },
    { name: "R/V Atlantis", type: "R/V" as const, loaFt: 274, beamFt: 52.5, draftFt: 19 },
  ];
  for (const row of rows) {
    await db.insert(vessels).values(row).onConflictDoNothing();
  }
  return rows.length;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-bootstrap-secret");
  if (!token || token !== process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await runMigration();
  const admin = await seedAdmin();
  const berthCount = await seedBerths();
  const vesselCount = await seedVessels();

  return NextResponse.json({
    ok: true,
    admin,
    berthCount,
    vesselCount,
  });
}
