"use client";

import { useActionState } from "react";
import { updateFitSettings, type SettingsFormState } from "@/app/(protected)/settings/actions";

export default function SettingsForm({
  loaBufferPct,
  beamBufferPct,
  ukcMarginFt,
}: {
  loaBufferPct: number;
  beamBufferPct: number;
  ukcMarginFt: number;
}) {
  const [state, formAction, isPending] = useActionState<SettingsFormState, FormData>(
    updateFitSettings,
    undefined,
  );

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      {state?.error && <p className="banner-error">{state.error}</p>}
      {state?.success && <p className="banner-success">{state.success}</p>}

      <div>
        <label className="label-text">LOA buffer (%)</label>
        <input
          name="loaBufferPct"
          type="number"
          step="0.1"
          min="0"
          max="99"
          required
          defaultValue={(loaBufferPct * 100).toString()}
          className="text-input"
        />
        <p className="mt-1 text-xs text-ink/50">
          A vessel&apos;s LOA can use at most this much less than the berth&apos;s full length.
        </p>
      </div>

      <div>
        <label className="label-text">Beam buffer (%)</label>
        <input
          name="beamBufferPct"
          type="number"
          step="0.1"
          min="0"
          max="99"
          required
          defaultValue={(beamBufferPct * 100).toString()}
          className="text-input"
        />
        <p className="mt-1 text-xs text-ink/50">
          Same idea, for beam against berth width (only checked when a berth has a width on file).
        </p>
      </div>

      <div>
        <label className="label-text">Under-keel clearance margin (ft)</label>
        <input
          name="ukcMarginFt"
          type="number"
          step="0.1"
          min="0"
          required
          defaultValue={ukcMarginFt.toString()}
          className="text-input"
        />
        <p className="mt-1 text-xs text-ink/50">
          Added to a vessel&apos;s draft; the total must not exceed the berth&apos;s depth at low
          tide.
        </p>
      </div>

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
