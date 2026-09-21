import { asc } from "drizzle-orm";
import { db } from "@/db";
import { berths } from "@/db/schema";
import EventForm from "@/components/EventForm";
import { createEvent } from "../actions";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ berthId?: string; date?: string }>;
}) {
  const { berthId, date } = await searchParams;
  const allBerths = await db.select().from(berths).orderBy(asc(berths.name));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">New Event</h1>
      <EventForm
        berths={allBerths}
        defaultBerthId={berthId}
        defaultDate={date}
        action={createEvent}
      />
    </div>
  );
}
