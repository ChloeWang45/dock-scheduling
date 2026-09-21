import VesselForm from "@/components/VesselForm";
import { createVessel } from "../actions";

export default function NewVesselPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New Vessel
      </h1>
      <VesselForm action={createVessel} />
    </div>
  );
}
