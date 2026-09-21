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
          className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          ← Prev
        </Link>
        <Link
          href={hrefFor(view, todayISO())}
          className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Today
        </Link>
        <Link
          href={hrefFor(view, next)}
          className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Next →
        </Link>
        <span className="ml-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {formatRangeLabel(view, anchor)}
        </span>
      </div>
      <div className="flex items-center gap-1 rounded border border-zinc-300 p-0.5 dark:border-zinc-700">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={hrefFor(v, anchor)}
            className={`rounded px-3 py-1 text-sm capitalize ${
              v === view
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {v}
          </Link>
        ))}
      </div>
    </div>
  );
}
