"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, recurrenceSeries, vessels } from "@/db/schema";
import { checkFit, type FitIssue } from "@/lib/booking-validation";
import { checkBerthConflicts, type ConflictIssue } from "@/lib/berth-conflict";
import { requireStaff } from "@/lib/authz";
import { generateOccurrences, type RecurrenceRule } from "@/lib/recurrence";

export type BookingIssues = {
  conflicts: ConflictIssue[];
  fitIssues: FitIssue[];
};

export async function checkBookingIssues(input: {
  berthId: string;
  vesselId: string;
  startDate: string;
  endDate: string;
  excludeBookingId?: string;
}): Promise<BookingIssues> {
  await requireStaff();
  if (!input.berthId || !input.vesselId || !input.startDate || !input.endDate) {
    return { conflicts: [], fitIssues: [] };
  }

  const [berth] = await db.select().from(berths).where(eq(berths.id, input.berthId)).limit(1);
  const [vessel] = await db.select().from(vessels).where(eq(vessels.id, input.vesselId)).limit(1);
  if (!berth || !vessel) return { conflicts: [], fitIssues: [] };

  const [conflicts, fitIssues] = await Promise.all([
    checkBerthConflicts({
      berthId: input.berthId,
      startDate: input.startDate,
      endDate: input.endDate,
      excludeSource: input.excludeBookingId
        ? { table: "bookings", id: input.excludeBookingId }
        : undefined,
    }),
    Promise.resolve(checkFit(vessel, berth)),
  ]);

  return { conflicts, fitIssues };
}

function bookingFromForm(formData: FormData, staffId: string) {
  const isAllDay = formData.get("isAllDay") === "on";
  return {
    berthId: String(formData.get("berthId")),
    vesselId: String(formData.get("vesselId")),
    startDate: String(formData.get("startDate")),
    endDate: String(formData.get("endDate")),
    isAllDay,
    arrivalTime: isAllDay ? null : String(formData.get("arrivalTime") ?? "") || null,
    departureTime: isAllDay ? null : String(formData.get("departureTime") ?? "") || null,
    status: String(formData.get("status") ?? "confirmed") as "confirmed" | "tentative" | "cancelled",
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
  vesselId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string,
): Promise<string[]> {
  const { conflicts, fitIssues } = await checkBookingIssues({
    berthId,
    vesselId,
    startDate,
    endDate,
    excludeBookingId,
  });
  const violations = fitIssues.filter((f) => f.status === "violation");
  return [...conflicts.map((c) => c.message), ...violations.map((f) => f.message)];
}

export type BookingFormState = { error: string } | undefined;

export async function createBooking(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await requireStaff();
  const booking = bookingFromForm(formData, user.id);
  const repeats = formData.get("repeats") === "on";

  if (!repeats) {
    const issues = await issuesFor(booking.berthId, booking.vesselId, booking.startDate, booking.endDate);
    if (issues.length > 0 && !(booking.overridden && booking.overrideNote)) {
      return { error: `${issues.join(" ")} Check "override" and enter a justification to save anyway.` };
    }
    await db.insert(bookings).values(booking);
    revalidatePath("/bookings");
    redirect("/bookings");
  }

  const rule = recurrenceRuleFromForm(formData);
  if (!rule) return { error: "Invalid recurrence settings." };

  const occurrences = generateOccurrences(booking.startDate, booking.endDate, rule);
  if (occurrences.length === 0) {
    return { error: "That recurrence produces no occurrences — check the end condition." };
  }

  const allIssues: string[] = [];
  for (const occ of occurrences) {
    const issues = await issuesFor(booking.berthId, booking.vesselId, occ.startDate, occ.endDate);
    if (issues.length > 0) allIssues.push(`${occ.startDate}: ${issues.join(" ")}`);
  }

  if (allIssues.length > 0 && !(booking.overridden && booking.overrideNote)) {
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
    db.insert(bookings).values({
      ...booking,
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
      error: "Could not create the series: two or more occurrences would overlap each other. Try a longer interval or a shorter stay.",
    };
  }

  revalidatePath("/bookings");
  redirect("/bookings");
}

export async function updateBooking(
  id: string,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await requireStaff();
  const booking = bookingFromForm(formData, user.id);
  const scope = String(formData.get("scope") ?? "this");

  const issues = await issuesFor(
    booking.berthId,
    booking.vesselId,
    booking.startDate,
    booking.endDate,
    id,
  );
  if (issues.length > 0 && !(booking.overridden && booking.overrideNote)) {
    return { error: `${issues.join(" ")} Check "override" and enter a justification to save anyway.` };
  }

  const { createdByStaffId: _createdByStaffId, startDate, endDate, ...rest } = booking;

  if (scope === "following") {
    const [current] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (current?.seriesId) {
      await db
        .update(bookings)
        .set(rest)
        .where(and(eq(bookings.seriesId, current.seriesId), gte(bookings.startDate, current.startDate)));
      revalidatePath("/bookings");
      redirect("/bookings");
    }
  }

  await db.update(bookings).set({ ...rest, startDate, endDate }).where(eq(bookings.id, id));
  revalidatePath("/bookings");
  redirect("/bookings");
}

export async function cancelBooking(id: string) {
  await requireStaff();
  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id));
  revalidatePath("/bookings");
}

export async function cancelBookingFollowing(id: string) {
  await requireStaff();
  const [current] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (current?.seriesId) {
    await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(and(eq(bookings.seriesId, current.seriesId), gte(bookings.startDate, current.startDate)));
  } else {
    await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id));
  }
  revalidatePath("/bookings");
}
