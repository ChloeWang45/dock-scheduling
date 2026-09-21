import { asc } from "drizzle-orm";
import { db } from "@/db";
import { berths } from "@/db/schema";
import ClosureForm from "@/components/ClosureForm";
import { requireStaff } from "@/lib/authz";
import { createClosure } from "../actions";

export default async function NewClosurePage({
  searchParams,
}: {
  searchParams: Promise<{ berthId?: string; date?: string }>;
}) {
  await requireStaff();
  const { berthId, date } = await searchParams;
  const allBerths = await db.select().from(berths).orderBy(asc(berths.name));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">New Closure</h1>
      <ClosureForm
        berths={allBerths}
        defaultBerthId={berthId}
        defaultDate={date}
        action={createClosure}
      />
    </div>
  );
}
