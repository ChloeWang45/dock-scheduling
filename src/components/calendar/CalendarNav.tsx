import Link from "next/link";
import type { ViewType } from "@/lib/calendar-dates";
import { formatRangeLabel, shiftAnchor, todayISO } from "@/lib/calendar-dates";

const VIEWS: ViewType[] = ["day", "week", "month", "year"];

function hrefFor(view: ViewType, date: string) {
  return `/calendar?view=${view}&date=${date}`;
}

export default function CalendarNav({ view, anchor }: { view: ViewType; anchor: string }) {
  const prev = shiftAnchor(view, anchor, -1);
  const next = shiftAnchor(view, anchor, 1);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(view, prev)}
          className="btn-secondary"
        >
          ← Prev
        </Link>
        <Link
          href={hrefFor(view, todayISO())}
          className="btn-secondary"
        >
          Today
        </Link>
        <Link
          href={hrefFor(view, next)}
          className="btn-secondary"
        >
          Next →
        </Link>
        <span className="ml-2 text-sm font-medium text-ink">
          {formatRangeLabel(view, anchor)}
        </span>
      </div>
      <div className="flex items-center gap-1 rounded border border-ink/20 p-0.5">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={hrefFor(v, anchor)}
            className={`rounded px-3 py-1 text-sm capitalize ${
              v === view
                ? "bg-wave text-ink-inverse"
                : "text-ink/70 hover:bg-foam/60"
            }`}
          >
            {v}
          </Link>
        ))}
      </div>
    </div>
  );
}
