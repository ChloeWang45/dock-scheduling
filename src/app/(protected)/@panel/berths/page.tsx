import Link from "next/link";
import { db } from "@/db";
import { berths } from "@/db/schema";
import { auth } from "@/auth";
import { canWrite } from "@/lib/authz";
import { setBerthActive } from "@/app/(protected)/berths/actions";

export default async function BerthsPage() {
  const session = await auth();
  const editable = canWrite(session!.user.role);
  const allBerths = await db.select().from(berths).orderBy(berths.name);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="page-title">
          Berths
        </h1>
        {editable && (
          <Link
            href="/berths/new"
            className="btn-primary"
          >
            + New Berth
          </Link>
        )}
      </div>
      <div className="table-shell">
        <table className="w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Length (ft)</th>
              <th className="px-4 py-2 font-medium">Depth (ft)</th>
              <th className="px-4 py-2 font-medium">Width (ft)</th>
              <th className="px-4 py-2 font-medium">Max occupants</th>
              <th className="px-4 py-2 font-medium">Status</th>
              {editable && <th className="px-4 py-2 font-medium"></th>}
            </tr>
          </thead>
          <tbody className="table-divide">
            {allBerths.map((berth) => {
              const needsDimensions =
                berth.lengthFt == null &&
                berth.depthAtLowTideFt == null &&
                berth.widthFt == null;
              return (
                <tr key={berth.id} className="table-row">
                  <td className="px-4 py-2">
                    {berth.name}
                    {needsDimensions && (
                      <span className="ml-2 badge-tentative">
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
                          href={`/berths/${berth.id}/edit`}
                          className="link-action"
                        >
                          Edit
                        </Link>
                        <form
                          action={setBerthActive.bind(null, berth.id, !berth.active)}
                        >
                          <button
                            type="submit"
                            className="link-action"
                          >
                            {berth.active ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
