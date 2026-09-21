"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { closures } from "@/db/schema";
import { checkBerthConflicts, type ConflictIssue } from "@/lib/berth-conflict";
import { requireStaff } from "@/lib/authz";

export async function checkClosureConflicts(input: {
  berthId: string;
  startDate: string;
  endDate: string;
  excludeClosureId?: string;
}): Promise<ConflictIssue[]> {
  await requireStaff();
  if (!input.berthId || !input.startDate || !input.endDate) return [];
  return checkBerthConflicts({
    berthId: input.berthId,
    startDate: input.startDate,
    endDate: input.endDate,
    excludeSource: input.excludeClosureId
      ? { table: "closures", id: input.excludeClosureId }
      : undefined,
  });
}

function closureFromForm(formData: FormData, staffId: string) {
  return {
    berthId: String(formData.get("berthId")),
    startDate: String(formData.get("startDate")),
    endDate: String(formData.get("endDate")),
    reason: String(formData.get("reason") ?? "").trim(),
    overridden: formData.get("overridden") === "on",
    overrideNote: String(formData.get("overrideNote") ?? "").trim() || null,
    createdByStaffId: staffId,
  };
}

async function validationError(
  closure: ReturnType<typeof closureFromForm>,
  excludeClosureId?: string,
): Promise<string | null> {
  const conflicts = await checkClosureConflicts({
    berthId: closure.berthId,
    startDate: closure.startDate,
    endDate: closure.endDate,
    excludeClosureId,
  });
  if (conflicts.length > 0 && !(closure.overridden && closure.overrideNote)) {
    const messages = conflicts.map((c) => c.message);
    return `${messages.join(" ")} Check "override" and enter a justification to save anyway.`;
  }
  return null;
}

export type ClosureFormState = { error: string } | undefined;

export async function createClosure(
  _prevState: ClosureFormState,
  formData: FormData,
): Promise<ClosureFormState> {
  const user = await requireStaff();
  const closure = closureFromForm(formData, user.id);
  const error = await validationError(closure);
  if (error) return { error };

  await db.insert(closures).values(closure);
  revalidatePath("/closures");
  redirect("/closures");
}

export async function updateClosure(
  id: string,
  _prevState: ClosureFormState,
  formData: FormData,
): Promise<ClosureFormState> {
  const user = await requireStaff();
  const closure = closureFromForm(formData, user.id);
  const error = await validationError(closure, id);
  if (error) return { error };

  const { createdByStaffId: _createdByStaffId, ...rest } = closure;
  await db.update(closures).set(rest).where(eq(closures.id, id));
  revalidatePath("/closures");
  redirect("/closures");
}

export async function cancelClosure(id: string) {
  await requireStaff();
  await db.update(closures).set({ active: false }).where(eq(closures.id, id));
  revalidatePath("/closures");
}
