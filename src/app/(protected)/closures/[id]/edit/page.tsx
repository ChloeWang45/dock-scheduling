import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, closures } from "@/db/schema";
import ClosureForm from "@/components/ClosureForm";
import { updateClosure } from "../../actions";

export default async function EditClosurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [[closure], allBerths] = await Promise.all([
    db.select().from(closures).where(eq(closures.id, id)).limit(1),
    db.select().from(berths).orderBy(asc(berths.name)),
  ]);
  if (!closure) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Closure</h1>
      <ClosureForm
        berths={allBerths}
        closure={closure}
        excludeClosureId={id}
        action={updateClosure.bind(null, id)}
      />
    </div>
  );
}
