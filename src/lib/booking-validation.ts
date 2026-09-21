import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, vessels } from "@/db/schema";

const DEFAULT_LOA_BUFFER = 0.15;
const DEFAULT_BEAM_BUFFER = 0.15;
const DEFAULT_UKC_MARGIN_FT = 1;

type Berth = typeof berths.$inferSelect;
type Vessel = typeof vessels.$inferSelect;

export type FitIssue = {
  field: "loa" | "draft" | "beam";
  status: "violation" | "unverified";
  message: string;
};

export type ConflictIssue = {
  type: "overlap" | "capacity";
  message: string;
};

export function checkFit(vessel: Vessel, berth: Berth): FitIssue[] {
  const issues: FitIssue[] = [];
  const loaBuffer = berth.loaBufferPct ?? DEFAULT_LOA_BUFFER;
  const beamBuffer = berth.beamBufferPct ?? DEFAULT_BEAM_BUFFER;
  const ukcMargin = berth.ukcMarginFt ?? DEFAULT_UKC_MARGIN_FT;

  if (vessel.loaFt == null || berth.lengthFt == null) {
    issues.push({
      field: "loa",
      status: "unverified",
      message: "LOA not verified: vessel or berth length is missing.",
    });
  } else {
    const maxLoa = berth.lengthFt * (1 - loaBuffer);
    if (vessel.loaFt > maxLoa) {
      issues.push({
        field: "loa",
        status: "violation",
        message: `Vessel LOA (${vessel.loaFt} ft) exceeds berth capacity of ${maxLoa.toFixed(1)} ft (${berth.lengthFt} ft berth, ${(loaBuffer * 100).toFixed(0)}% buffer).`,
      });
    }
  }

  if (vessel.draftFt == null || berth.depthAtLowTideFt == null) {
    issues.push({
      field: "draft",
      status: "unverified",
      message: "Draft not verified: vessel draft or berth depth at low tide is missing.",
    });
  } else {
    const required = vessel.draftFt + ukcMargin;
    if (required > berth.depthAtLowTideFt) {
      issues.push({
        field: "draft",
        status: "violation",
        message: `Vessel draft (${vessel.draftFt} ft) plus ${ukcMargin} ft under-keel clearance exceeds berth depth at low tide (${berth.depthAtLowTideFt} ft).`,
      });
    }
  }

  // Beam is only checked where the berth's width is actually on file.
  if (berth.widthFt != null) {
    if (vessel.beamFt == null) {
      issues.push({
        field: "beam",
        status: "unverified",
        message: "Beam not verified: vessel beam is missing.",
      });
    } else {
      const maxBeam = berth.widthFt * (1 - beamBuffer);
      if (vessel.beamFt > maxBeam) {
        issues.push({
          field: "beam",
          status: "violation",
          message: `Vessel beam (${vessel.beamFt} ft) exceeds berth capacity of ${maxBeam.toFixed(1)} ft (${berth.widthFt} ft berth, ${(beamBuffer * 100).toFixed(0)}% buffer).`,
        });
      }
    }
  }

  return issues;
}

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
    let count = 1; // the candidate booking itself
    for (const range of existingRanges) {
      if (range.start <= d && d <= range.end) count++;
    }
    if (count > peak) peak = count;
  }
  return peak;
}

export async function checkOverlap(params: {
  berthId: string;
  startDate: string;
  endDate: string;
  excludeBookingId?: string;
}): Promise<ConflictIssue[]> {
  const [berth] = await db.select().from(berths).where(eq(berths.id, params.berthId)).limit(1);
  if (!berth) return [];

  const overlapping = await db
    .select({
      id: bookings.id,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      vesselId: bookings.vesselId,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.berthId, params.berthId),
        ne(bookings.status, "cancelled"),
        params.excludeBookingId ? ne(bookings.id, params.excludeBookingId) : undefined,
        sql`daterange(${bookings.startDate}, ${bookings.endDate}, '[]') && daterange(${params.startDate}::date, ${params.endDate}::date, '[]')`,
      ),
    );

  if (overlapping.length === 0) return [];

  if (berth.maxSimultaneousOccupants <= 1) {
    const vesselIds = [...new Set(overlapping.map((o) => o.vesselId))];
    const vesselRows = await db
      .select({ id: vessels.id, name: vessels.name })
      .from(vessels)
      .where(inArray(vessels.id, vesselIds));
    const nameById = new Map(vesselRows.map((v) => [v.id, v.name]));

    return overlapping.map((o) => ({
      type: "overlap" as const,
      message: `Overlaps ${nameById.get(o.vesselId) ?? "another booking"} from ${o.startDate} to ${o.endDate}.`,
    }));
  }

  const projectedPeak = peakConcurrentOccupancy(params.startDate, params.endDate, overlapping);
  if (projectedPeak > berth.maxSimultaneousOccupants) {
    return [
      {
        type: "capacity",
        message: `Berth capacity is ${berth.maxSimultaneousOccupants}; this booking would bring peak occupancy to ${projectedPeak} on at least one day in range.`,
      },
    ];
  }
  return [];
}
