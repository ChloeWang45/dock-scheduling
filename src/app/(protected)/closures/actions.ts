"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { closures, recurrenceSeries } from "@/db/schema";
import { checkBerthConflicts, type ConflictIssue } from "@/lib/berth-conflict";
import { requireStaff } from "@/lib/authz";
import { generateOccurrences, type RecurrenceRule } from "@/lib/recurrence";

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
  excludeClosureId?: string,
): Promise<string[]> {
  const conflicts = await checkClosureConflicts({ berthId, startDate, endDate, excludeClosureId });
  return conflicts.map((c) => c.message);
}

async function issuesForExcludingSeries(
  berthId: string,
  startDate: string,
  endDate: string,
  excludeClosureIds: string[],
): Promise<string[]> {
  const conflicts = await checkBerthConflicts({
    berthId,
    startDate,
    endDate,
    excludeSourceIds: { table: "closures", ids: excludeClosureIds },
  });
  return conflicts.map((c) => c.message);
}

export type ClosureFormState = { error: string } | undefined;

export async function createClosure(
  _prevState: ClosureFormState,
  formData: FormData,
): Promise<ClosureFormState> {
  const user = await requireStaff();
  const closure = closureFromForm(formData, user.id);
  const repeats = formData.get("repeats") === "on";

  if (!repeats) {
    const issues = await issuesFor(closure.berthId, closure.startDate, closure.endDate);
    if (issues.length > 0 && !(closure.overridden && closure.overrideNote)) {
      return { error: `${issues.join(" ")} Check "override" and enter a justification to save anyway.` };
    }
    await db.insert(closures).values(closure);
    revalidatePath("/closures");
    redirect("/closures");
  }

  const rule = recurrenceRuleFromForm(formData);
  if (!rule) return { error: "Invalid recurrence settings." };

  const occurrences = generateOccurrences(closure.startDate, closure.endDate, rule);
  if (occurrences.length === 0) {
    return { error: "That recurrence produces no occurrences — check the end condition." };
  }

  const allIssues: string[] = [];
  for (const occ of occurrences) {
    const issues = await issuesFor(closure.berthId, occ.startDate, occ.endDate);
    if (issues.length > 0) allIssues.push(`${occ.startDate}: ${issues.join(" ")}`);
  }

  if (allIssues.length > 0 && !(closure.overridden && closure.overrideNote)) {
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
    db.insert(closures).values({
      ...closure,
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
  const scope = String(formData.get("scope") ?? "this");

  if (scope === "following") {
    const [current] = await db.select().from(closures).where(eq(closures.id, id)).limit(1);
    if (current?.seriesId) {
      const rule = recurrenceRuleFromForm(formData);
      if (!rule) return { error: "Invalid recurrence settings." };

      const occurrences = generateOccurrences(closure.startDate, closure.endDate, rule);
      if (occurrences.length === 0) {
        return { error: "That recurrence produces no occurrences — check the end condition." };
      }

      const seriesClosureIds = (
        await db
          .select({ id: closures.id })
          .from(closures)
          .where(eq(closures.seriesId, current.seriesId))
      ).map((r) => r.id);

      const allIssues: string[] = [];
      for (const occ of occurrences) {
        const issues = await issuesForExcludingSeries(
          closure.berthId,
          occ.startDate,
          occ.endDate,
          seriesClosureIds,
        );
        if (issues.length > 0) allIssues.push(`${occ.startDate}: ${issues.join(" ")}`);
      }
      if (allIssues.length > 0 && !(closure.overridden && closure.overrideNote)) {
        const preview = allIssues.slice(0, 3).join(" | ");
        return {
          error: `${allIssues.length} of ${occurrences.length} occurrences have issues: ${preview}${
            allIssues.length > 3 ? " …" : ""
          } Check "override" and enter a justification to save the whole series anyway.`,
        };
      }

      const { startDate: _sd, endDate: _ed, ...fieldsNoDate } = closure;
      // Preserve the series' original creator rather than the editor.
      fieldsNoDate.createdByStaffId = current.createdByStaffId;

      const deleteOld = db
        .delete(closures)
        .where(
          and(eq(closures.seriesId, current.seriesId), gte(closures.startDate, current.startDate)),
        );
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
        db.insert(closures).values({
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

      revalidatePath("/closures");
      redirect("/closures");
    }
  }

  const issues = await issuesFor(closure.berthId, closure.startDate, closure.endDate, id);
  if (issues.length > 0 && !(closure.overridden && closure.overrideNote)) {
    return { error: `${issues.join(" ")} Check "override" and enter a justification to save anyway.` };
  }

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

export async function cancelClosureFollowing(id: string) {
  await requireStaff();
  const [current] = await db.select().from(closures).where(eq(closures.id, id)).limit(1);
  if (current?.seriesId) {
    await db
      .update(closures)
      .set({ active: false })
      .where(and(eq(closures.seriesId, current.seriesId), gte(closures.startDate, current.startDate)));
  } else {
    await db.update(closures).set({ active: false }).where(eq(closures.id, id));
  }
  revalidatePath("/closures");
}
