"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { events } from "@/db/schema";
import { checkBerthConflicts, type ConflictIssue } from "@/lib/berth-conflict";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function checkEventConflicts(input: {
  berthId: string;
  startDate: string;
  endDate: string;
  excludeEventId?: string;
}): Promise<ConflictIssue[]> {
  await requireUser();
  if (!input.berthId || !input.startDate || !input.endDate) return [];
  return checkBerthConflicts({
    berthId: input.berthId,
    startDate: input.startDate,
    endDate: input.endDate,
    excludeSource: input.excludeEventId ? { table: "events", id: input.excludeEventId } : undefined,
  });
}

function eventFromForm(formData: FormData, staffId: string) {
  return {
    berthId: String(formData.get("berthId")),
    name: String(formData.get("name") ?? "").trim(),
    startDate: String(formData.get("startDate")),
    endDate: String(formData.get("endDate")),
    startTime: String(formData.get("startTime") ?? "") || null,
    endTime: String(formData.get("endTime") ?? "") || null,
    organizer: String(formData.get("organizer") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    overridden: formData.get("overridden") === "on",
    overrideNote: String(formData.get("overrideNote") ?? "").trim() || null,
    createdByStaffId: staffId,
  };
}

async function validationError(
  event: ReturnType<typeof eventFromForm>,
  excludeEventId?: string,
): Promise<string | null> {
  const conflicts = await checkEventConflicts({
    berthId: event.berthId,
    startDate: event.startDate,
    endDate: event.endDate,
    excludeEventId,
  });
  if (conflicts.length > 0 && !(event.overridden && event.overrideNote)) {
    const messages = conflicts.map((c) => c.message);
    return `${messages.join(" ")} Check "override" and enter a justification to save anyway.`;
  }
  return null;
}

export type EventFormState = { error: string } | undefined;

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await requireUser();
  const event = eventFromForm(formData, user.id);
  const error = await validationError(event);
  if (error) return { error };

  await db.insert(events).values(event);
  revalidatePath("/events");
  redirect("/events");
}

export async function updateEvent(
  id: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await requireUser();
  const event = eventFromForm(formData, user.id);
  const error = await validationError(event, id);
  if (error) return { error };

  const { createdByStaffId: _createdByStaffId, ...rest } = event;
  await db.update(events).set(rest).where(eq(events.id, id));
  revalidatePath("/events");
  redirect("/events");
}

export async function cancelEvent(id: string) {
  await requireUser();
  await db.update(events).set({ active: false }).where(eq(events.id, id));
  revalidatePath("/events");
}
