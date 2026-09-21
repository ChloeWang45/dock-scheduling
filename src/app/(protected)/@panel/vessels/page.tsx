import Link from "next/link";
import { db } from "@/db";
import { vessels } from "@/db/schema";
import { auth } from "@/auth";
import { canWrite } from "@/lib/authz";
import { setVesselActive } from "@/app/(protected)/vessels/actions";

export default async function VesselsPage() {
  const session = await auth();
  const editable = canWrite(session!.user.role);
  const allVessels = await db.select().from(vessels).orderBy(vessels.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="page-title">
          Vessels
        </h1>
        {editable && (
          <Link
            href="/vessels/new"
            className="btn-primary"
          >
            + New Vessel
          </Link>
        )}
      </div>
      <div className="table-shell">
        <table className="w-full text-left text-sm">
          <thead className="table-head">
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
          <tbody className="table-divide">
            {allVessels.map((vessel) => (
              <tr key={vessel.id} className="table-row">
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
                    <span className="text-confirmed">
                      Active
                    </span>
                  ) : (
                    <span className="text-ink/40">Inactive</span>
                  )}
                </td>
                {editable && (
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/vessels/${vessel.id}/edit`}
                        className="link-action"
                      >
                        Edit
                      </Link>
                      <form
                        action={setVesselActive.bind(null, vessel.id, !vessel.active)}
                      >
                        <button
                          type="submit"
                          className="link-action"
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
