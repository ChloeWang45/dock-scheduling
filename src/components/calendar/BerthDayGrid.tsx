import Link from "next/link";
import type { ViewType } from "@/lib/calendar-dates";
import { formatDayLabel, todayISO } from "@/lib/calendar-dates";
import { assignLanes } from "@/lib/calendar-lanes";

export type BerthRow = { id: string; name: string; active: boolean };
export type BookingBlock = {
  id: string;
  berthId: string;
  startDate: string;
  endDate: string;
  status: "confirmed" | "tentative" | "cancelled";
  overridden: boolean;
  vesselName: string;
  staffLabel: string;
};

const LABEL_WIDTH = 180;
const LANE_HEIGHT = 26;
const MIN_ROW_HEIGHT = 40;

const STATUS_CLASS: Record<BookingBlock["status"], string> = {
  confirmed: "bg-green-500/90 text-white",
  tentative: "bg-amber-500/90 text-white",
  cancelled: "bg-zinc-400/80 text-white line-through",
};

function dayWidthFor(view: ViewType) {
  if (view === "day") return 220;
  if (view === "week") return 150;
  return 42;
}

export default function BerthDayGrid({
  view,
  days,
  berths,
  bookings,
}: {
  view: ViewType;
  days: string[];
  berths: BerthRow[];
  bookings: BookingBlock[];
}) {
  const dayWidth = dayWidthFor(view);
  const gridCols = `${LABEL_WIDTH}px repeat(${days.length}, ${dayWidth}px)`;
  const today = todayISO();

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div style={{ minWidth: LABEL_WIDTH + days.length * dayWidth }}>
        {/* Header */}
        <div
          className="grid border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="sticky left-0 z-10 bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            Berth
          </div>
          {days.map((day) => {
            const label = formatDayLabel(day, view);
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`border-l border-zinc-200 py-1 text-center text-xs dark:border-zinc-800 ${
                  isToday
                    ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <div>{label.top}</div>
                <div>{label.bottom}</div>
              </div>
            );
          })}
        </div>

        {/* Berth rows */}
        {berths.map((berth) => {
          const berthBookings = bookings.filter((b) => b.berthId === berth.id);
          const { laneOf, laneCount } = assignLanes(berthBookings);
          const rowHeight = Math.max(MIN_ROW_HEIGHT, laneCount * LANE_HEIGHT + 6);

          return (
            <div
              key={berth.id}
              className="grid border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="sticky left-0 z-10 flex items-center bg-white px-3 py-2 text-sm font-medium text-zinc-800 dark:bg-black dark:text-zinc-200">
                {berth.name}
              </div>
              <div
                className="relative"
                style={{ gridColumn: `2 / span ${days.length}`, height: rowHeight }}
              >
                {/* Click-to-book day backgrounds */}
                <div
                  className="absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
                >
                  {days.map((day) => (
                    <Link
                      key={day}
                      href={`/bookings/new?berthId=${berth.id}&date=${day}`}
                      className={`border-l border-zinc-100 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60 ${
                        day === today ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    />
                  ))}
                </div>

                {/* Booking bars */}
                {berthBookings.map((booking, i) => {
                  const clippedStart = booking.startDate < days[0] ? days[0] : booking.startDate;
                  const clippedEnd =
                    booking.endDate > days[days.length - 1]
                      ? days[days.length - 1]
                      : booking.endDate;
                  const startIdx = days.indexOf(clippedStart);
                  const endIdx = days.indexOf(clippedEnd);
                  const left = (startIdx / days.length) * 100;
                  const width = ((endIdx - startIdx + 1) / days.length) * 100;

                  return (
                    <Link
                      key={booking.id}
                      href={`/bookings/${booking.id}/edit`}
                      title={`${booking.vesselName} — ${booking.startDate} to ${booking.endDate} — ${booking.status}${booking.overridden ? " (overridden)" : ""} — booked by ${booking.staffLabel}`}
                      className={`absolute flex items-center overflow-hidden rounded px-1.5 text-xs font-medium shadow-sm ${STATUS_CLASS[booking.status]} ${
                        booking.overridden ? "ring-2 ring-red-500" : ""
                      }`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top: laneOf[i] * LANE_HEIGHT + 3,
                        height: LANE_HEIGHT - 4,
                      }}
                    >
                      <span className="truncate">{booking.vesselName}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
