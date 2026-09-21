import Link from "next/link";
import { auth } from "@/auth";
import { canWrite } from "@/lib/authz";
import { getScheduleEntries, type EntryType, type ScheduleEntry } from "@/lib/schedule-entries";
import { groupBySeries } from "@/lib/group-series";
import { todayISO } from "@/lib/calendar-dates";
import SeriesGroup from "@/components/SeriesGroup";
import ScheduleSearch from "@/components/ScheduleSearch";
import { cancelBooking } from "../bookings/actions";
import { cancelEvent } from "../events/actions";
import { cancelClosure } from "../closures/actions";

const TYPE_LABELS: Record<EntryType, string> = {
  booking: "Booking",
  event: "Event",
  closure: "Closure",
};

const TYPE_BADGE_CLASS: Record<EntryType, string> = {
  booking: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  event: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  closure: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const FILTERS: { value: "all" | EntryType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "booking", label: "Bookings" },
  { value: "event", label: "Events" },
  { value: "closure", label: "Closures" },
];

function cancelActionFor(entry: ScheduleEntry) {
  if (entry.type === "booking") return cancelBooking.bind(null, entry.id);
  if (entry.type === "event") return cancelEvent.bind(null, entry.id);
  return cancelClosure.bind(null, entry.id);
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const session = await auth();
  const editable = canWrite(session!.user.role);
  const { type, q: rawQ } = await searchParams;
  const activeFilter: "all" | EntryType =
    type === "booking" || type === "event" || type === "closure" ? type : "all";
  const q = (rawQ ?? "").trim();

  const allEntries = await getScheduleEntries();
  let entries =
    activeFilter === "all" ? allEntries : allEntries.filter((e) => e.type === activeFilter);
  if (q) {
    const needle = q.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.title.toLowerCase().includes(needle) ||
        (e.subtitle?.toLowerCase().includes(needle) ?? false) ||
        e.berthName.toLowerCase().includes(needle) ||
        e.statusLabel.toLowerCase().includes(needle),
    );
  }

  const groups = groupBySeries(entries, todayISO());
  const columnCount = editable ? 7 : 6;

  function renderRow(entry: ScheduleEntry) {
    return (
      <tr key={`${entry.type}-${entry.id}`} className="text-zinc-800 dark:text-zinc-200">
        <td className="px-4 py-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_CLASS[entry.type]}`}
          >
            {TYPE_LABELS[entry.type]}
          </span>
        </td>
        <td className="px-4 py-2">{entry.berthName}</td>
        <td className="px-4 py-2">
          {entry.title}
          {entry.subtitle && <span className="text-zinc-500"> ({entry.subtitle})</span>}
        </td>
        <td className="px-4 py-2">
          {entry.startDate === entry.endDate
            ? entry.startDate
            : `${entry.startDate} – ${entry.endDate}`}
          {entry.seriesId && (
            <span title="Part of a recurring series" className="ml-1.5 text-zinc-400">
              ↻
            </span>
          )}
        </td>
        <td className="px-4 py-2">{entry.staffLabel}</td>
        <td className="px-4 py-2">
          <span className={entry.statusClass}>{entry.statusLabel}</span>
          {entry.overridden && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Overridden
            </span>
          )}
        </td>
        {editable && (
          <td className="px-4 py-2 text-right">
            <div className="flex items-center justify-end gap-3">
              <Link
                href={entry.editHref}
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Edit
              </Link>
              {entry.isCancellable && (
                <form action={cancelActionFor(entry)}>
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
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Schedule</h1>
        {editable && (
          <Link
            href="/schedule/new"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + New Entry
          </Link>
        )}
      </div>

      <ScheduleSearch q={q} type={activeFilter} />

      <div className="mb-4 flex items-center gap-1 rounded border border-zinc-300 p-0.5 w-fit dark:border-zinc-700">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              (f.value === "all" ? "/schedule" : `/schedule?type=${f.value}`) +
              (q ? `${f.value === "all" ? "?" : "&"}q=${encodeURIComponent(q)}` : "")
            }
            className={`rounded px-3 py-1 text-sm ${
              activeFilter === f.value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {q && (
        <p className="mb-3 text-sm text-zinc-500">
          {entries.length === 0
            ? `No bookings, events, or closures match "${q}".`
            : `${entries.length} result${entries.length === 1 ? "" : "s"} for "${q}".`}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Berth</th>
              <th className="px-4 py-2 font-medium">What</th>
              <th className="px-4 py-2 font-medium">Dates</th>
              <th className="px-4 py-2 font-medium">By</th>
              <th className="px-4 py-2 font-medium">Status</th>
              {editable && <th className="px-4 py-2 font-medium"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {groups.map(({ primary, extras }) => (
              <SeriesGroup
                key={`${primary.type}-${primary.id}`}
                primaryRow={renderRow(primary)}
                extraRows={extras.map(renderRow)}
                extraCount={extras.length}
                columnCount={columnCount}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
