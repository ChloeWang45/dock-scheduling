"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { berths, bookings, vessels } from "@/db/schema";
import { checkFit, type FitIssue } from "@/lib/booking-validation";
import { checkBerthConflicts, type ConflictIssue } from "@/lib/berth-conflict";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

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
  await requireUser();
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

async function validationError(
  booking: ReturnType<typeof bookingFromForm>,
  excludeBookingId?: string,
): Promise<string | null> {
  const { conflicts, fitIssues } = await checkBookingIssues({
    berthId: booking.berthId,
    vesselId: booking.vesselId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    excludeBookingId,
  });
  const violations = fitIssues.filter((f) => f.status === "violation");
  const hasIssues = conflicts.length > 0 || violations.length > 0;

  if (hasIssues && !(booking.overridden && booking.overrideNote)) {
    const messages = [...conflicts.map((c) => c.message), ...violations.map((f) => f.message)];
    return `${messages.join(" ")} Check "override" and enter a justification to save anyway.`;
  }
  return null;
}

export type BookingFormState = { error: string } | undefined;

export async function createBooking(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await requireUser();
  const booking = bookingFromForm(formData, user.id);
  const error = await validationError(booking);
  if (error) return { error };

  await db.insert(bookings).values(booking);
  revalidatePath("/bookings");
  redirect("/bookings");
}

export async function updateBooking(
  id: string,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await requireUser();
  const booking = bookingFromForm(formData, user.id);
  const error = await validationError(booking, id);
  if (error) return { error };

  const { createdByStaffId: _createdByStaffId, ...rest } = booking;
  await db.update(bookings).set(rest).where(eq(bookings.id, id));
  revalidatePath("/bookings");
  redirect("/bookings");
}

export async function cancelBooking(id: string) {
  await requireUser();
  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id));
  revalidatePath("/bookings");
}
