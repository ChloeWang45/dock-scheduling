import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, closures, events, users, vessels } from "@/db/schema";
import { auth } from "@/auth";
import { canWrite } from "@/lib/authz";
import { getVisibleRange, todayISO, type ViewType } from "@/lib/calendar-dates";
import { formatStaffName } from "@/lib/user-display";
import CalendarNav from "@/components/calendar/CalendarNav";
import BerthDayGrid, { type OccupancyBlock } from "@/components/calendar/BerthDayGrid";
import YearGrid from "@/components/calendar/YearGrid";
import Legend from "@/components/calendar/Legend";

const VALID_VIEWS: ViewType[] = ["day", "week", "month", "year"];

const BOOKING_STATUS_CLASS: Record<string, string> = {
  confirmed: "bg-green-500/90 text-white",
  tentative: "bg-amber-500/90 text-white",
  cancelled: "bg-zinc-400/80 text-white line-through",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const session = await auth();
  const editable = canWrite(session!.user.role);
  const params = await searchParams;
  const view: ViewType = VALID_VIEWS.includes(params.view as ViewType)
    ? (params.view as ViewType)
    : "week";
  const anchor = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayISO();

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
