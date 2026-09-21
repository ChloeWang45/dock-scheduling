import { addDays } from "@/lib/calendar-dates";

export type Frequency = "daily" | "weekly" | "monthly";

// Hard cap so a badly-specified rule (e.g. "daily, until year 2100") can't
// generate an unbounded number of rows.
export const MAX_OCCURRENCES = 200;

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return toISODate(d);
}

function advance(dateStr: string, frequency: Frequency, interval: number): string {
  if (frequency === "daily") return addDays(dateStr, interval);
  if (frequency === "weekly") return addDays(dateStr, interval * 7);
  return addMonths(dateStr, interval);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

export type RecurrenceRule = {
  frequency: Frequency;
  interval: number;
  endType: "count" | "date";
  endCount?: number;
  endDate?: string;
};

export type Occurrence = { startDate: string; endDate: string };

// Converts a recurrence_series DB row into the shape RecurrenceFields
// expects for pre-filling the "edit this and following" rule editor.
export function seriesRuleFromRow(row: {
  frequency: Frequency;
  interval: number;
  endDate: string | null;
  endCount: number | null;
}): RecurrenceRule {
  return {
    frequency: row.frequency,
    interval: row.interval,
    endType: row.endDate ? "date" : "count",
    endDate: row.endDate ?? undefined,
    endCount: row.endCount ?? undefined,
  };
}

/**
 * Generates every occurrence's [startDate, endDate], starting from the
 * first occurrence's own dates (which set the per-occurrence duration).
 * Capped at MAX_OCCURRENCES regardless of the end condition.
 */
export function generateOccurrences(
  firstStartDate: string,
  firstEndDate: string,
  rule: RecurrenceRule,
): Occurrence[] {
  const durationDays = daysBetween(firstStartDate, firstEndDate);
  const occurrences: Occurrence[] = [];
  let cursor = firstStartDate;

  while (occurrences.length < MAX_OCCURRENCES) {
    if (rule.endType === "date" && rule.endDate && cursor > rule.endDate) break;

    occurrences.push({ startDate: cursor, endDate: addDays(cursor, durationDays) });

    if (rule.endType === "count" && rule.endCount && occurrences.length >= rule.endCount) {
      break;
    }

    cursor = advance(cursor, rule.frequency, rule.interval);
  }

  return occurrences;
}
