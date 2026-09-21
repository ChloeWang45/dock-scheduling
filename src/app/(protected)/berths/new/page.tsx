import BerthForm from "@/components/BerthForm";
import { createBerth } from "../actions";

export default function NewBerthPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        New Berth
      </h1>
      <BerthForm action={createBerth} />
    </div>
  );
}
