"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function RecurrenceFields() {
  const [repeats, setRepeats] = useState(false);
  const [endType, setEndType] = useState<"count" | "date">("count");

  return (
    <div className="space-y-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <input
          id="repeats"
          name="repeats"
          type="checkbox"
          checked={repeats}
          onChange={(e) => setRepeats(e.target.checked)}
        />
        <label htmlFor="repeats" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Repeats
        </label>
      </div>

      {repeats && (
        <div className="space-y-3 pl-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Frequency</label>
              <select name="frequency" defaultValue="weekly" className={inputClass}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Every</label>
              <input name="interval" type="number" min={1} defaultValue={1} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Ends</label>
            <select
              name="endType"
              value={endType}
              onChange={(e) => setEndType(e.target.value as "count" | "date")}
              className={inputClass}
            >
              <option value="count">After N occurrences</option>
              <option value="date">On date</option>
            </select>
          </div>

          {endType === "count" ? (
            <div>
              <label className={labelClass}>Occurrences</label>
              <input
                name="endCount"
                type="number"
                min={1}
                max={200}
                defaultValue={10}
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>Until</label>
              <input name="endDate" type="date" className={inputClass} />
            </div>
          )}

          <p className="text-xs text-zinc-500">Limited to 200 occurrences.</p>
        </div>
      )}
    </div>
  );
}
