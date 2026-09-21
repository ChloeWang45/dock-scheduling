"use client";

import { useState } from "react";

export default function SeriesGroup({
  primaryRow,
  extraRows,
  extraCount,
  columnCount,
}: {
  primaryRow: React.ReactNode;
  extraRows: React.ReactNode;
  extraCount: number;
  columnCount: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {primaryRow}
      {extraCount > 0 && (
        <tr>
          <td colSpan={columnCount} className="bg-foam/20 px-4 py-1.5">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs font-medium text-ink/60 transition-colors hover:text-ink"
            >
              <span className={`inline-block transition-transform ${expanded ? "rotate-90" : ""}`}>
                ▶
              </span>
              {expanded
                ? "Hide other occurrences"
                : `Show ${extraCount} other occurrence${extraCount > 1 ? "s" : ""} in this series`}
            </button>
          </td>
        </tr>
      )}
      {expanded && extraRows}
    </>
  );
}
