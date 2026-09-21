type Berth = {
  name: string;
  lengthFt: number | null;
  depthAtLowTideFt: number | null;
  widthFt: number | null;
  maxSimultaneousOccupants: number;
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
      <button
        type="submit"
        className="btn-primary"
      >
        Save
      </button>
    </form>
  );
}
