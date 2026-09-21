import Link from "next/link";
import { db } from "@/db";
import { vessels } from "@/db/schema";
import { auth } from "@/auth";
import { canWrite } from "@/lib/authz";
import { setVesselActive } from "./actions";

export default async function VesselsPage() {
  const session = await auth();
  const editable = canWrite(session!.user.role);
  const allVessels = await db.select().from(vessels).orderBy(vessels.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Vessels
        </h1>
        {editable && (
          <Link
            href="/vessels/new"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + New Vessel
          </Link>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">LOA (ft)</th>
              <th className="px-4 py-2 font-medium">Draft (ft)</th>
              <th className="px-4 py-2 font-medium">Beam (ft)</th>
              <th className="px-4 py-2 font-medium">Operator</th>
              <th className="px-4 py-2 font-medium">Contact</th>
              <th className="px-4 py-2 font-medium">Status</th>
              {editable && <th className="px-4 py-2 font-medium"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {allVessels.map((vessel) => (
              <tr key={vessel.id} className="text-zinc-800 dark:text-zinc-200">
                <td className="px-4 py-2">{vessel.name}</td>
                <td className="px-4 py-2">{vessel.type}</td>
                <td className="px-4 py-2">{vessel.loaFt ?? "—"}</td>
                <td className="px-4 py-2">{vessel.draftFt ?? "—"}</td>
                <td className="px-4 py-2">{vessel.beamFt ?? "—"}</td>
                <td className="px-4 py-2">{vessel.operator ?? "—"}</td>
                <td className="px-4 py-2">
                  {vessel.contactPhone ?? vessel.contactEmail ?? "—"}
                </td>
                <td className="px-4 py-2">
                  {vessel.active ? (
                    <span className="text-green-700 dark:text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="text-zinc-400">Inactive</span>
                  )}
                </td>
                {editable && (
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/vessels/${vessel.id}/edit`}
                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        Edit
                      </Link>
                      <form
                        action={setVesselActive.bind(null, vessel.id, !vessel.active)}
                      >
                        <button
                          type="submit"
                          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          {vessel.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
