import { and, eq, not, sql } from "drizzle-orm";
import { db } from "@/db";
import { berths, berthOccupancyLedger, bookings, closures, events, vessels } from "@/db/schema";

export type ConflictIssue = {
  type: "overlap" | "capacity" | "closure";
  message: string;
};

type LedgerSourceTable = "bookings" | "events" | "closures";

function peakConcurrentOccupancy(
  candidateStart: string,
  candidateEnd: string,
  existing: { startDate: string; endDate: string }[],
): number {
  const start = new Date(candidateStart + "T00:00:00Z");
  const end = new Date(candidateEnd + "T00:00:00Z");
  const existingRanges = existing.map((b) => ({
    start: new Date(b.startDate + "T00:00:00Z"),
    end: new Date(b.endDate + "T00:00:00Z"),
  }));

  let peak = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    let count = 1; // the candidate entry itself
    for (const range of existingRanges) {
      if (range.start <= d && d <= range.end) count++;
    }
    if (count > peak) peak = count;
  }
  return peak;
}

async function describeSource(sourceTable: LedgerSourceTable, sourceId: string): Promise<string> {
  if (sourceTable === "bookings") {
    const [row] = await db
      .select({ name: vessels.name })
      .from(bookings)
      .innerJoin(vessels, eq(vessels.id, bookings.vesselId))
      .where(eq(bookings.id, sourceId))
      .limit(1);
    return row ? `${row.name} (booking)` : "another booking";
  }
  if (sourceTable === "events") {
    const [row] = await db.select({ name: events.name }).from(events).where(eq(events.id, sourceId)).limit(1);
    return row ? `${row.name} (event)` : "another event";
  }
  const [row] = await db.select({ reason: closures.reason }).from(closures).where(eq(closures.id, sourceId)).limit(1);
  return row ? `closure: ${row.reason}` : "a closure";
}

/**
 * Checks a candidate Booking, Event, or Closure against everything else
 * currently occupying the berth, via the shared occupancy ledger (kept in
 * sync by DB triggers — see drizzle/0005_add_occupancy_ledger_triggers.sql).
 * This mirrors the same rules the ledger's exclusion constraints enforce at
 * the database level, so the UI can warn before save instead of only after
 * a failed insert.
 */
export async function checkBerthConflicts(params: {
  berthId: string;
  startDate: string;
  endDate: string;
  excludeSource?: { table: LedgerSourceTable; id: string };
}): Promise<ConflictIssue[]> {
  const [berth] = await db.select().from(berths).where(eq(berths.id, params.berthId)).limit(1);
  if (!berth) return [];

  const overlapping = await db
    .select()
    .from(berthOccupancyLedger)
    .where(
      and(
        eq(berthOccupancyLedger.berthId, params.berthId),
        params.excludeSource
          ? not(
              and(
                eq(berthOccupancyLedger.sourceTable, params.excludeSource.table),
                eq(berthOccupancyLedger.sourceId, params.excludeSource.id),
              )!,
            )
          : undefined,
        sql`daterange(${berthOccupancyLedger.startDate}, ${berthOccupancyLedger.endDate}, '[]') && daterange(${params.startDate}::date, ${params.endDate}::date, '[]')`,
      ),
    );

  if (overlapping.length === 0) return [];

  const closureRows = overlapping.filter((o) => o.isClosure);
  const occupantRows = overlapping.filter((o) => !o.isClosure);
  const issues: ConflictIssue[] = [];

  // A closure always blocks, on any berth, regardless of capacity.
  for (const c of closureRows) {
    const label = await describeSource(c.sourceTable, c.sourceId);
    issues.push({
      type: "closure",
      message: `Berth is closed (${c.startDate} to ${c.endDate}): ${label}.`,
    });
  }

  if (berth.maxSimultaneousOccupants <= 1) {
    for (const o of occupantRows) {
      const label = await describeSource(o.sourceTable, o.sourceId);
      issues.push({
        type: "overlap",
        message: `Overlaps ${label} from ${o.startDate} to ${o.endDate}.`,
      });
    }
  } else if (occupantRows.length > 0) {
    const projectedPeak = peakConcurrentOccupancy(params.startDate, params.endDate, occupantRows);
    if (projectedPeak > berth.maxSimultaneousOccupants) {
      issues.push({
        type: "capacity",
        message: `Berth capacity is ${berth.maxSimultaneousOccupants}; this would bring peak occupancy to ${projectedPeak} on at least one day in range.`,
      });
    }
  }

  return issues;
}
