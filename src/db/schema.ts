import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  doublePrecision,
  integer,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "staff", "viewer"]);
export const userStatus = pgEnum("user_status", ["pending", "approved"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  title: text("title"),
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
  // Fit-check buffers; null falls back to the global default in each check.
  loaBufferPct: doublePrecision("loa_buffer_pct"),
  beamBufferPct: doublePrecision("beam_buffer_pct"),
  ukcMarginFt: doublePrecision("ukc_margin_ft"),
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

export const bookingStatus = pgEnum("booking_status", [
  "confirmed",
  "tentative",
  "cancelled",
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  berthId: uuid("berth_id")
    .notNull()
    .references(() => berths.id),
  vesselId: uuid("vessel_id")
    .notNull()
    .references(() => vessels.id),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  isAllDay: boolean("is_all_day").notNull().default(true),
  arrivalTime: time("arrival_time"),
  departureTime: time("departure_time"),
  createdByStaffId: uuid("created_by_staff_id")
    .notNull()
    .references(() => users.id),
  status: bookingStatus("status").notNull().default("confirmed"),
  notes: text("notes"),
  // Set together: a booking that would otherwise be rejected as a conflict
  // or fit violation can be force-saved only with a logged reason.
  overridden: boolean("overridden").notNull().default(false),
  overrideNote: text("override_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  berthId: uuid("berth_id")
    .notNull()
    .references(() => berths.id),
  name: text("name").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  organizer: text("organizer"),
  notes: text("notes"),
  createdByStaffId: uuid("created_by_staff_id")
    .notNull()
    .references(() => users.id),
  active: boolean("active").notNull().default(true),
  overridden: boolean("overridden").notNull().default(false),
  overrideNote: text("override_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const closures = pgTable("closures", {
  id: uuid("id").primaryKey().defaultRandom(),
  berthId: uuid("berth_id")
    .notNull()
    .references(() => berths.id),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  reason: text("reason").notNull(),
  createdByStaffId: uuid("created_by_staff_id")
    .notNull()
    .references(() => users.id),
  active: boolean("active").notNull().default(true),
  overridden: boolean("overridden").notNull().default(false),
  overrideNote: text("override_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ledgerSourceTable = pgEnum("ledger_source_table", [
  "bookings",
  "events",
  "closures",
]);

// Maintained entirely by DB triggers (see the custom migration) — mirrors
// every currently-blocking Booking/Event/Closure row so a single pair of
// GiST exclusion constraints can enforce overlap rules across all three
// tables, which Postgres can't otherwise express (EXCLUDE is per-table).
// The application only ever reads this table.
export const berthOccupancyLedger = pgTable("berth_occupancy_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  berthId: uuid("berth_id")
    .notNull()
    .references(() => berths.id),
  sourceTable: ledgerSourceTable("source_table").notNull(),
  sourceId: uuid("source_id").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  isClosure: boolean("is_closure").notNull(),
  occupiesExclusiveSlot: boolean("occupies_exclusive_slot").notNull(),
  overridden: boolean("overridden").notNull().default(false),
});
