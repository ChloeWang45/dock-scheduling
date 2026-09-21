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
        <label className="label-text">
          Name
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={vessel?.name}
          className="text-input"
        />
      </div>
      <div>
        <label className="label-text">
          Type
        </label>
        <select
          name="type"
          required
          defaultValue={vessel?.type ?? VESSEL_TYPES[0]}
          className="text-input"
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
          <label className="label-text">
            LOA (ft)
          </label>
          <input
            name="loaFt"
            type="number"
            step="any"
            defaultValue={vessel?.loaFt ?? ""}
            placeholder="unknown"
            className="text-input"
          />
        </div>
        <div>
          <label className="label-text">
            Draft (ft)
          </label>
          <input
            name="draftFt"
            type="number"
            step="any"
            defaultValue={vessel?.draftFt ?? ""}
            placeholder="unknown"
            className="text-input"
          />
        </div>
        <div>
          <label className="label-text">
            Beam (ft)
          </label>
          <input
            name="beamFt"
            type="number"
            step="any"
            defaultValue={vessel?.beamFt ?? ""}
            placeholder="unknown"
            className="text-input"
          />
        </div>
      </div>
      <div>
        <label className="label-text">
          Operator
        </label>
        <input
          name="operator"
          type="text"
          defaultValue={vessel?.operator ?? ""}
          className="text-input"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">
            Contact phone
          </label>
          <input
            name="contactPhone"
            type="text"
            defaultValue={vessel?.contactPhone ?? ""}
            className="text-input"
          />
        </div>
        <div>
          <label className="label-text">
            Contact email
          </label>
          <input
            name="contactEmail"
            type="email"
            defaultValue={vessel?.contactEmail ?? ""}
            className="text-input"
          />
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
