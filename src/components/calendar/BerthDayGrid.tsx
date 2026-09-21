import Link from "next/link";
import type { ViewType } from "@/lib/calendar-dates";
import { formatDayLabel, todayISO } from "@/lib/calendar-dates";
import { assignLanes } from "@/lib/calendar-lanes";

export type BerthRow = { id: string; name: string; active: boolean };

// A single bar on the grid — a Booking, Event, or Closure, pre-formatted
// by the caller so this component stays agnostic to which.
export type OccupancyBlock = {
  id: string;
  berthId: string;
  startDate: string;
  endDate: string;
  label: string;
  title: string;
  colorClass: string;
  ringed: boolean;
  href: string;
};

const LABEL_WIDTH = 180;
const LANE_HEIGHT = 26;
const MIN_ROW_HEIGHT = 40;

function dayWidthFor(view: ViewType) {
  if (view === "day") return 220;
  if (view === "week") return 150;
  return 42;
}

export default function BerthDayGrid({
  view,
  days,
  berths,
  blocks,
  editable,
}: {
  view: ViewType;
  days: string[];
  berths: BerthRow[];
  blocks: OccupancyBlock[];
  editable: boolean;
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
          const berthBlocks = blocks.filter((b) => b.berthId === berth.id);
          const { laneOf, laneCount } = assignLanes(berthBlocks);
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
                {/* Click-to-book day backgrounds (staff/admin only) */}
                <div
                  className="absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
                >
                  {days.map((day) =>
                    editable ? (
                      <Link
                        key={day}
                        href={`/bookings/new?berthId=${berth.id}&date=${day}`}
                        className={`border-l border-zinc-100 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60 ${
                          day === today ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                      />
                    ) : (
                      <div
                        key={day}
                        className={`border-l border-zinc-100 dark:border-zinc-900 ${
                          day === today ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                      />
                    ),
                  )}
                </div>

                {/* Occupancy bars */}
                {berthBlocks.map((block, i) => {
                  const clippedStart = block.startDate < days[0] ? days[0] : block.startDate;
                  const clippedEnd =
                    block.endDate > days[days.length - 1] ? days[days.length - 1] : block.endDate;
                  const startIdx = days.indexOf(clippedStart);
                  const endIdx = days.indexOf(clippedEnd);
                  const left = (startIdx / days.length) * 100;
                  const width = ((endIdx - startIdx + 1) / days.length) * 100;

                  const barStyle = {
                    left: `${left}%`,
                    width: `${width}%`,
                    top: laneOf[i] * LANE_HEIGHT + 3,
                    height: LANE_HEIGHT - 4,
                  };
                  const barClass = `absolute flex items-center overflow-hidden rounded px-1.5 text-xs font-medium shadow-sm ${block.colorClass} ${
                    block.ringed ? "ring-2 ring-red-500" : ""
                  }`;

                  return editable ? (
                    <Link key={block.id} href={block.href} title={block.title} className={barClass} style={barStyle}>
                      <span className="truncate">{block.label}</span>
                    </Link>
                  ) : (
                    <div key={block.id} title={block.title} className={barClass} style={barStyle}>
                      <span className="truncate">{block.label}</span>
                    </div>
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
