"use client";

import { useActionState, useEffect, useState } from "react";
import { checkClosureConflicts, type ClosureFormState } from "@/app/(protected)/closures/actions";
import RecurrenceFields, { type SeriesRule } from "@/components/RecurrenceFields";

type Berth = { id: string; name: string; active: boolean };
type Closure = {
  berthId: string;
  startDate: string;
  endDate: string;
  reason: string;
  seriesId?: string | null;
};

const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function ClosureForm({
  berths,
  closure,
  seriesRule,
  defaultBerthId,
  defaultDate,
  excludeClosureId,
  action,
}: {
  berths: Berth[];
  closure?: Closure;
  seriesRule?: SeriesRule;
  defaultBerthId?: string;
  defaultDate?: string;
  excludeClosureId?: string;
  action: (state: ClosureFormState, formData: FormData) => Promise<ClosureFormState>;
}) {
  const [state, formAction, isPending] = useActionState<ClosureFormState, FormData>(
    action,
    undefined,
  );

  const [berthId, setBerthId] = useState(closure?.berthId ?? defaultBerthId ?? berths[0]?.id ?? "");
  const [startDate, setStartDate] = useState(closure?.startDate ?? defaultDate ?? "");
  const [endDate, setEndDate] = useState(closure?.endDate ?? defaultDate ?? "");
  const [overridden, setOverridden] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [scope, setScope] = useState<"this" | "following">("this");

  const [conflicts, setConflicts] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!berthId || !startDate || !endDate) {
      setConflicts([]);
      return;
    }
    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await checkClosureConflicts({
          berthId,
          startDate,
          endDate,
          excludeClosureId,
        });
        if (!cancelled) setConflicts(result.map((c) => c.message));
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [berthId, startDate, endDate, excludeClosureId]);

  const hasIssues = conflicts.length > 0;
  const canSave = !hasIssues || (overridden && overrideNote.trim() !== "");

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      {closure?.seriesId && (
        <div className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
          <p className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-200">
            Part of a recurring series
          </p>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200">
              <input
                type="radio"
                name="scope"
                value="this"
                checked={scope === "this"}
                onChange={() => setScope("this")}
              />
              This occurrence only
            </label>
            <label className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200">
              <input
                type="radio"
                name="scope"
                value="following"
                checked={scope === "following"}
                onChange={() => setScope("following")}
              />
              This and all following occurrences
            </label>
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Berth</label>
        <select
          name="berthId"
          required
          value={berthId}
          onChange={(e) => setBerthId(e.target.value)}
          className={inputClass}
        >
          {berths.map((b) => (
            <option key={b.id} value={b.id} disabled={!b.active}>
              {b.name}
              {!b.active ? " (inactive)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start date</label>
          <input
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End date</label>
          <input
            name="endDate"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {!closure && <RecurrenceFields />}
      {closure?.seriesId && scope === "following" && (
        <RecurrenceFields alwaysOn initial={seriesRule} />
      )}

      <div>
        <label className={labelClass}>Reason</label>
        <textarea
          name="reason"
          required
          rows={2}
          defaultValue={closure?.reason}
          placeholder="e.g. Dock maintenance — restricted access"
          className={inputClass}
        />
      </div>

      {checking && <p className="text-sm text-zinc-500">Checking for conflicts…</p>}

      {hasIssues && (
        <div className="space-y-2 rounded border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
          {conflicts.map((msg, i) => (
            <p key={i} className="text-sm text-red-700 dark:text-red-300">
              ⚠ {msg}
            </p>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="overridden"
              name="overridden"
              type="checkbox"
              checked={overridden}
              onChange={(e) => setOverridden(e.target.checked)}
            />
            <label htmlFor="overridden" className="text-sm text-red-800 dark:text-red-200">
              Override and save anyway
            </label>
          </div>
          {overridden && (
            <textarea
              name="overrideNote"
              required
              placeholder="Justification for overriding this warning (required)"
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              className={inputClass}
              rows={2}
            />
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSave || isPending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
