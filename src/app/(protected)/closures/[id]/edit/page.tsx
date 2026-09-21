import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, closures, recurrenceSeries } from "@/db/schema";
import ClosureForm from "@/components/ClosureForm";
import { requireStaff } from "@/lib/authz";
import { seriesRuleFromRow } from "@/lib/recurrence";
import { cancelClosureFollowing, updateClosure } from "../../actions";

export default async function EditClosurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const [[closure], allBerths] = await Promise.all([
    db.select().from(closures).where(eq(closures.id, id)).limit(1),
    db.select().from(berths).orderBy(asc(berths.name)),
  ]);
  if (!closure) notFound();

  let seriesRule = undefined;
  if (closure.seriesId) {
    const [row] = await db
      .select()
      .from(recurrenceSeries)
      .where(eq(recurrenceSeries.id, closure.seriesId))
      .limit(1);
    if (row) seriesRule = seriesRuleFromRow(row);
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Closure</h1>
      <ClosureForm
        berths={allBerths}
        closure={closure}
        seriesRule={seriesRule}
        excludeClosureId={id}
        action={updateClosure.bind(null, id)}
      />
      {closure.seriesId && (
        <form action={cancelClosureFollowing.bind(null, id)} className="mt-4">
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
