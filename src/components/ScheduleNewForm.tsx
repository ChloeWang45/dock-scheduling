"use client";

import { useState } from "react";
import BookingForm from "@/components/BookingForm";
import EventForm from "@/components/EventForm";
import ClosureForm from "@/components/ClosureForm";
import { createBooking } from "@/app/(protected)/bookings/actions";
import { createEvent } from "@/app/(protected)/events/actions";
import { createClosure } from "@/app/(protected)/closures/actions";

type Berth = { id: string; name: string; active: boolean };
type Vessel = { id: string; name: string; active: boolean };
type EntryType = "booking" | "event" | "closure";

export default function ScheduleNewForm({
  berths,
  vessels,
  defaultBerthId,
  defaultDate,
  defaultType,
}: {
  berths: Berth[];
  vessels: Vessel[];
  defaultBerthId?: string;
  defaultDate?: string;
  defaultType?: EntryType;
}) {
  const [type, setType] = useState<EntryType>(defaultType ?? "booking");

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type
        </label>
        <div className="flex items-center gap-1 rounded border border-zinc-300 p-0.5 w-fit dark:border-zinc-700">
          {(["booking", "event", "closure"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded px-4 py-1.5 text-sm capitalize ${
                type === t
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {type === "booking" && (
        <BookingForm
          berths={berths}
          vessels={vessels}
          defaultBerthId={defaultBerthId}
          defaultDate={defaultDate}
          action={createBooking}
        />
      )}
      {type === "event" && (
        <EventForm
          berths={berths}
          defaultBerthId={defaultBerthId}
          defaultDate={defaultDate}
          action={createEvent}
        />
      )}
      {type === "closure" && (
        <ClosureForm
          berths={berths}
          defaultBerthId={defaultBerthId}
          defaultDate={defaultDate}
          action={createClosure}
        />
      )}
    </div>
  );
}
