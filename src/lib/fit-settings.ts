import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fitSettings } from "@/db/schema";

const SINGLETON_ID = "global";

export type FitDefaults = {
  loaBufferPct: number;
  beamBufferPct: number;
  ukcMarginFt: number;
};

// Matches the historical hardcoded defaults, so a facility that's never
// touched /settings sees no behavior change.
export const HARD_CODED_FIT_DEFAULTS: FitDefaults = {
  loaBufferPct: 0.15,
  beamBufferPct: 0.15,
  ukcMarginFt: 1,
};

export async function getFitDefaults(): Promise<FitDefaults> {
  const [row] = await db.select().from(fitSettings).where(eq(fitSettings.id, SINGLETON_ID)).limit(1);
  if (!row) return HARD_CODED_FIT_DEFAULTS;
  return {
    loaBufferPct: row.loaBufferPct,
    beamBufferPct: row.beamBufferPct,
    ukcMarginFt: row.ukcMarginFt,
  };
}

export async function updateFitDefaults(values: FitDefaults, updatedByStaffId: string): Promise<void> {
  await db
    .insert(fitSettings)
    .values({ id: SINGLETON_ID, ...values, updatedByStaffId })
    .onConflictDoUpdate({
      target: fitSettings.id,
      set: { ...values, updatedByStaffId, updatedAt: new Date() },
    });
}
