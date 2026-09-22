// Shared relevance ranking for the schedule/calendar search boxes: a
// direct hit on the title ranks above a hit on a secondary field, and
// among equally-relevant results the one closest to today (whether past
// or future) sorts first.
export type SearchableEntry = {
  title: string;
  subtitle: string | null;
  berthName: string;
  statusLabel: string;
  startDate: string;
};

function fieldScore(entry: SearchableEntry, needle: string): number {
  const title = entry.title.toLowerCase();
  if (title === needle) return 0;
  if (title.startsWith(needle)) return 1;
  if (title.includes(needle)) return 2;
  if (entry.subtitle && entry.subtitle.toLowerCase().includes(needle)) return 3;
  if (entry.berthName.toLowerCase().includes(needle)) return 4;
  if (entry.statusLabel.toLowerCase().includes(needle)) return 5;
  return 6;
}

export function matchesQuery(entry: SearchableEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  return fieldScore(entry, needle) < 6;
}

function dayDistance(dateStr: string, todayISO: string): number {
  return Math.abs(Date.parse(`${dateStr}T00:00:00Z`) - Date.parse(`${todayISO}T00:00:00Z`));
}

export function compareByRelevance<T extends SearchableEntry>(
  query: string,
  todayISO: string,
): (a: T, b: T) => number {
  const needle = query.trim().toLowerCase();
  return (a, b) => {
    const diff = fieldScore(a, needle) - fieldScore(b, needle);
    if (diff !== 0) return diff;
    return dayDistance(a.startDate, todayISO) - dayDistance(b.startDate, todayISO);
  };
}
