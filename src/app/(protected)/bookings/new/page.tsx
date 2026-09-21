import { asc } from "drizzle-orm";
import { db } from "@/db";
import { berths, vessels } from "@/db/schema";
import BookingForm from "@/components/BookingForm";
import { createBooking } from "../actions";

export default async function NewBookingPage() {
  const [allBerths, allVessels] = await Promise.all([
    db.select().from(berths).orderBy(asc(berths.name)),
    db.select().from(vessels).orderBy(asc(vessels.name)),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New Booking
      </h1>
      <BookingForm berths={allBerths} vessels={allVessels} action={createBooking} />
    </div>
  );
}
