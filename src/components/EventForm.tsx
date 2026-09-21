"use client";

import { useActionState, useEffect, useState } from "react";
import { checkEventConflicts, type EventFormState } from "@/app/(protected)/events/actions";
import RecurrenceFields, { type SeriesRule } from "@/components/RecurrenceFields";

type Berth = { id: string; name: string; active: boolean };
type Event = {
  berthId: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  organizer: string | null;
  notes: string | null;
  seriesId?: string | null;
};

const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function EventForm({
  berths,
  event,
  seriesRule,
  defaultBerthId,
  defaultDate,
  excludeEventId,
  action,
}: {
  berths: Berth[];
  event?: Event;
  seriesRule?: SeriesRule;
  defaultBerthId?: string;
  defaultDate?: string;
  excludeEventId?: string;
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
}) {
  const [state, formAction, isPending] = useActionState<EventFormState, FormData>(action, undefined);

  const [berthId, setBerthId] = useState(event?.berthId ?? defaultBerthId ?? berths[0]?.id ?? "");
  const [startDate, setStartDate] = useState(event?.startDate ?? defaultDate ?? "");
  const [endDate, setEndDate] = useState(event?.endDate ?? defaultDate ?? "");
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
        const result = await checkEventConflicts({
          berthId,
          startDate,
          endDate,
          excludeEventId,
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
  }, [berthId, startDate, endDate, excludeEventId]);

  const hasIssues = conflicts.length > 0;
  const canSave = !hasIssues || (overridden && overrideNote.trim() !== "");

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      {event?.seriesId && (
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
        <label className={labelClass}>Name</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={event?.name}
          placeholder="e.g. Community sail day"
          className={inputClass}
        />
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start time (optional)</label>
          <input
            name="startTime"
            type="time"
            defaultValue={event?.startTime ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End time (optional)</label>
          <input
            name="endTime"
            type="time"
            defaultValue={event?.endTime ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      {!event && <RecurrenceFields />}
      {event?.seriesId && scope === "following" && (
        <RecurrenceFields alwaysOn initial={seriesRule} />
      )}

      <div>
        <label className={labelClass}>Organizer</label>
        <input
          name="organizer"
          type="text"
          defaultValue={event?.organizer ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" rows={3} defaultValue={event?.notes ?? ""} className={inputClass} />
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
