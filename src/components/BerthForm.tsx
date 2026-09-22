type Berth = {
  name: string;
  lengthFt: number | null;
  depthAtLowTideFt: number | null;
  widthFt: number | null;
  maxSimultaneousOccupants: number;
  loaBufferPct?: number | null;
  beamBufferPct?: number | null;
  ukcMarginFt?: number | null;
};

export default function BerthForm({
  berth,
  action,
}: {
  berth?: Berth;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label className="label-text">
          Name
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={berth?.name}
          className="text-input"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label-text">
            Length (ft)
          </label>
          <input
            name="lengthFt"
            type="number"
            step="any"
            defaultValue={berth?.lengthFt ?? ""}
            placeholder="unknown"
            className="text-input"
          />
        </div>
        <div>
          <label className="label-text">
            Depth at low tide (ft)
          </label>
          <input
            name="depthAtLowTideFt"
            type="number"
            step="any"
            defaultValue={berth?.depthAtLowTideFt ?? ""}
            placeholder="unknown"
            className="text-input"
          />
        </div>
        <div>
          <label className="label-text">
            Width (ft)
          </label>
          <input
            name="widthFt"
            type="number"
            step="any"
            defaultValue={berth?.widthFt ?? ""}
            placeholder="unknown"
            className="text-input"
          />
        </div>
      </div>
      <div>
        <label className="label-text">
          Max simultaneous occupants
        </label>
        <input
          name="maxSimultaneousOccupants"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={berth?.maxSimultaneousOccupants ?? 1}
          className="w-32 text-input"
        />
      </div>
      <div className="rounded border border-ink/15 p-4">
        <p className="label-text mb-3">
          Fit check overrides <span className="text-ink/50">(optional — blank uses the facility default from Settings)</span>
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label-text">LOA buffer (%)</label>
            <input
              name="loaBufferPct"
              type="number"
              step="any"
              min="0"
              max="99"
              defaultValue={berth?.loaBufferPct != null ? berth.loaBufferPct * 100 : ""}
              placeholder="default"
              className="text-input"
            />
          </div>
          <div>
            <label className="label-text">Beam buffer (%)</label>
            <input
              name="beamBufferPct"
              type="number"
              step="any"
              min="0"
              max="99"
              defaultValue={berth?.beamBufferPct != null ? berth.beamBufferPct * 100 : ""}
              placeholder="default"
              className="text-input"
            />
          </div>
          <div>
            <label className="label-text">UKC margin (ft)</label>
            <input
              name="ukcMarginFt"
              type="number"
              step="any"
              min="0"
              defaultValue={berth?.ukcMarginFt ?? ""}
              placeholder="default"
              className="text-input"
            />
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="btn-primary"
      >
        Save
      </button>
    </form>
  );
}
