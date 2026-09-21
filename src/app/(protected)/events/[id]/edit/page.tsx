import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, events, recurrenceSeries } from "@/db/schema";
import EventForm from "@/components/EventForm";
import { requireStaff } from "@/lib/authz";
import { seriesRuleFromRow } from "@/lib/recurrence";
import { cancelEventFollowing, updateEvent } from "../../actions";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const [[event], allBerths] = await Promise.all([
    db.select().from(events).where(eq(events.id, id)).limit(1),
    db.select().from(berths).orderBy(asc(berths.name)),
  ]);
  if (!event) notFound();

  let seriesRule = undefined;
  if (event.seriesId) {
    const [row] = await db
      .select()
      .from(recurrenceSeries)
      .where(eq(recurrenceSeries.id, event.seriesId))
      .limit(1);
    if (row) seriesRule = seriesRuleFromRow(row);
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Event</h1>
      <EventForm
        berths={allBerths}
        event={event}
        seriesRule={seriesRule}
        excludeEventId={id}
        action={updateEvent.bind(null, id)}
      />
      {event.seriesId && (
        <form action={cancelEventFollowing.bind(null, id)} className="mt-4">
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            Cancel this and all following occurrences
          </button>
        </form>
      )}
    </div>
  );
}
