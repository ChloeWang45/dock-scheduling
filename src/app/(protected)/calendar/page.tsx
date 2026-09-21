import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { berths, bookings, users, vessels } from "@/db/schema";
import { getVisibleRange, todayISO, type ViewType } from "@/lib/calendar-dates";
import { formatStaffName } from "@/lib/user-display";
import CalendarNav from "@/components/calendar/CalendarNav";
import BerthDayGrid from "@/components/calendar/BerthDayGrid";
import YearGrid from "@/components/calendar/YearGrid";
import Legend from "@/components/calendar/Legend";

const VALID_VIEWS: ViewType[] = ["day", "week", "month", "year"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const view: ViewType = VALID_VIEWS.includes(params.view as ViewType)
    ? (params.view as ViewType)
    : "week";
  const anchor = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayISO();

  const { start, end, days } = getVisibleRange(view, anchor);

  const [allBerths, rangeBookings] = await Promise.all([
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
  ]);

  const bookingBlocks = rangeBookings.map((b) => ({
    id: b.id,
    berthId: b.berthId,
    startDate: b.startDate,
    endDate: b.endDate,
    status: b.status,
    overridden: b.overridden,
    vesselName: b.vesselName,
    staffLabel: formatStaffName(b.staffName, b.staffTitle, b.staffRole),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Calendar</h1>
      </div>
      <CalendarNav view={view} anchor={anchor} />
      <Legend />
      {view === "year" ? (
        <YearGrid year={anchor.slice(0, 4)} berths={allBerths} bookings={bookingBlocks} />
      ) : (
        <BerthDayGrid view={view} days={days} berths={allBerths} bookings={bookingBlocks} />
      )}
    </div>
  );
}
