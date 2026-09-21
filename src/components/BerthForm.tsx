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
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={berth?.name}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Length (ft)
          </label>
          <input
            name="lengthFt"
            type="number"
            step="any"
            defaultValue={berth?.lengthFt ?? ""}
            placeholder="unknown"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Depth at low tide (ft)
          </label>
          <input
            name="depthAtLowTideFt"
            type="number"
            step="any"
            defaultValue={berth?.depthAtLowTideFt ?? ""}
            placeholder="unknown"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Width (ft)
          </label>
          <input
            name="widthFt"
            type="number"
            step="any"
            defaultValue={berth?.widthFt ?? ""}
            placeholder="unknown"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Max simultaneous occupants
        </label>
        <input
          name="maxSimultaneousOccupants"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={berth?.maxSimultaneousOccupants ?? 1}
          className="w-32 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Save
      </button>
    </form>
  );
}
