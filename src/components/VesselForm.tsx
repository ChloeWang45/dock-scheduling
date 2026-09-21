const VESSEL_TYPES = ["R/V", "OSV", "F/V", "M/Y", "Barge"] as const;

type Vessel = {
  name: string;
  type: string;
  loaFt: number | null;
  draftFt: number | null;
  beamFt: number | null;
  operator: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

export default function VesselForm({
  vessel,
  action,
}: {
  vessel?: Vessel;
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
          defaultValue={vessel?.name}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type
        </label>
        <select
          name="type"
          required
          defaultValue={vessel?.type ?? VESSEL_TYPES[0]}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {VESSEL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            LOA (ft)
          </label>
          <input
            name="loaFt"
            type="number"
            step="any"
            defaultValue={vessel?.loaFt ?? ""}
            placeholder="unknown"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Draft (ft)
          </label>
          <input
            name="draftFt"
            type="number"
            step="any"
            defaultValue={vessel?.draftFt ?? ""}
            placeholder="unknown"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Beam (ft)
          </label>
          <input
            name="beamFt"
            type="number"
            step="any"
            defaultValue={vessel?.beamFt ?? ""}
            placeholder="unknown"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Operator
        </label>
        <input
          name="operator"
          type="text"
          defaultValue={vessel?.operator ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Contact phone
          </label>
          <input
            name="contactPhone"
            type="text"
            defaultValue={vessel?.contactPhone ?? ""}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Contact email
          </label>
          <input
            name="contactEmail"
            type="email"
            defaultValue={vessel?.contactEmail ?? ""}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
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
