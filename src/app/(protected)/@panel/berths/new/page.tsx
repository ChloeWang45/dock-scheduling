import BerthForm from "@/components/BerthForm";
import { requireStaff } from "@/lib/authz";
import { createBerth } from "@/app/(protected)/berths/actions";

export default async function NewBerthPage() {
  await requireStaff();
  return (
    <div>
      <h1 className="mb-6 page-title">
        New Berth
      </h1>
      <BerthForm action={createBerth} />
    </div>
  );
}
