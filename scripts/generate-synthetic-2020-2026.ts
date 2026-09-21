import { db } from "../src/db";
import { berths, bookings, closures, events, users, vessels } from "../src/db/schema";
import { eq, lte } from "drizzle-orm";

// Deterministic PRNG so re-running this script produces the same schedule.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20200101);

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}

function weightedPick<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const i of items) {
    r -= i.weight;
    if (r <= 0) return i.item;
  }
  return items[items.length - 1].item;
}
function bootstrapPick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function randInt(min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

async function main() {
  const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (!admin) throw new Error("No admin user found");

  const berthRows = await db.select().from(berths);
  const vesselRows = await db.select().from(vessels);

  // Real (pre-2020) data drives the empirical distributions we sample from.
  const realBookings = await db
    .select({ berthId: bookings.berthId, vesselId: bookings.vesselId, startDate: bookings.startDate, endDate: bookings.endDate })
    .from(bookings)
    .where(lte(bookings.startDate, "2019-12-31"));
  const realEvents = await db
    .select({ berthId: events.berthId, name: events.name, startDate: events.startDate, endDate: events.endDate })
    .from(events)
    .where(lte(events.startDate, "2019-12-31"));
  const realClosures = await db
    .select({ berthId: closures.berthId, reason: closures.reason, startDate: closures.startDate, endDate: closures.endDate })
    .from(closures)
    .where(lte(closures.startDate, "2019-12-31"));

  // All existing occupancy (any year) seeds the conflict map so synthetic
  // entries never collide with real ones.
  const occupied = new Map<string, { start: string; end: string }[]>();
  function occupy(berthId: string, start: string, end: string) {
    if (!occupied.has(berthId)) occupied.set(berthId, []);
    occupied.get(berthId)!.push({ start, end });
  }
  function isFree(berthId: string, start: string, end: string) {
    const list = occupied.get(berthId) ?? [];
    return !list.some((r) => overlaps(start, end, r.start, r.end));
  }
  for (const b of await db.select({ berthId: bookings.berthId, startDate: bookings.startDate, endDate: bookings.endDate }).from(bookings)) {
    occupy(b.berthId, b.startDate, b.endDate);
  }
  for (const e of await db.select({ berthId: events.berthId, startDate: events.startDate, endDate: events.endDate }).from(events)) {
    occupy(e.berthId, e.startDate, e.endDate);
  }
  for (const c of await db.select({ berthId: closures.berthId, startDate: closures.startDate, endDate: closures.endDate }).from(closures)) {
    occupy(c.berthId, c.startDate, c.endDate);
  }

  // --- Empirical distributions from real 2017-2019 data ---
  function countBy<T extends { berthId: string }>(rows: T[]) {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.berthId, (m.get(r.berthId) ?? 0) + 1);
    return m;
  }
  const bookingBerthCounts = countBy(realBookings);
  const bookingBerthWeights = berthRows
    .filter((b) => bookingBerthCounts.has(b.id))
    .map((b) => ({ item: b.id, weight: bookingBerthCounts.get(b.id)! }));

  const vesselCounts = new Map<string, number>();
  for (const b of realBookings) vesselCounts.set(b.vesselId, (vesselCounts.get(b.vesselId) ?? 0) + 1);
  const vesselWeights = vesselRows
    .filter((v) => vesselCounts.has(v.id))
    .map((v) => ({ item: v.id, weight: vesselCounts.get(v.id)! }));

  const durationSamples = realBookings.map((b) => {
    const days = (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000 + 1;
    return Math.round(days);
  });

  const monthWeights: { item: number; weight: number }[] = [];
  const monthCounts = new Array(13).fill(0);
  for (const b of realBookings) monthCounts[Number(b.startDate.slice(5, 7))]++;
  for (let m = 1; m <= 12; m++) monthWeights.push({ item: m, weight: monthCounts[m] || 0.5 });

  const eventBerthCounts = countBy(realEvents);
  const eventBerthWeights = berthRows
    .filter((b) => eventBerthCounts.has(b.id))
    .map((b) => ({ item: b.id, weight: eventBerthCounts.get(b.id)! }));
  const eventNames = [...new Set(realEvents.map((e) => e.name))];

  const closureBerthWeights = bookingBerthWeights; // only one real sample; spread like bookings
  const closureReasons = [
    ...new Set(realClosures.map((c) => c.reason)),
    "Scheduled dock maintenance",
    "Crane access for structural inspection",
  ];

  const AVG_BOOKINGS_PER_YEAR = Math.round((86 + 58) / 2); // 2018 & 2019, the two full real years
  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

  const newBookings: (typeof bookings.$inferInsert)[] = [];
  const newEvents: (typeof events.$inferInsert)[] = [];
  const newClosures: (typeof closures.$inferInsert)[] = [];

  for (const year of YEARS) {
    const targetBookings = Math.round(AVG_BOOKINGS_PER_YEAR * (0.85 + rng() * 0.3));
    let placed = 0;
    let attempts = 0;
    while (placed < targetBookings && attempts < targetBookings * 20) {
      attempts++;
      const month = weightedPick(monthWeights);
      const day = randInt(1, daysInMonth(year, month));
      const duration = bootstrapPick(durationSamples);
      const startDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const endDate = addDays(startDate, duration - 1);
      const berthId = weightedPick(bookingBerthWeights);
      if (!isFree(berthId, startDate, endDate)) continue;
      const vesselId = weightedPick(vesselWeights);
      newBookings.push({
        berthId,
        vesselId,
        startDate,
        endDate,
        createdByStaffId: admin.id,
        notes: "Synthetic entry generated from 2017-2019 historical trends.",
      });
      occupy(berthId, startDate, endDate);
      placed++;
    }

    const targetEvents = randInt(1, 3);
    let eventsPlaced = 0;
    attempts = 0;
    while (eventsPlaced < targetEvents && attempts < 100) {
      attempts++;
      const month = weightedPick(monthWeights);
      const day = randInt(1, daysInMonth(year, month));
      const startDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const berthId = weightedPick(eventBerthWeights);
      if (!isFree(berthId, startDate, startDate)) continue;
      newEvents.push({
        berthId,
        name: bootstrapPick(eventNames),
        startDate,
        endDate: startDate,
        createdByStaffId: admin.id,
        notes: "Synthetic entry generated from 2017-2019 historical trends.",
      });
      occupy(berthId, startDate, startDate);
      eventsPlaced++;
    }

    // Closures were rare historically (1 in 3 real years) — roughly a 1-in-3
    // chance per synthetic year keeps that same density.
    if (rng() < 0.33) {
      attempts = 0;
      while (attempts < 50) {
        attempts++;
        const month = weightedPick(monthWeights);
        const day = randInt(1, daysInMonth(year, month));
        const duration = randInt(1, 2);
        const startDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const endDate = addDays(startDate, duration - 1);
        const berthId = weightedPick(closureBerthWeights);
        if (!isFree(berthId, startDate, endDate)) continue;
        newClosures.push({
          berthId,
          reason: bootstrapPick(closureReasons),
          startDate,
          endDate,
          createdByStaffId: admin.id,
        });
        occupy(berthId, startDate, endDate);
        break;
      }
    }
  }

  if (newBookings.length) await db.insert(bookings).values(newBookings);
  if (newEvents.length) await db.insert(events).values(newEvents);
  if (newClosures.length) await db.insert(closures).values(newClosures);

  console.log(
    JSON.stringify(
      { bookingsInserted: newBookings.length, eventsInserted: newEvents.length, closuresInserted: newClosures.length },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
