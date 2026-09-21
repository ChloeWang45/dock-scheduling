-- The ledger's own overlap range, generated from its start/end columns.
ALTER TABLE "berth_occupancy_ledger"
  ADD COLUMN "date_range" daterange
  GENERATED ALWAYS AS (daterange("start_date", "end_date", '[]')) STORED;

-- Keeps the ledger in sync with whichever of bookings/events/closures
-- fired the trigger. A row is mirrored into the ledger only while it's
-- actually blocking (booking not cancelled, event/closure active); it's
-- removed the moment that stops being true, or on delete.
CREATE OR REPLACE FUNCTION sync_berth_occupancy_ledger()
RETURNS trigger AS $$
DECLARE
  v_is_blocking boolean;
  v_is_closure boolean;
  v_exclusive boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM berth_occupancy_ledger
      WHERE source_table = TG_TABLE_NAME::ledger_source_table AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_TABLE_NAME = 'bookings' THEN
    v_is_blocking := (NEW.status <> 'cancelled');
    v_is_closure := false;
  ELSIF TG_TABLE_NAME = 'events' THEN
    v_is_blocking := NEW.active;
    v_is_closure := false;
  ELSE -- closures
    v_is_blocking := NEW.active;
    v_is_closure := true;
  END IF;

  IF v_is_blocking THEN
    SELECT (max_simultaneous_occupants <= 1) INTO v_exclusive
      FROM berths WHERE id = NEW.berth_id;

    INSERT INTO berth_occupancy_ledger
      (berth_id, source_table, source_id, start_date, end_date, is_closure, occupies_exclusive_slot, overridden)
    VALUES
      (NEW.berth_id, TG_TABLE_NAME::ledger_source_table, NEW.id, NEW.start_date, NEW.end_date, v_is_closure, v_exclusive, NEW.overridden)
    ON CONFLICT (source_table, source_id) DO UPDATE SET
      berth_id = EXCLUDED.berth_id,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      is_closure = EXCLUDED.is_closure,
      occupies_exclusive_slot = EXCLUDED.occupies_exclusive_slot,
      overridden = EXCLUDED.overridden;
  ELSE
    DELETE FROM berth_occupancy_ledger
      WHERE source_table = TG_TABLE_NAME::ledger_source_table AND source_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "berth_occupancy_ledger" ADD CONSTRAINT "ledger_source_unique" UNIQUE ("source_table", "source_id");

CREATE TRIGGER bookings_sync_ledger AFTER INSERT OR UPDATE OR DELETE ON "bookings"
  FOR EACH ROW EXECUTE FUNCTION sync_berth_occupancy_ledger();
CREATE TRIGGER events_sync_ledger AFTER INSERT OR UPDATE OR DELETE ON "events"
  FOR EACH ROW EXECUTE FUNCTION sync_berth_occupancy_ledger();
CREATE TRIGGER closures_sync_ledger AFTER INSERT OR UPDATE OR DELETE ON "closures"
  FOR EACH ROW EXECUTE FUNCTION sync_berth_occupancy_ledger();

-- Rule 1: on a single-occupant berth, ANY two active, non-overridden
-- ledger entries (booking, event, or closure, in any combination) can't
-- overlap. This is a superset of the Phase 2 bookings-only constraint —
-- that one is left in place too, so the exclusive-berth guarantee never
-- depends on the ledger alone.
ALTER TABLE "berth_occupancy_ledger" ADD CONSTRAINT "ledger_exclusive_no_overlap"
  EXCLUDE USING gist (
    berth_id WITH =,
    date_range WITH &&
  ) WHERE (NOT overridden AND occupies_exclusive_slot);

-- Rule 2: on a multi-occupant berth, a closure still can't overlap a
-- booking or event — a closure isn't a capacity slot, it blocks the whole
-- berth. `is_closure WITH <>` means the pair only conflicts when exactly
-- one side is a closure; two closures (or two occupants — capacity is
-- checked at the application level) overlapping is not restricted here.
ALTER TABLE "berth_occupancy_ledger" ADD CONSTRAINT "ledger_closure_blocks_occupant"
  EXCLUDE USING gist (
    berth_id WITH =,
    is_closure WITH <>,
    date_range WITH &&
  ) WHERE (NOT overridden AND NOT occupies_exclusive_slot);
