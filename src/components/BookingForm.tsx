"use client";

import { useActionState, useEffect, useState } from "react";
import { checkBookingIssues, type BookingFormState } from "@/app/(protected)/bookings/actions";
import RecurrenceFields, { type SeriesRule } from "@/components/RecurrenceFields";

type Berth = { id: string; name: string; active: boolean };
type Vessel = { id: string; name: string; active: boolean };
type Booking = {
  berthId: string;
  vesselId: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  arrivalTime: string | null;
  departureTime: string | null;
  status: string;
  notes: string | null;
  seriesId?: string | null;
};

const inputClass =
  "text-input";
const labelClass = "label-text";

export default function BookingForm({
  berths,
  vessels,
  booking,
  seriesRule,
  defaultBerthId,
  defaultDate,
  excludeBookingId,
  action,
}: {
  berths: Berth[];
  vessels: Vessel[];
  booking?: Booking;
  seriesRule?: SeriesRule;
  defaultBerthId?: string;
  defaultDate?: string;
  excludeBookingId?: string;
  action: (state: BookingFormState, formData: FormData) => Promise<BookingFormState>;
}) {
  const [state, formAction, isPending] = useActionState<BookingFormState, FormData>(
    action,
    undefined,
  );

  const [berthId, setBerthId] = useState(
    booking?.berthId ?? defaultBerthId ?? berths[0]?.id ?? "",
  );
  const [vesselId, setVesselId] = useState(booking?.vesselId ?? vessels[0]?.id ?? "");
  const [startDate, setStartDate] = useState(booking?.startDate ?? defaultDate ?? "");
  const [endDate, setEndDate] = useState(booking?.endDate ?? defaultDate ?? "");
  const [isAllDay, setIsAllDay] = useState(booking?.isAllDay ?? true);
  const [overridden, setOverridden] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [scope, setScope] = useState<"this" | "following">("this");

  const [issues, setIssues] = useState<{ conflicts: string[]; fitIssues: string[] }>({
    conflicts: [],
    fitIssues: [],
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!berthId || !vesselId || !startDate || !endDate) {
      setIssues({ conflicts: [], fitIssues: [] });
      return;
    }
    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await checkBookingIssues({
          berthId,
          vesselId,
          startDate,
          endDate,
          excludeBookingId,
        });
        if (!cancelled) {
          setIssues({
            conflicts: result.conflicts.map((c) => c.message),
            fitIssues: result.fitIssues
              .filter((f) => f.status === "violation")
              .map((f) => f.message),
          });
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [berthId, vesselId, startDate, endDate, excludeBookingId]);

  const hasIssues = issues.conflicts.length > 0 || issues.fitIssues.length > 0;
  const canSave = !hasIssues || (overridden && overrideNote.trim() !== "");

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error && (
        <p className="banner-error">
          {state.error}
        </p>
      )}

      {booking?.seriesId && (
        <div className="rounded border border-wave/25 bg-wave/10 p-3">
          <p className="mb-2 text-sm font-medium text-abyss">
            Part of a recurring series
          </p>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm text-abyss">
              <input
                type="radio"
                name="scope"
                value="this"
                checked={scope === "this"}
                onChange={() => setScope("this")}
              />
              This occurrence only
            </label>
            <label className="flex items-center gap-2 text-sm text-abyss">
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

      <div>
        <label className={labelClass}>Vessel</label>
        <select
          name="vesselId"
          required
          value={vesselId}
          onChange={(e) => setVesselId(e.target.value)}
          className={inputClass}
        >
          {vessels.map((v) => (
            <option key={v.id} value={v.id} disabled={!v.active}>
              {v.name}
              {!v.active ? " (inactive)" : ""}
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

      {!booking && <RecurrenceFields />}
      {booking?.seriesId && scope === "following" && (
        <RecurrenceFields alwaysOn initial={seriesRule} />
      )}

      <div className="flex items-center gap-2">
        <input
          id="isAllDay"
          name="isAllDay"
          type="checkbox"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
        />
        <label htmlFor="isAllDay" className="text-sm text-ink/80">
          Full day(s)
        </label>
      </div>

      {!isAllDay && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Arrival time</label>
            <input
              name="arrivalTime"
              type="time"
              required={!isAllDay}
              defaultValue={booking?.arrivalTime ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Departure time</label>
            <input
              name="departureTime"
              type="time"
              required={!isAllDay}
              defaultValue={booking?.departureTime ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Status</label>
        <select
          name="status"
          defaultValue={booking?.status ?? "confirmed"}
          className={inputClass}
        >
          <option value="confirmed">Confirmed</option>
          <option value="tentative">Tentative</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={booking?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {checking && <p className="text-sm text-ink/60">Checking for conflicts…</p>}

      {hasIssues && (
        <div className="space-y-2 rounded border border-conflict/25 bg-conflict/10 p-3">
          {issues.conflicts.map((msg, i) => (
            <p key={`c-${i}`} className="text-sm text-conflict">
              ⚠ {msg}
            </p>
          ))}
          {issues.fitIssues.map((msg, i) => (
            <p key={`f-${i}`} className="text-sm text-conflict">
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
            <label htmlFor="overridden" className="text-sm text-conflict">
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
        className="btn-primary"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
