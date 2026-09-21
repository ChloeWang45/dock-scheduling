import { asc } from "drizzle-orm";
import { db } from "@/db";
import { berths, vessels } from "@/db/schema";
import { requireStaff } from "@/lib/authz";
import ScheduleNewForm from "@/components/ScheduleNewForm";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ berthId?: string; date?: string; type?: string }>;
}) {
  await requireStaff();
  const { berthId, date, type } = await searchParams;
  const [allBerths, allVessels] = await Promise.all([
    db.select().from(berths).orderBy(asc(berths.name)),
    db.select().from(vessels).orderBy(asc(vessels.name)),
  ]);

  const defaultType = type === "event" || type === "closure" ? type : "booking";

  return (
    <div>
      <h1 className="mb-6 page-title">New Entry</h1>
      <ScheduleNewForm
        berths={allBerths}
        vessels={allVessels}
        defaultBerthId={berthId}
        defaultDate={date}
        defaultType={defaultType}
      />
    </div>
  );
}
