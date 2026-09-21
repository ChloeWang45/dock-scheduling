import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  bookings,
  closures,
  events,
  recurrenceSeries,
  users,
  vessels,
  berths,
} from "../src/db/schema";
import { generateOccurrences, type RecurrenceRule } from "../src/lib/recurrence";

async function main() {
  const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (!admin) throw new Error("No admin user found");

  const berthRows = await db.select().from(berths);
  const berthId = (name: string) => {
    const b = berthRows.find((b) => b.name === name);
    if (!b) throw new Error(`Berth not found: ${name}`);
    return b.id;
  };

  console.log("Clearing existing bookings, events, closures...");
  await db.delete(bookings);
  await db.delete(events);
  await db.delete(closures);
  await db.delete(recurrenceSeries);

  console.log("Seeding historical reference vessels (from the 2017 sample year)...");
  const historicalVessels = [
    { name: "OSV Amber Reef", type: "OSV" as const },
    { name: "R/V Silver Petrel", type: "R/V" as const },
    { name: "M/V High Cove", type: "OSV" as const },
    { name: "R/V Golden Compass", type: "R/V" as const },
    { name: "R/V Long Ketch", type: "R/V" as const },
    { name: "Tug Golden Sound", type: "OSV" as const },
    { name: "S/V Swift Beacon", type: "M/Y" as const },
    { name: "M/Y Swift Drift", type: "M/Y" as const },
    { name: "R/V Blue Star", type: "R/V" as const },
    { name: "OSV Silver Gannet", type: "OSV" as const },
  ];
  for (const v of historicalVessels) {
    await db.insert(vessels).values(v).onConflictDoNothing();
  }
  const vesselRows = await db.select().from(vessels);
  const vesselId = (name: string) => {
    const v = vesselRows.find((v) => v.name === name);
    if (!v) throw new Error(`Vessel not found: ${name}`);
    return v.id;
  };

  console.log("Inserting historical bookings (real 2017 dates from the sample)...");
  const historicalBookings = [
    // South Float East, July 2017 — includes the documented conflict:
    // OSV Amber Reef's Jul 9-18 stay overlaps a closure logged on Jul 11.
    { vessel: "OSV Amber Reef", berth: "South Float East", start: "2017-07-01", end: "2017-07-02" },
    { vessel: "OSV Amber Reef", berth: "South Float East", start: "2017-07-09", end: "2017-07-18" },
    { vessel: "S/V Swift Beacon", berth: "South Float East", start: "2017-07-22", end: "2017-07-24" },
    { vessel: "OSV Amber Reef", berth: "South Float East", start: "2017-07-26", end: "2017-07-31" },
    { vessel: "R/V Blue Star", berth: "South Float East", start: "2017-09-07", end: "2017-09-07" },

    { vessel: "R/V Golden Compass", berth: "North Pier West", start: "2017-07-02", end: "2017-07-08" },
    { vessel: "R/V Golden Compass", berth: "North Pier West", start: "2017-07-24", end: "2017-07-25" },
    { vessel: "R/V Golden Compass", berth: "North Pier West", start: "2017-09-01", end: "2017-09-07" },
    { vessel: "R/V Golden Compass", berth: "North Pier West", start: "2017-09-22", end: "2017-09-23" },

    { vessel: "Tug Golden Sound", berth: "North Pier East", start: "2017-07-23", end: "2017-07-25" },
    { vessel: "Tug Golden Sound", berth: "North Pier East", start: "2017-09-18", end: "2017-09-21" },
    { vessel: "OSV Silver Gannet", berth: "North Pier East", start: "2017-09-29", end: "2017-09-29" },

    { vessel: "R/V Long Ketch", berth: "South Float West", start: "2017-07-02", end: "2017-07-03" },
    { vessel: "R/V Long Ketch", berth: "South Float West", start: "2017-07-14", end: "2017-07-15" },
    { vessel: "M/Y Swift Drift", berth: "South Float West", start: "2017-09-13", end: "2017-09-13" },
    { vessel: "R/V Long Ketch", berth: "South Float West", start: "2017-09-14", end: "2017-09-15" },
    { vessel: "R/V Long Ketch", berth: "South Float West", start: "2017-09-24", end: "2017-09-25" },

    // Small craft slips, September 2017 — the documented ambiguous
    // double-booking: two vessels on the same row-label, overlapping.
    { vessel: "M/V High Cove", berth: "Small craft slips (institution boats)", start: "2017-09-04", end: "2017-09-08" },
  ];
  for (const b of historicalBookings) {
    await db.insert(bookings).values({
      berthId: berthId(b.berth),
      vesselId: vesselId(b.vessel),
      startDate: b.start,
      endDate: b.end,
      createdByStaffId: admin.id,
      notes: "Imported from the 2017 sample year.",
    });
  }
  // R/V Silver Petrel overlaps M/V High Cove above — preserved as a logged,
  // overridden historical record rather than silently dropped or altered.
  await db.insert(bookings).values({
    berthId: berthId("Small craft slips (institution boats)"),
    vesselId: vesselId("R/V Silver Petrel"),
    startDate: "2017-09-01",
    endDate: "2017-09-10",
    createdByStaffId: admin.id,
    notes: "Imported from the 2017 sample year.",
    overridden: true,
    overrideNote:
      "Historical record: the source spreadsheet listed both R/V Silver Petrel and M/V High Cove under the single 'Small craft slips' row label for overlapping days. Whether this reflects two separate physical slips or a genuine double-booking is unknown from the sample; preserved as-is rather than altering the historical record.",
  });

  console.log("Inserting the historical closure (the documented South Float East conflict)...");
  await db.insert(closures).values({
    berthId: berthId("South Float East"),
    startDate: "2017-07-11",
    endDate: "2017-07-11",
    reason: "Utility work on pier face",
    createdByStaffId: admin.id,
    overridden: true,
    overrideNote:
      "Historical record: the source spreadsheet logged this utility work alongside OSV Amber Reef's Jul 9-18 stay on the same berth, with no indication the conflict was ever resolved. Preserved as an overridden entry rather than altering the historical record — this is the exact double-booking scenario the new system is designed to catch going forward.",
  });

  console.log("Inserting historical events...");
  const historicalEvents = [
    {
      name: "Safety training (RIBs)",
      berth: "Small craft slips (institution boats)",
      start: "2017-07-09",
      end: "2017-07-09",
      organizer: null as string | null,
    },
    {
      name: "Student tour",
      berth: "Small craft slips (institution boats)",
      start: "2017-07-11",
      end: "2017-07-11",
      organizer: null,
    },
    {
      name: "Donor reception",
      berth: "North Finger Piers",
      start: "2017-09-11",
      end: "2017-09-11",
      organizer: "WHOI Development Office",
    },
    {
      name: "Community sail day",
      berth: "Small craft slips (institution boats)",
      start: "2017-09-17",
      end: "2017-09-17",
      organizer: "Harbor Community Program",
    },
  ];
  for (const e of historicalEvents) {
    await db.insert(events).values({
      berthId: berthId(e.berth),
      name: e.name,
      startDate: e.start,
      endDate: e.end,
      organizer: e.organizer,
      createdByStaffId: admin.id,
      notes: "Imported from the 2017 sample year.",
    });
  }

  console.log("Creating forward-looking recurring series (inspired by real recurring patterns)...");

  async function createSeries<T extends { berthId: string; [k: string]: unknown }>(
    table: typeof bookings | typeof events | typeof closures,
    rule: RecurrenceRule,
    firstStart: string,
    firstEnd: string,
    fields: Record<string, unknown>,
  ) {
    const occurrences = generateOccurrences(firstStart, firstEnd, rule);
    const [series] = await db
      .insert(recurrenceSeries)
      .values({
        frequency: rule.frequency,
        interval: rule.interval,
        endDate: rule.endType === "date" ? rule.endDate : null,
        endCount: rule.endType === "count" ? rule.endCount : null,
        createdByStaffId: admin.id,
      })
      .returning({ id: recurrenceSeries.id });

    const queries = occurrences.map((occ) =>
      // @ts-expect-error -- shared helper across differently-shaped tables
      db.insert(table).values({
        ...fields,
        startDate: occ.startDate,
        endDate: occ.endDate,
        seriesId: series.id,
      }),
    );
    const [first, ...rest] = queries;
    // @ts-expect-error -- batch needs a non-empty tuple; occurrences.length >= 1
    await db.batch([first, ...rest]);
    return occurrences.length;
  }

  // R/V Long Ketch was the single most frequent visitor in the 2017 sample
  // (South Float West, dozens of stays across the year) — modeled going
  // forward as a recurring booking rather than one-off historical entries.
  const n1 = await createSeries(
    bookings,
    { frequency: "monthly", interval: 1, endType: "count", endCount: 6 },
    "2026-10-05",
    "2026-10-06",
    {
      berthId: berthId("South Float West"),
      vesselId: vesselId("R/V Long Ketch"),
      createdByStaffId: admin.id,
      notes: "Recurring booking, matching this vessel's frequent-visitor pattern in the historical record.",
    },
  );
  console.log(`  R/V Long Ketch recurring booking: ${n1} occurrences`);

  const n2 = await createSeries(
    events,
    { frequency: "monthly", interval: 1, endType: "count", endCount: 6 },
    "2026-10-17",
    "2026-10-17",
    {
      berthId: berthId("Small craft slips (institution boats)"),
      name: "Community sail day",
      organizer: "Harbor Community Program",
      createdByStaffId: admin.id,
      notes: "Recurring monthly, per the plan's own canonical recurring-event example.",
    },
  );
  console.log(`  Community sail day recurring event: ${n2} occurrences`);

  const n3 = await createSeries(
    closures,
    { frequency: "monthly", interval: 1, endType: "count", endCount: 6 },
    "2026-10-06",
    "2026-10-06",
    {
      berthId: berthId("North Pier East"),
      reason: "Dock maintenance - restricted access",
      createdByStaffId: admin.id,
    },
  );
  console.log(`  Dock maintenance recurring closure: ${n3} occurrences`);

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
