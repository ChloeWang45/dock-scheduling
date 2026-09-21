import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vessels } from "@/db/schema";
import VesselForm from "@/components/VesselForm";
import { updateVessel } from "../../actions";

export default async function EditVesselPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vessel] = await db
    .select()
    .from(vessels)
    .where(eq(vessels.id, id))
    .limit(1);
  if (!vessel) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Vessel
      </h1>
      <VesselForm vessel={vessel} action={updateVessel.bind(null, id)} />
    </div>
  );
}
