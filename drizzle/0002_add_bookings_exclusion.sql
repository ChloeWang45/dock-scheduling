-- Enables gist indexes on scalar equality (needed to combine berth_id
-- equality with daterange overlap in one exclusion constraint).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- The overlap check needs a range type; generate it from start/end date
-- rather than maintaining it by hand.
ALTER TABLE "bookings"
  ADD COLUMN "date_range" daterange
  GENERATED ALWAYS AS (daterange("start_date", "end_date", '[]')) STORED;

-- Exclusion constraints can't reference another table, so a berth's
-- occupancy limit is denormalized onto each booking row via this trigger
-- (kept in sync on insert/update, so it can't drift from the berth's own
-- current setting without going through this check).
CREATE OR REPLACE FUNCTION set_booking_exclusive_slot()
RETURNS trigger AS $$
BEGIN
  SELECT (max_simultaneous_occupants <= 1) INTO NEW.occupies_exclusive_slot
  FROM berths WHERE id = NEW.berth_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "bookings" ADD COLUMN "occupies_exclusive_slot" boolean;

CREATE TRIGGER bookings_set_exclusive_slot
  BEFORE INSERT OR UPDATE OF berth_id ON "bookings"
  FOR EACH ROW EXECUTE FUNCTION set_booking_exclusive_slot();

-- The hard backstop: on a single-occupant berth, two non-cancelled,
-- non-overridden bookings can never occupy overlapping date ranges. This
-- is enforced by Postgres itself, not application code, so a double-
-- booking is structurally impossible to save by the normal path. A
-- deliberate, logged override (overridden = true) is the only way past
-- it — matching the plan's override-with-justification rule while still
-- making the default path fail closed.
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap_exclusive"
  EXCLUDE USING gist (
    berth_id WITH =,
    date_range WITH &&
  ) WHERE (status <> 'cancelled' AND NOT overridden AND occupies_exclusive_slot);
