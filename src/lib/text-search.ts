// Simple relevance ranking for plain-text list search (berths, vessels,
// users): exact match, then starts-with, then contains, checked across
// whichever fields the caller passes, in priority order.
function fieldScore(fields: (string | null | undefined)[], needle: string): number {
  let best = 4;
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (!f) continue;
    const v = f.toLowerCase();
    let score: number;
    if (v === needle) score = 0;
    else if (v.startsWith(needle)) score = 1;
    else if (v.includes(needle)) score = 2;
    else continue;
    // Earlier fields matter more than later ones for equal match quality.
    const weighted = score + i * 0.1;
    if (weighted < best) best = weighted;
  }
  return best;
}

export function matchesText(fields: (string | null | undefined)[], query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  return fieldScore(fields, needle) < 4;
}

export function compareByTextRelevance<T>(
  fieldsOf: (item: T) => (string | null | undefined)[],
  query: string,
): (a: T, b: T) => number {
  const needle = query.trim().toLowerCase();
  return (a, b) => fieldScore(fieldsOf(a), needle) - fieldScore(fieldsOf(b), needle);
}
