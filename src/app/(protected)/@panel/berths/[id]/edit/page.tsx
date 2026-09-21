import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { berths } from "@/db/schema";
import BerthForm from "@/components/BerthForm";
import { requireStaff } from "@/lib/authz";
import { updateBerth } from "@/app/(protected)/berths/actions";

export default async function EditBerthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const [berth] = await db.select().from(berths).where(eq(berths.id, id)).limit(1);
  if (!berth) notFound();

  return (
    <div>
      <h1 className="mb-6 page-title">
        Edit Berth
      </h1>
      <BerthForm berth={berth} action={updateBerth.bind(null, id)} />
    </div>
  );
}
