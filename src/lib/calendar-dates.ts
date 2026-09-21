export type ViewType = "day" | "week" | "month" | "year";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

function startOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return toISODate(d);
}

function startOfMonth(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(1);
  return toISODate(d);
}

function daysInMonth(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00Z");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function getVisibleRange(
  view: ViewType,
  anchor: string,
): { start: string; end: string; days: string[] } {
  if (view === "day") {
    return { start: anchor, end: anchor, days: [anchor] };
  }
  if (view === "week") {
    const start = startOfWeek(anchor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return { start, end: days[6], days };
  }
  if (view === "month") {
    const start = startOfMonth(anchor);
    const count = daysInMonth(anchor);
    const days = Array.from({ length: count }, (_, i) => addDays(start, i));
    return { start, end: days[count - 1], days };
  }
  // year: caller uses a month-rollup view instead of a day array.
  const year = anchor.slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31`, days: [] };
}

export function shiftAnchor(view: ViewType, anchor: string, direction: 1 | -1): string {
  if (view === "day") return addDays(anchor, direction);
  if (view === "week") return addDays(anchor, direction * 7);
  const d = new Date(anchor + "T00:00:00Z");
  if (view === "month") {
    d.setUTCMonth(d.getUTCMonth() + direction);
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + direction);
  }
  return toISODate(d);
}

export function formatDayLabel(dateStr: string, view: ViewType): { top: string; bottom: string } {
  const d = new Date(dateStr + "T00:00:00Z");
  const weekday = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const day = d.getUTCDate();
  if (view === "month") {
    return { top: String(day), bottom: weekday[0] };
  }
  return { top: weekday, bottom: String(day) };
}

export function formatRangeLabel(view: ViewType, anchor: string): string {
  const d = new Date(anchor + "T00:00:00Z");
  if (view === "day") {
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  if (view === "week") {
    const { start, end } = getVisibleRange("week", anchor);
    const s = new Date(start + "T00:00:00Z");
    const e = new Date(end + "T00:00:00Z");
    const startLabel = s.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    const endLabel = e.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    return `${startLabel} – ${endLabel}`;
  }
  if (view === "month") {
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return anchor.slice(0, 4);
}
