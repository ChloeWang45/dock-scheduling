"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { events, recurrenceSeries } from "@/db/schema";
import { checkBerthConflicts, type ConflictIssue } from "@/lib/berth-conflict";
import { requireStaff } from "@/lib/authz";
import { generateOccurrences, type RecurrenceRule } from "@/lib/recurrence";

export async function checkEventConflicts(input: {
  berthId: string;
  startDate: string;
  endDate: string;
  excludeEventId?: string;
}): Promise<ConflictIssue[]> {
  await requireStaff();
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

function recurrenceRuleFromForm(formData: FormData): RecurrenceRule | null {
  const frequency = String(formData.get("frequency") ?? "");
  if (frequency !== "daily" && frequency !== "weekly" && frequency !== "monthly") return null;
  const interval = Math.max(1, Number(formData.get("interval")) || 1);
  const endType = String(formData.get("endType") ?? "count");

  if (endType === "date") {
    const endDate = String(formData.get("endDate") ?? "");
    if (!endDate) return null;
    return { frequency, interval, endType: "date", endDate };
  }
  const endCount = Math.max(1, Number(formData.get("endCount")) || 1);
  return { frequency, interval, endType: "count", endCount };
}

async function issuesFor(
  berthId: string,
  startDate: string,
  endDate: string,
  excludeEventId?: string,
): Promise<string[]> {
  const conflicts = await checkEventConflicts({ berthId, startDate, endDate, excludeEventId });
  return conflicts.map((c) => c.message);
}

async function issuesForExcludingSeries(
  berthId: string,
  startDate: string,
  endDate: string,
  excludeEventIds: string[],
): Promise<string[]> {
  const conflicts = await checkBerthConflicts({
    berthId,
    startDate,
    endDate,
    excludeSourceIds: { table: "events", ids: excludeEventIds },
  });
  return conflicts.map((c) => c.message);
}

export type EventFormState = { error: string } | undefined;

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await requireStaff();
  const event = eventFromForm(formData, user.id);
  const repeats = formData.get("repeats") === "on";

  if (!repeats) {
    const issues = await issuesFor(event.berthId, event.startDate, event.endDate);
    if (issues.length > 0 && !(event.overridden && event.overrideNote)) {
      return { error: `${issues.join(" ")} Check "override" and enter a justification to save anyway.` };
    }
    await db.insert(events).values(event);
    revalidatePath("/schedule");
    redirect("/schedule");
  }

  const rule = recurrenceRuleFromForm(formData);
  if (!rule) return { error: "Invalid recurrence settings." };

  const occurrences = generateOccurrences(event.startDate, event.endDate, rule);
  if (occurrences.length === 0) {
    return { error: "That recurrence produces no occurrences — check the end condition." };
  }

  const allIssues: string[] = [];
  for (const occ of occurrences) {
    const issues = await issuesFor(event.berthId, occ.startDate, occ.endDate);
    if (issues.length > 0) allIssues.push(`${occ.startDate}: ${issues.join(" ")}`);
  }

  if (allIssues.length > 0 && !(event.overridden && event.overrideNote)) {
    const preview = allIssues.slice(0, 3).join(" | ");
    return {
      error: `${allIssues.length} of ${occurrences.length} occurrences have issues: ${preview}${
        allIssues.length > 3 ? " …" : ""
      } Check "override" and enter a justification to save the whole series anyway.`,
    };
  }

  const [series] = await db
    .insert(recurrenceSeries)
    .values({
      frequency: rule.frequency,
      interval: rule.interval,
      endDate: rule.endType === "date" ? rule.endDate : null,
      endCount: rule.endType === "count" ? rule.endCount : null,
      createdByStaffId: user.id,
    })
    .returning({ id: recurrenceSeries.id });

  const [firstQuery, ...restQueries] = occurrences.map((occ) =>
    db.insert(events).values({
      ...event,
      startDate: occ.startDate,
      endDate: occ.endDate,
      seriesId: series.id,
    }),
  );

  try {
    await db.batch([firstQuery, ...restQueries]);
  } catch {
    await db.delete(recurrenceSeries).where(eq(recurrenceSeries.id, series.id));
    return {
      error: "Could not create the series: two or more occurrences would overlap each other. Try a longer interval or a shorter duration.",
    };
  }

  revalidatePath("/schedule");
  redirect("/schedule");
}

export async function updateEvent(
  id: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await requireStaff();
  const event = eventFromForm(formData, user.id);
  const scope = String(formData.get("scope") ?? "this");

  if (scope === "following") {
    const [current] = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (current?.seriesId) {
      const rule = recurrenceRuleFromForm(formData);
      if (!rule) return { error: "Invalid recurrence settings." };

      const occurrences = generateOccurrences(event.startDate, event.endDate, rule);
      if (occurrences.length === 0) {
        return { error: "That recurrence produces no occurrences — check the end condition." };
      }

      const seriesEventIds = (
        await db.select({ id: events.id }).from(events).where(eq(events.seriesId, current.seriesId))
      ).map((r) => r.id);

      const allIssues: string[] = [];
      for (const occ of occurrences) {
        const issues = await issuesForExcludingSeries(
          event.berthId,
          occ.startDate,
          occ.endDate,
          seriesEventIds,
        );
        if (issues.length > 0) allIssues.push(`${occ.startDate}: ${issues.join(" ")}`);
      }
      if (allIssues.length > 0 && !(event.overridden && event.overrideNote)) {
        const preview = allIssues.slice(0, 3).join(" | ");
        return {
          error: `${allIssues.length} of ${occurrences.length} occurrences have issues: ${preview}${
            allIssues.length > 3 ? " …" : ""
          } Check "override" and enter a justification to save the whole series anyway.`,
        };
      }

      const { startDate: _sd, endDate: _ed, ...fieldsNoDate } = event;
      // Preserve the series' original creator rather than the editor.
      fieldsNoDate.createdByStaffId = current.createdByStaffId;

      const deleteOld = db
        .delete(events)
        .where(and(eq(events.seriesId, current.seriesId), gte(events.startDate, current.startDate)));
      const updateSeries = db
        .update(recurrenceSeries)
        .set({
          frequency: rule.frequency,
          interval: rule.interval,
          endDate: rule.endType === "date" ? rule.endDate : null,
          endCount: rule.endType === "count" ? rule.endCount : null,
        })
        .where(eq(recurrenceSeries.id, current.seriesId));
      const [firstInsert, ...restInserts] = occurrences.map((occ) =>
        db.insert(events).values({
          ...fieldsNoDate,
          startDate: occ.startDate,
          endDate: occ.endDate,
          seriesId: current.seriesId,
        }),
      );

      try {
        await db.batch([deleteOld, updateSeries, firstInsert, ...restInserts]);
      } catch {
        return {
          error: "Could not update the series: two or more occurrences would overlap each other. Try a longer interval or a shorter duration.",
        };
      }

      revalidatePath("/schedule");
      redirect("/schedule");
    }
  }

  const issues = await issuesFor(event.berthId, event.startDate, event.endDate, id);
  if (issues.length > 0 && !(event.overridden && event.overrideNote)) {
    return { error: `${issues.join(" ")} Check "override" and enter a justification to save anyway.` };
  }

  const { createdByStaffId: _createdByStaffId, ...rest } = event;
  await db.update(events).set(rest).where(eq(events.id, id));
  revalidatePath("/schedule");
  redirect("/schedule");
}

export async function cancelEvent(id: string) {
  await requireStaff();
  await db.update(events).set({ active: false }).where(eq(events.id, id));
  revalidatePath("/schedule");
}

export async function cancelEventFollowing(id: string) {
  await requireStaff();
  const [current] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (current?.seriesId) {
    await db
      .update(events)
      .set({ active: false })
      .where(and(eq(events.seriesId, current.seriesId), gte(events.startDate, current.startDate)));
  } else {
    await db.update(events).set({ active: false }).where(eq(events.id, id));
  }
  revalidatePath("/schedule");
}
