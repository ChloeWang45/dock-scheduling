"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { berths } from "@/db/schema";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
}

function toNullableNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function berthFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    lengthFt: toNullableNumber(formData.get("lengthFt")),
    depthAtLowTideFt: toNullableNumber(formData.get("depthAtLowTideFt")),
    widthFt: toNullableNumber(formData.get("widthFt")),
    maxSimultaneousOccupants:
      Number(formData.get("maxSimultaneousOccupants")) || 1,
  };
}

export async function createBerth(formData: FormData) {
  await requireUser();
  await db.insert(berths).values(berthFromForm(formData));
  revalidatePath("/berths");
  redirect("/berths");
}

export async function updateBerth(id: string, formData: FormData) {
  await requireUser();
  await db.update(berths).set(berthFromForm(formData)).where(eq(berths.id, id));
  revalidatePath("/berths");
  redirect("/berths");
}

export async function setBerthActive(id: string, active: boolean) {
  await requireUser();
  await db.update(berths).set({ active }).where(eq(berths.id, id));
  revalidatePath("/berths");
}
