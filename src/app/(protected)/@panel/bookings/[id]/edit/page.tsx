import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, recurrenceSeries, vessels } from "@/db/schema";
import BookingForm from "@/components/BookingForm";
import { requireStaff } from "@/lib/authz";
import { seriesRuleFromRow } from "@/lib/recurrence";
import { cancelBookingFollowing, updateBooking } from "@/app/(protected)/bookings/actions";

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const [[booking], allBerths, allVessels] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.id, id)).limit(1),
    db.select().from(berths).orderBy(asc(berths.name)),
    db.select().from(vessels).orderBy(asc(vessels.name)),
  ]);
  if (!booking) notFound();

  let seriesRule = undefined;
  if (booking.seriesId) {
    const [row] = await db
      .select()
      .from(recurrenceSeries)
      .where(eq(recurrenceSeries.id, booking.seriesId))
      .limit(1);
    if (row) seriesRule = seriesRuleFromRow(row);
  }

  return (
    <div>
      <h1 className="mb-6 page-title">
        Edit Booking
      </h1>
      <BookingForm
        berths={allBerths}
        vessels={allVessels}
        booking={booking}
        seriesRule={seriesRule}
        excludeBookingId={id}
        action={updateBooking.bind(null, id)}
      />
      {booking.seriesId && (
        <form action={cancelBookingFollowing.bind(null, id)} className="mt-4">
          <button
            type="submit"
            className="text-sm text-conflict hover:underline"
          >
            Cancel this and all following occurrences
          </button>
        </form>
      )}
    </div>
  );
}
