"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { updateFitDefaults } from "@/lib/fit-settings";

export type SettingsFormState = { error: string; success?: never } | { success: string; error?: never } | undefined;

export async function updateFitSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await requireAdmin();

  const loaBufferPct = Number(formData.get("loaBufferPct"));
  const beamBufferPct = Number(formData.get("beamBufferPct"));
  const ukcMarginFt = Number(formData.get("ukcMarginFt"));

  if (!Number.isFinite(loaBufferPct) || loaBufferPct < 0 || loaBufferPct >= 100) {
    return { error: "LOA buffer must be a percentage between 0 and 100." };
  }
  if (!Number.isFinite(beamBufferPct) || beamBufferPct < 0 || beamBufferPct >= 100) {
    return { error: "Beam buffer must be a percentage between 0 and 100." };
  }
  if (!Number.isFinite(ukcMarginFt) || ukcMarginFt < 0) {
    return { error: "Under-keel clearance margin must be zero or a positive number of feet." };
  }

  await updateFitDefaults(
    { loaBufferPct: loaBufferPct / 100, beamBufferPct: beamBufferPct / 100, ukcMarginFt },
    admin.id,
  );

  revalidatePath("/settings");
  return { success: "Fit defaults updated." };
}
