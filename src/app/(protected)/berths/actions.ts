"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { berths } from "@/db/schema";
import { requireStaff } from "@/lib/authz";

function toNullableNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullablePercent(value: FormDataEntryValue | null): number | null {
  const parsed = toNullableNumber(value);
  return parsed === null ? null : parsed / 100;
}

function berthFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    lengthFt: toNullableNumber(formData.get("lengthFt")),
    depthAtLowTideFt: toNullableNumber(formData.get("depthAtLowTideFt")),
    widthFt: toNullableNumber(formData.get("widthFt")),
    maxSimultaneousOccupants:
      Number(formData.get("maxSimultaneousOccupants")) || 1,
    loaBufferPct: toNullablePercent(formData.get("loaBufferPct")),
    beamBufferPct: toNullablePercent(formData.get("beamBufferPct")),
    ukcMarginFt: toNullableNumber(formData.get("ukcMarginFt")),
  };
}

export async function createBerth(formData: FormData) {
  await requireStaff();
  await db.insert(berths).values(berthFromForm(formData));
  revalidatePath("/berths");
  redirect("/berths");
}

export async function updateBerth(id: string, formData: FormData) {
  await requireStaff();
  await db.update(berths).set(berthFromForm(formData)).where(eq(berths.id, id));
  revalidatePath("/berths");
  redirect("/berths");
}

export async function setBerthActive(id: string, active: boolean) {
  await requireStaff();
  await db.update(berths).set({ active }).where(eq(berths.id, id));
  revalidatePath("/berths");
}
