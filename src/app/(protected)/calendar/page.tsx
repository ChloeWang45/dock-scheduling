import Link from "next/link";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, closures, events, users, vessels } from "@/db/schema";
import { auth } from "@/auth";
import { canWrite } from "@/lib/authz";
import { getVisibleRange, todayISO, type ViewType } from "@/lib/calendar-dates";
import { formatStaffName } from "@/lib/user-display";
import { getScheduleEntries, type EntryType } from "@/lib/schedule-entries";
import CalendarNav from "@/components/calendar/CalendarNav";
import CalendarSearch from "@/components/calendar/CalendarSearch";
import BerthDayGrid, { type OccupancyBlock } from "@/components/calendar/BerthDayGrid";
import YearGrid from "@/components/calendar/YearGrid";
import Legend from "@/components/calendar/Legend";

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

const VALID_VIEWS: ViewType[] = ["day", "week", "month", "year"];

const BOOKING_STATUS_CLASS: Record<string, string> = {
  confirmed: "bg-green-500/90 text-white",
  tentative: "bg-amber-500/90 text-white",
  cancelled: "bg-zinc-400/80 text-white line-through",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; q?: string }>;
}) {
  const session = await auth();
  const editable = canWrite(session!.user.role);
  const params = await searchParams;
  const view: ViewType = VALID_VIEWS.includes(params.view as ViewType)
    ? (params.view as ViewType)
    : "week";
  const anchor = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayISO();
  const q = (params.q ?? "").trim();

  if (q) {
    const allEntries = await getScheduleEntries();
    const needle = q.toLowerCase();
    const matches = allEntries
      .filter(
        (e) =>
          e.title.toLowerCase().includes(needle) ||
          (e.subtitle?.toLowerCase().includes(needle) ?? false) ||
          e.berthName.toLowerCase().includes(needle) ||
          e.statusLabel.toLowerCase().includes(needle),
      )
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Calendar</h1>
        </div>
        <CalendarSearch q={q} view={view} anchor={anchor} />
        <p className="mb-4 text-sm text-zinc-500">
          {matches.length === 0
            ? `No bookings, events, or closures match "${q}".`
            : `${matches.length} result${matches.length === 1 ? "" : "s"} for "${q}".`}
        </p>
        {matches.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Berth</th>
                  <th className="px-4 py-2 font-medium">What</th>
                  <th className="px-4 py-2 font-medium">Dates</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {matches.map((entry) => (
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
                    </td>
                    <td className="px-4 py-2">
                      <span className={entry.statusClass}>{entry.statusLabel}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/calendar?view=day&date=${entry.startDate}`}
                          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          View in calendar
                        </Link>
                        {editable && (
                          <Link
                            href={entry.editHref}
                            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const { start, end, days } = getVisibleRange(view, anchor);

  const [allBerths, rangeBookings, rangeEvents, rangeClosures] = await Promise.all([
    db.select().from(berths).where(eq(berths.active, true)).orderBy(asc(berths.name)),
    db
      .select({
        id: bookings.id,
        berthId: bookings.berthId,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        status: bookings.status,
        overridden: bookings.overridden,
        vesselName: vessels.name,
        staffName: users.name,
        staffTitle: users.title,
        staffRole: users.role,
      })
      .from(bookings)
      .innerJoin(vessels, eq(vessels.id, bookings.vesselId))
      .innerJoin(users, eq(users.id, bookings.createdByStaffId))
      .where(
        sql`daterange(${bookings.startDate}, ${bookings.endDate}, '[]') && daterange(${start}::date, ${end}::date, '[]')`,
      ),
    db
      .select({
        id: events.id,
        berthId: events.berthId,
        startDate: events.startDate,
        endDate: events.endDate,
        name: events.name,
        overridden: events.overridden,
        staffName: users.name,
        staffTitle: users.title,
        staffRole: users.role,
      })
      .from(events)
      .innerJoin(users, eq(users.id, events.createdByStaffId))
      .where(
        and(
          eq(events.active, true),
          sql`daterange(${events.startDate}, ${events.endDate}, '[]') && daterange(${start}::date, ${end}::date, '[]')`,
        ),
      ),
    db
      .select({
        id: closures.id,
        berthId: closures.berthId,
        startDate: closures.startDate,
        endDate: closures.endDate,
        reason: closures.reason,
        overridden: closures.overridden,
        staffName: users.name,
        staffTitle: users.title,
        staffRole: users.role,
      })
      .from(closures)
      .innerJoin(users, eq(users.id, closures.createdByStaffId))
      .where(
        and(
          eq(closures.active, true),
          sql`daterange(${closures.startDate}, ${closures.endDate}, '[]') && daterange(${start}::date, ${end}::date, '[]')`,
        ),
      ),
  ]);

  const blocks: OccupancyBlock[] = [
    ...rangeBookings.map((b) => ({
      id: `booking-${b.id}`,
      berthId: b.berthId,
      startDate: b.startDate,
      endDate: b.endDate,
      label: b.vesselName,
      title: `${b.vesselName} — ${b.startDate} to ${b.endDate} — ${b.status}${b.overridden ? " (overridden)" : ""} — booked by ${formatStaffName(b.staffName, b.staffTitle, b.staffRole)}`,
      colorClass: BOOKING_STATUS_CLASS[b.status] ?? BOOKING_STATUS_CLASS.confirmed,
      ringed: b.overridden,
      href: `/bookings/${b.id}/edit`,
    })),
    ...rangeEvents.map((e) => ({
      id: `event-${e.id}`,
      berthId: e.berthId,
      startDate: e.startDate,
      endDate: e.endDate,
      label: e.name,
      title: `${e.name} — ${e.startDate} to ${e.endDate} — event${e.overridden ? " (overridden)" : ""} — created by ${formatStaffName(e.staffName, e.staffTitle, e.staffRole)}`,
      colorClass: "bg-blue-500/90 text-white",
      ringed: e.overridden,
      href: `/events/${e.id}/edit`,
    })),
    ...rangeClosures.map((c) => ({
      id: `closure-${c.id}`,
      berthId: c.berthId,
      startDate: c.startDate,
      endDate: c.endDate,
      label: `Closed: ${c.reason}`,
      title: `Closed — ${c.startDate} to ${c.endDate} — ${c.reason}${c.overridden ? " (overridden)" : ""} — created by ${formatStaffName(c.staffName, c.staffTitle, c.staffRole)}`,
      colorClass: "bg-red-700/90 text-white",
      ringed: c.overridden,
      href: `/closures/${c.id}/edit`,
    })),
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Calendar</h1>
      </div>
      <CalendarSearch q={q} view={view} anchor={anchor} />
      <CalendarNav view={view} anchor={anchor} />
      <Legend />
      {view === "year" ? (
        <YearGrid year={anchor.slice(0, 4)} berths={allBerths} blocks={blocks} />
      ) : (
        <BerthDayGrid view={view} days={days} berths={allBerths} blocks={blocks} editable={editable} />
      )}
    </div>
  );
}
