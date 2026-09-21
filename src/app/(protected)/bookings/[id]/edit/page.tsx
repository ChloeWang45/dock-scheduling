import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, vessels } from "@/db/schema";
import BookingForm from "@/components/BookingForm";
import { requireStaff } from "@/lib/authz";
import { updateBooking } from "../../actions";

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

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Booking
      </h1>
      <BookingForm
        berths={allBerths}
        vessels={allVessels}
        booking={booking}
        excludeBookingId={id}
        action={updateBooking.bind(null, id)}
      />
    </div>
  );
}
