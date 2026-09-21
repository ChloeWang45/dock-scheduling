"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";

type Role = "admin" | "staff" | "viewer";

function parseRole(value: FormDataEntryValue | null): Role {
  const role = String(value);
  if (role === "admin" || role === "staff" || role === "viewer") return role;
  return "viewer";
}

export async function approveUser(id: string, formData: FormData) {
  await requireAdmin();
  const role = parseRole(formData.get("role"));
  await db.update(users).set({ status: "approved", role }).where(eq(users.id, id));
  revalidatePath("/admin/users");
}

export async function denyUser(id: string) {
  await requireAdmin();
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
}

export async function changeUserRole(id: string, formData: FormData) {
  const admin = await requireAdmin();
  if (id === admin.id) return; // can't change your own role here
  const role = parseRole(formData.get("role"));
  await db.update(users).set({ role }).where(eq(users.id, id));
  revalidatePath("/admin/users");
}
