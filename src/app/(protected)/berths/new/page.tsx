import BerthForm from "@/components/BerthForm";
import { requireStaff } from "@/lib/authz";
import { createBerth } from "../actions";

export default async function NewBerthPage() {
  await requireStaff();
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New Berth
      </h1>
      <BerthForm action={createBerth} />
    </div>
  );
}
