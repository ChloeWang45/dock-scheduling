import fs from "node:fs";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { berths, bookings, closures, events, users, vessels } from "../src/db/schema";

type RawEntry = {
  year: number;
  month: number;
  start_day: number;
  end_day: number;
  berth: string;
  kind: "booking" | "event" | "closure" | "unknown" | "skip";
  value: string;
};

const DAYS_IN_MONTH = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

function isoDate(year: number, month: number, day: number): string {
  const clamped = Math.min(day, DAYS_IN_MONTH(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
}

const PREFIX_RE = /^(R\/V|OS\/V|OSV|M\/V|S\/V|M\/Y|F\/V|Tug|Barge)\s+(.*)$/i;
const PREFIX_CANONICAL: Record<string, string> = {
  "r/v": "R/V",
  osv: "OSV",
  "os/v": "OSV",
  "m/v": "M/V",
  "s/v": "S/V",
  "m/y": "M/Y",
  "f/v": "F/V",
  tug: "Tug",
  barge: "Barge",
};
const PREFIX_TO_TYPE: Record<string, "R/V" | "OSV" | "F/V" | "M/Y" | "Barge"> = {
  "R/V": "R/V",
  OSV: "OSV",
  "M/V": "OSV",
  "S/V": "M/Y",
  "M/Y": "M/Y",
  "F/V": "F/V",
  Tug: "OSV",
  Barge: "Barge",
};

function normalizeVesselName(raw: string): { name: string; type: "R/V" | "OSV" | "F/V" | "M/Y" | "Barge" } | null {
  const m = raw.trim().match(PREFIX_RE);
  if (!m) return null;
  const canonicalPrefix = PREFIX_CANONICAL[m[1].toLowerCase()];
  const rest = m[2]
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return { name: `${canonicalPrefix} ${rest}`, type: PREFIX_TO_TYPE[canonicalPrefix] };
}

async function main() {
  const raw: Record<string, RawEntry[]> = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "years_2018_2019.json"), "utf8"),
  );

  const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (!admin) throw new Error("No admin user found");

  const berthRows = await db.select().from(berths);
  const berthIdByName = new Map(berthRows.map((b) => [b.name, b.id]));

  let vesselRows = await db.select().from(vessels);
  const vesselIdByLowerName = new Map(vesselRows.map((v) => [v.name.toLowerCase(), v.id]));

  async function getOrCreateVessel(rawName: string): Promise<string | null> {
    const normalized = normalizeVesselName(rawName);
    if (!normalized) return null;
    const key = normalized.name.toLowerCase();
    const existing = vesselIdByLowerName.get(key);
    if (existing) return existing;
    const [created] = await db
      .insert(vessels)
      .values({ name: normalized.name, type: normalized.type })
      .returning({ id: vessels.id });
    vesselIdByLowerName.set(key, created.id);
    vesselRows.push({ ...created, name: normalized.name } as (typeof vesselRows)[number]);
    return created.id;
  }

  const stats = { bookings: 0, events: 0, closures: 0, overridden: 0, newVessels: 0, skipped: 0 };
  const startVesselCount = vesselRows.length;

  for (const year of ["2018", "2019"]) {
    for (const entry of raw[year]) {
      const berthId = berthIdByName.get(entry.berth);
      if (!berthId) {
        console.warn("Unknown berth, skipping:", entry.berth, entry.value);
        continue;
      }
      const startDate = isoDate(entry.year, entry.month, entry.start_day);
      const endDate = isoDate(entry.year, entry.month, entry.end_day);

      if (entry.kind === "booking") {
        const vesselId = await getOrCreateVessel(entry.value);
        if (!vesselId) {
          stats.skipped++;
          continue;
        }
        const base = {
          berthId,
          vesselId,
          startDate,
          endDate,
          createdByStaffId: admin.id,
          notes: `Imported from the ${entry.year} sample year.`,
        };
        try {
          await db.insert(bookings).values(base);
          stats.bookings++;
        } catch {
          await db.insert(bookings).values({
            ...base,
            overridden: true,
            overrideNote:
              "Historical record: preserved as-is from the source spreadsheet despite overlapping another entry on this berth.",
          });
          stats.bookings++;
          stats.overridden++;
        }
      } else if (entry.kind === "event") {
        const base = {
          berthId,
          name: entry.value,
          startDate,
          endDate,
          createdByStaffId: admin.id,
          notes: `Imported from the ${entry.year} sample year.`,
        };
        try {
          await db.insert(events).values(base);
          stats.events++;
        } catch {
          await db.insert(events).values({
            ...base,
            overridden: true,
            overrideNote:
              "Historical record: preserved as-is from the source spreadsheet despite overlapping another entry on this berth.",
          });
          stats.events++;
          stats.overridden++;
        }
      } else if (entry.kind === "closure") {
        const base = {
          berthId,
          reason: entry.value,
          startDate,
          endDate,
          createdByStaffId: admin.id,
        };
        try {
          await db.insert(closures).values(base);
          stats.closures++;
        } catch {
          await db.insert(closures).values({
            ...base,
            overridden: true,
            overrideNote:
              "Historical record: preserved as-is from the source spreadsheet despite overlapping another entry on this berth.",
          });
          stats.closures++;
          stats.overridden++;
        }
      } else {
        stats.skipped++;
      }
    }
  }

  stats.newVessels = vesselRows.length - startVesselCount;
  console.log(JSON.stringify(stats, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
