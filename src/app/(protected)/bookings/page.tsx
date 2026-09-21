import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, users, vessels } from "@/db/schema";
import { auth } from "@/auth";
import { canWrite } from "@/lib/authz";
import { formatStaffName } from "@/lib/user-display";
import { cancelBooking } from "./actions";

export default async function BookingsPage() {
  const session = await auth();
  const editable = canWrite(session!.user.role);
  const rows = await db
    .select({
      id: bookings.id,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      isAllDay: bookings.isAllDay,
      status: bookings.status,
      overridden: bookings.overridden,
      berthName: berths.name,
      vesselName: vessels.name,
      operator: vessels.operator,
      staffName: users.name,
      staffTitle: users.title,
      staffRole: users.role,
    })
    .from(bookings)
    .innerJoin(berths, eq(bookings.berthId, berths.id))
    .innerJoin(vessels, eq(bookings.vesselId, vessels.id))
    .innerJoin(users, eq(bookings.createdByStaffId, users.id))
    .orderBy(desc(bookings.startDate));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Bookings
        </h1>
        {editable && (
          <Link
            href="/bookings/new"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + New Booking
          </Link>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Berth</th>
              <th className="px-4 py-2 font-medium">Vessel / Operator</th>
              <th className="px-4 py-2 font-medium">Dates</th>
              <th className="px-4 py-2 font-medium">Booked by</th>
              <th className="px-4 py-2 font-medium">Status</th>
              {editable && <th className="px-4 py-2 font-medium"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((row) => (
              <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                <td className="px-4 py-2">{row.berthName}</td>
                <td className="px-4 py-2">
                  {row.vesselName}
                  {row.operator && (
                    <span className="text-zinc-500"> ({row.operator})</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {row.startDate === row.endDate
                    ? row.startDate
                    : `${row.startDate} – ${row.endDate}`}
                </td>
                <td className="px-4 py-2">
                  {formatStaffName(row.staffName, row.staffTitle, row.staffRole)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      row.status === "confirmed"
                        ? "text-green-700 dark:text-green-400"
                        : row.status === "tentative"
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-zinc-400"
                    }
                  >
                    {row.status}
                  </span>
                  {row.overridden && (
                    <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Overridden
                    </span>
                  )}
                </td>
                {editable && (
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/bookings/${row.id}/edit`}
                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        Edit
                      </Link>
                      {row.status !== "cancelled" && (
                        <form action={cancelBooking.bind(null, row.id)}>
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
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
