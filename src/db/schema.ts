import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  doublePrecision,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "staff", "viewer"]);
export const userStatus = pgEnum("user_status", ["pending", "approved"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("viewer"),
  status: userStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const berths = pgTable("berths", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  lengthFt: doublePrecision("length_ft"),
  depthAtLowTideFt: doublePrecision("depth_at_low_tide_ft"),
  widthFt: doublePrecision("width_ft"),
  maxSimultaneousOccupants: integer("max_simultaneous_occupants").notNull().default(1),
  active: boolean("active").notNull().default(true),
});

export const vesselType = pgEnum("vessel_type", ["R/V", "OSV", "F/V", "M/Y", "Barge"]);

export const vessels = pgTable("vessels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  type: vesselType("type").notNull(),
  loaFt: doublePrecision("loa_ft"),
  draftFt: doublePrecision("draft_ft"),
  beamFt: doublePrecision("beam_ft"),
  operator: text("operator"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  active: boolean("active").notNull().default(true),
});
