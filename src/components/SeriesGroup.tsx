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
          <td colSpan={columnCount} className="bg-zinc-50 px-4 py-1.5 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200"
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
