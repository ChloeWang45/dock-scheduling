// Collapses rows belonging to the same recurring series down to one
// representative ("primary") row, so a long series doesn't dominate a list
// page. The primary is the soonest upcoming occurrence, or the most recent
// past one if the whole series is already over.
export function groupBySeries<T extends { id: string; seriesId: string | null; startDate: string }>(
  rows: T[],
  todayISO: string,
): { primary: T; extras: T[] }[] {
  const standalone: T[] = [];
  const seriesGroups = new Map<string, T[]>();

  for (const row of rows) {
    if (!row.seriesId) {
      standalone.push(row);
      continue;
    }
    const existing = seriesGroups.get(row.seriesId);
    if (existing) existing.push(row);
    else seriesGroups.set(row.seriesId, [row]);
  }

  const result: { primary: T; extras: T[] }[] = standalone.map((row) => ({
    primary: row,
    extras: [],
  }));

  for (const group of seriesGroups.values()) {
    const upcoming = group
      .filter((r) => r.startDate >= todayISO)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    const primary =
      upcoming[0] ?? [...group].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    const extras = group
      .filter((r) => r.id !== primary.id)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    result.push({ primary, extras });
  }

  result.sort((a, b) => b.primary.startDate.localeCompare(a.primary.startDate));
  return result;
}
