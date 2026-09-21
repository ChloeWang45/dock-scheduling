-- The sync trigger only fires on writes made after it was created, so any
-- bookings/events/closures inserted earlier (Phases 2-3, before this
-- table existed) were never mirrored. Backfill them once.
INSERT INTO berth_occupancy_ledger
  (berth_id, source_table, source_id, start_date, end_date, is_closure, occupies_exclusive_slot, overridden)
SELECT
  b.berth_id, 'bookings', b.id, b.start_date, b.end_date, false,
  (berths.max_simultaneous_occupants <= 1), b.overridden
FROM bookings b
JOIN berths ON berths.id = b.berth_id
WHERE b.status <> 'cancelled'
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO berth_occupancy_ledger
  (berth_id, source_table, source_id, start_date, end_date, is_closure, occupies_exclusive_slot, overridden)
SELECT
  e.berth_id, 'events', e.id, e.start_date, e.end_date, false,
  (berths.max_simultaneous_occupants <= 1), e.overridden
FROM events e
JOIN berths ON berths.id = e.berth_id
WHERE e.active
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO berth_occupancy_ledger
  (berth_id, source_table, source_id, start_date, end_date, is_closure, occupies_exclusive_slot, overridden)
SELECT
  c.berth_id, 'closures', c.id, c.start_date, c.end_date, true,
  (berths.max_simultaneous_occupants <= 1), c.overridden
FROM closures c
JOIN berths ON berths.id = c.berth_id
WHERE c.active
ON CONFLICT (source_table, source_id) DO NOTHING;
