import { sql } from "drizzle-orm";
import { db } from "@/db";
import { berths } from "@/db/schema";

export type UsageReport = {
  years: number[];
  berths: { id: string; name: string; active: boolean }[];
  // days[berthId][year] = number of distinct days that berth was occupied
  // by an active booking, event, or closure that year.
  days: Record<string, Record<number, number>>;
  totalsByYear: Record<number, number>;
};

/**
 * Occupied-days-per-berth-per-year, the same metric the source
 * spreadsheet's "8YR Dock Summary" tab hand-tallied. A day counts once
 * regardless of how many overlapping bookings/events/closures cover it
 * (matches counting non-empty cells on the original grid, which didn't
 * distinguish entry type) — computed via generate_series + COUNT(DISTINCT)
 * rather than summing range lengths, specifically so overlapping entries
 * (e.g. a closure logged on a day already covered by a booking) aren't
 * double-counted.
 */
export async function getUsageReport(): Promise<UsageReport> {
  const allBerths = await db
    .select({ id: berths.id, name: berths.name, active: berths.active })
    .from(berths)
    .orderBy(berths.name);

  const rows = await db.execute<{ berth_id: string; year: number; occupied_days: number }>(sql`
    SELECT berth_id, EXTRACT(YEAR FROM day)::int AS year, COUNT(DISTINCT day)::int AS occupied_days
    FROM (
      SELECT berth_id, generate_series(start_date, end_date, interval '1 day')::date AS day
      FROM bookings
      WHERE status <> 'cancelled'
      UNION ALL
      SELECT berth_id, generate_series(start_date, end_date, interval '1 day')::date AS day
      FROM events
      WHERE active
      UNION ALL
      SELECT berth_id, generate_series(start_date, end_date, interval '1 day')::date AS day
      FROM closures
      WHERE active
    ) occupied
    GROUP BY berth_id, EXTRACT(YEAR FROM day)
    ORDER BY year
  `);

  const days: UsageReport["days"] = {};
  const yearSet = new Set<number>();
  for (const berth of allBerths) days[berth.id] = {};

  for (const row of rows.rows) {
    const berthId = row.berth_id;
    const year = Number(row.year);
    const occupiedDays = Number(row.occupied_days);
    yearSet.add(year);
    if (!days[berthId]) days[berthId] = {};
    days[berthId][year] = occupiedDays;
  }

  const years = [...yearSet].sort((a, b) => a - b);
  const totalsByYear: Record<number, number> = {};
  for (const year of years) {
    totalsByYear[year] = allBerths.reduce((sum, b) => sum + (days[b.id]?.[year] ?? 0), 0);
  }

  return { years, berths: allBerths, days, totalsByYear };
}
