import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, closures, users } from "@/db/schema";
import { formatStaffName } from "@/lib/user-display";
import { cancelClosure } from "./actions";

export default async function ClosuresPage() {
  const rows = await db
    .select({
      id: closures.id,
      startDate: closures.startDate,
      endDate: closures.endDate,
      reason: closures.reason,
      active: closures.active,
      overridden: closures.overridden,
      berthName: berths.name,
      staffName: users.name,
      staffTitle: users.title,
      staffRole: users.role,
    })
    .from(closures)
    .innerJoin(berths, eq(closures.berthId, berths.id))
    .innerJoin(users, eq(closures.createdByStaffId, users.id))
    .orderBy(desc(closures.startDate));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Closures</h1>
        <Link
          href="/closures/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + New Closure
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Berth</th>
              <th className="px-4 py-2 font-medium">Dates</th>
              <th className="px-4 py-2 font-medium">Reason</th>
              <th className="px-4 py-2 font-medium">Created by</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((row) => (
              <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                <td className="px-4 py-2">{row.berthName}</td>
                <td className="px-4 py-2">
                  {row.startDate === row.endDate
                    ? row.startDate
                    : `${row.startDate} – ${row.endDate}`}
                </td>
                <td className="px-4 py-2">{row.reason}</td>
                <td className="px-4 py-2">
                  {formatStaffName(row.staffName, row.staffTitle, row.staffRole)}
                </td>
                <td className="px-4 py-2">
                  {row.active ? (
                    <span className="text-red-700 dark:text-red-400">Closed</span>
                  ) : (
                    <span className="text-zinc-400">Cancelled</span>
                  )}
                  {row.overridden && (
                    <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Overridden
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/closures/${row.id}/edit`}
                      className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      Edit
                    </Link>
                    {row.active && (
                      <form action={cancelClosure.bind(null, row.id)}>
                        <button
                          type="submit"
                          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
