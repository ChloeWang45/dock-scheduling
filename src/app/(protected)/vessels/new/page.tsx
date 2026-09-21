import VesselForm from "@/components/VesselForm";
import { requireStaff } from "@/lib/authz";
import { createVessel } from "../actions";

export default async function NewVesselPage() {
  await requireStaff();
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New Vessel
      </h1>
      <VesselForm action={createVessel} />
    </div>
  );
}
