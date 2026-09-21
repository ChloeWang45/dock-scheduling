import Link from "next/link";
import { db } from "@/db";
import { berths } from "@/db/schema";
import { setBerthActive } from "./actions";

export default async function BerthsPage() {
  const allBerths = await db.select().from(berths).orderBy(berths.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Berths
        </h1>
        <Link
          href="/berths/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + New Berth
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Length (ft)</th>
              <th className="px-4 py-2 font-medium">Depth (ft)</th>
              <th className="px-4 py-2 font-medium">Width (ft)</th>
              <th className="px-4 py-2 font-medium">Max occupants</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {allBerths.map((berth) => {
              const needsDimensions =
                berth.lengthFt == null &&
                berth.depthAtLowTideFt == null &&
                berth.widthFt == null;
              return (
                <tr key={berth.id} className="text-zinc-800 dark:text-zinc-200">
                  <td className="px-4 py-2">
                    {berth.name}
                    {needsDimensions && (
                      <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Needs dimensions
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{berth.lengthFt ?? "—"}</td>
                  <td className="px-4 py-2">{berth.depthAtLowTideFt ?? "—"}</td>
                  <td className="px-4 py-2">{berth.widthFt ?? "—"}</td>
                  <td className="px-4 py-2">{berth.maxSimultaneousOccupants}</td>
                  <td className="px-4 py-2">
                    {berth.active ? (
                      <span className="text-green-700 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="text-zinc-400">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/berths/${berth.id}/edit`}
                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        Edit
                      </Link>
                      <form
                        action={setBerthActive.bind(null, berth.id, !berth.active)}
                      >
                        <button
                          type="submit"
                          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          {berth.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
