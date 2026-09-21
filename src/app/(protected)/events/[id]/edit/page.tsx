import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, events } from "@/db/schema";
import EventForm from "@/components/EventForm";
import { updateEvent } from "../../actions";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [[event], allBerths] = await Promise.all([
    db.select().from(events).where(eq(events.id, id)).limit(1),
    db.select().from(berths).orderBy(asc(berths.name)),
  ]);
  if (!event) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Event</h1>
      <EventForm
        berths={allBerths}
        event={event}
        excludeEventId={id}
        action={updateEvent.bind(null, id)}
      />
    </div>
  );
}
