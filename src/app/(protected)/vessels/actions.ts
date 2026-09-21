"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vessels, vesselType } from "@/db/schema";
import { requireStaff } from "@/lib/authz";

type VesselType = (typeof vesselType.enumValues)[number];

function toNullableNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableText(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function vesselFromForm(formData: FormData) {
  const type = String(formData.get("type")) as VesselType;
  if (!vesselType.enumValues.includes(type)) {
    throw new Error(`Invalid vessel type: ${type}`);
  }
  return {
    name: String(formData.get("name") ?? "").trim(),
    type,
    loaFt: toNullableNumber(formData.get("loaFt")),
    draftFt: toNullableNumber(formData.get("draftFt")),
    beamFt: toNullableNumber(formData.get("beamFt")),
    operator: toNullableText(formData.get("operator")),
    contactPhone: toNullableText(formData.get("contactPhone")),
    contactEmail: toNullableText(formData.get("contactEmail")),
  };
}

export async function createVessel(formData: FormData) {
  await requireStaff();
  await db.insert(vessels).values(vesselFromForm(formData));
  revalidatePath("/vessels");
  redirect("/vessels");
}

export async function updateVessel(id: string, formData: FormData) {
  await requireStaff();
  await db.update(vessels).set(vesselFromForm(formData)).where(eq(vessels.id, id));
  revalidatePath("/vessels");
  redirect("/vessels");
}

export async function setVesselActive(id: string, active: boolean) {
  await requireStaff();
  await db.update(vessels).set({ active }).where(eq(vessels.id, id));
  revalidatePath("/vessels");
}
