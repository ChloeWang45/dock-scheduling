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
    <div className="table-shell-x">
      <div style={{ minWidth: LABEL_WIDTH + days.length * dayWidth }}>
        {/* Header */}
        <div
          className="grid border-b border-ink/15 bg-foam/40"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="sticky left-0 z-10 bg-foam/40 px-3 py-2 text-xs font-medium text-ink/70">
            Berth
          </div>
          {days.map((day) => {
            const label = formatDayLabel(day, view);
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`border-l border-ink/15 py-1 text-center text-xs ${
                  isToday ? "bg-wave/15 font-semibold text-wave" : "text-ink/60"
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
              className="grid border-b border-ink/15 last:border-b-0"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="sticky left-0 z-10 flex items-center bg-white px-3 py-2 text-sm font-medium text-ink">
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
                        href={`/schedule/new?berthId=${berth.id}&date=${day}`}
                        className={`border-l border-ink/10 transition-colors duration-150 hover:bg-foam/40 ${
                          day === today ? "bg-wave/10" : ""
                        }`}
                      />
                    ) : (
                      <div
                        key={day}
                        className={`border-l border-ink/10 ${day === today ? "bg-wave/10" : ""}`}
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
                  const barClass = `absolute flex items-center overflow-hidden rounded px-1.5 text-xs font-medium shadow-sm transition-transform duration-150 hover:-translate-y-px ${block.colorClass} ${
                    block.ringed ? "ring-2 ring-conflict" : ""
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
