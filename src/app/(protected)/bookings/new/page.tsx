import { asc } from "drizzle-orm";
import { db } from "@/db";
import { berths, vessels } from "@/db/schema";
import BookingForm from "@/components/BookingForm";
import { requireStaff } from "@/lib/authz";
import { createBooking } from "../actions";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ berthId?: string; date?: string }>;
}) {
  await requireStaff();
  const { berthId, date } = await searchParams;
  const [allBerths, allVessels] = await Promise.all([
    db.select().from(berths).orderBy(asc(berths.name)),
    db.select().from(vessels).orderBy(asc(vessels.name)),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New Booking
      </h1>
      <BookingForm
        berths={allBerths}
        vessels={allVessels}
        defaultBerthId={berthId}
        defaultDate={date}
        action={createBooking}
      />
    </div>
  );
}
