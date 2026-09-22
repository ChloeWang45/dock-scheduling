import Link from "next/link";
import { auth } from "@/auth";
import { canWrite } from "@/lib/authz";
import { getScheduleEntries, type EntryType, type ScheduleEntry } from "@/lib/schedule-entries";
import { groupBySeries } from "@/lib/group-series";
import { compareByRelevance, matchesQuery } from "@/lib/search-entries";
import { todayISO } from "@/lib/calendar-dates";
import SeriesGroup from "@/components/SeriesGroup";
import ScheduleSearch from "@/components/ScheduleSearch";
import { cancelBooking } from "@/app/(protected)/bookings/actions";
import { cancelEvent } from "@/app/(protected)/events/actions";
import { cancelClosure } from "@/app/(protected)/closures/actions";

const TYPE_LABELS: Record<EntryType, string> = {
  booking: "Booking",
  event: "Event",
  closure: "Closure",
};

const TYPE_BADGE_CLASS: Record<EntryType, string> = {
  booking: "badge-confirmed",
  event: "badge-event",
  closure: "badge-closure",
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
  searchParams: Promise<{ type?: string; sq?: string }>;
}) {
  const session = await auth();
  const editable = canWrite(session!.user.role);
  const { type, sq: rawQ } = await searchParams;
  const activeFilter: "all" | EntryType =
    type === "booking" || type === "event" || type === "closure" ? type : "all";
  const q = (rawQ ?? "").trim();

  const today = todayISO();
  const allEntries = await getScheduleEntries();
  let entries =
    activeFilter === "all" ? allEntries : allEntries.filter((e) => e.type === activeFilter);
  if (q) {
    entries = entries.filter((e) => matchesQuery(e, q));
  }

  const groups = groupBySeries(entries, today, q ? compareByRelevance(q, today) : undefined);
  const columnCount = editable ? 7 : 6;

  function renderRow(entry: ScheduleEntry) {
    return (
      <tr key={`${entry.type}-${entry.id}`} className="table-row">
        <td className="px-4 py-2">
          <span
            className={TYPE_BADGE_CLASS[entry.type]}
          >
            {TYPE_LABELS[entry.type]}
          </span>
        </td>
        <td className="px-4 py-2">{entry.berthName}</td>
        <td className="px-4 py-2">
          {entry.title}
          {entry.subtitle && <span className="text-ink/60"> ({entry.subtitle})</span>}
        </td>
        <td className="px-4 py-2">
          {entry.startDate === entry.endDate
            ? entry.startDate
            : `${entry.startDate} – ${entry.endDate}`}
          {entry.seriesId && (
            <span title="Part of a recurring series" className="ml-1.5 text-ink/40">
              ↻
            </span>
          )}
        </td>
        <td className="px-4 py-2">{entry.staffLabel}</td>
        <td className="px-4 py-2">
          <span className={entry.statusClass}>{entry.statusLabel}</span>
          {entry.overridden && (
            <span className="ml-2 badge-tentative">
              Overridden
            </span>
          )}
        </td>
        {editable && (
          <td className="px-4 py-2 text-right">
            <div className="flex items-center justify-end gap-3">
              <Link
                href={entry.editHref}
                className="link-action"
              >
                Edit
              </Link>
              {entry.isCancellable && (
                <form action={cancelActionFor(entry)}>
                  <button
                    type="submit"
                    className="link-action"
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
        <h1 className="page-title">Schedule</h1>
        {editable && (
          <Link
            href="/schedule/new"
            className="btn-primary"
          >
            + New Entry
          </Link>
        )}
      </div>

      <ScheduleSearch q={q} type={activeFilter} />

      <div className="mb-4 flex items-center gap-1 rounded-full border border-ink/20 p-1 w-fit">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              (f.value === "all" ? "/schedule" : `/schedule?type=${f.value}`) +
              (q ? `${f.value === "all" ? "?" : "&"}sq=${encodeURIComponent(q)}` : "")
            }
            className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors duration-150 ${
              activeFilter === f.value
                ? "bg-wave text-ink-inverse"
                : "text-ink/70 hover:bg-foam/60"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {q && (
        <p className="mb-3 text-sm text-ink/60">
          {groups.length === 0
            ? `No bookings, events, or closures match "${q}".`
            : `${groups.length} result${groups.length === 1 ? "" : "s"} for "${q}".`}
        </p>
      )}

      <div className="table-shell">
        <table className="w-full text-left text-sm">
          <thead className="table-head">
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
          <tbody className="table-divide">
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
