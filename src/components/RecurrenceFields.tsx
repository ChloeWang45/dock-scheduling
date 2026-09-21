"use client";

import { useState } from "react";

const inputClass =
  "text-input";
const labelClass = "label-text";

export type SeriesRule = {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  endType: "count" | "date";
  endCount?: number | null;
  endDate?: string | null;
};

export default function RecurrenceFields({
  initial,
  alwaysOn,
}: {
  initial?: SeriesRule;
  alwaysOn?: boolean;
}) {
  const [repeats, setRepeats] = useState(Boolean(alwaysOn));
  const [endType, setEndType] = useState<"count" | "date">(initial?.endType ?? "count");

  const showFields = alwaysOn || repeats;

  return (
    <div className="space-y-3 rounded border border-ink/15 p-3">
      {!alwaysOn && (
        <div className="flex items-center gap-2">
          <input
            id="repeats"
            name="repeats"
            type="checkbox"
            checked={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
          />
          <label htmlFor="repeats" className="text-sm font-medium text-ink/80">
            Repeats
          </label>
        </div>
      )}
      {!alwaysOn && repeats && (
        <p className="pl-6 text-xs text-ink/60">
          The dates above are for the first occurrence only (and set how many days each
          occurrence lasts) — the fields below control how often it repeats and when the
          series ends.
        </p>
      )}

      {showFields && (
        <div className={alwaysOn ? "space-y-3" : "space-y-3 pl-6"}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Frequency</label>
              <select name="frequency" defaultValue={initial?.frequency ?? "weekly"} className={inputClass}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Every</label>
              <input
                name="interval"
                type="number"
                min={1}
                defaultValue={initial?.interval ?? 1}
                className={inputClass}
              />
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
                defaultValue={initial?.endCount ?? 10}
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>Repeat until (last occurrence starts on or before)</label>
              <input
                name="endDate"
                type="date"
                defaultValue={initial?.endDate ?? ""}
                className={inputClass}
              />
            </div>
          )}

          <p className="text-xs text-ink/60">Limited to 200 occurrences.</p>
        </div>
      )}
    </div>
  );
}
