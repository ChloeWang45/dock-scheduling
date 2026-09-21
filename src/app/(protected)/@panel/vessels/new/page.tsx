import VesselForm from "@/components/VesselForm";
import { requireStaff } from "@/lib/authz";
import { createVessel } from "@/app/(protected)/vessels/actions";

export default async function NewVesselPage() {
  await requireStaff();
  return (
    <div>
      <h1 className="mb-6 page-title">
        New Vessel
      </h1>
      <VesselForm action={createVessel} />
    </div>
  );
}
