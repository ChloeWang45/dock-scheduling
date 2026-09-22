import { requireAdmin } from "@/lib/authz";
import { getFitDefaults } from "@/lib/fit-settings";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  await requireAdmin();
  const defaults = await getFitDefaults();

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="mt-1 text-sm text-ink/60">
          Facility-wide defaults for the vessel/berth fit check. A berth with its own buffer or
          margin set on its edit page uses that instead of these defaults.
        </p>
      </div>
      <SettingsForm
        loaBufferPct={defaults.loaBufferPct}
        beamBufferPct={defaults.beamBufferPct}
        ukcMarginFt={defaults.ukcMarginFt}
      />
    </div>
  );
}
