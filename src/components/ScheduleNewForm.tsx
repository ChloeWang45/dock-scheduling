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
        <label className="label-text">
          Type
        </label>
        <div className="flex items-center gap-1 rounded-full border border-ink/20 p-1 w-fit">
          {(["booking", "event", "closure"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors duration-150 ${
                type === t
                  ? "bg-wave text-ink-inverse"
                  : "text-ink/70 hover:bg-foam/60"
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
