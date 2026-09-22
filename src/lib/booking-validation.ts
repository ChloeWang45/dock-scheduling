import { berths, vessels } from "@/db/schema";
import { HARD_CODED_FIT_DEFAULTS, type FitDefaults } from "@/lib/fit-settings";

type Berth = typeof berths.$inferSelect;
type Vessel = typeof vessels.$inferSelect;

export type FitIssue = {
  field: "loa" | "draft" | "beam";
  status: "violation" | "unverified";
  message: string;
};

export function checkFit(vessel: Vessel, berth: Berth, defaults: FitDefaults = HARD_CODED_FIT_DEFAULTS): FitIssue[] {
  const issues: FitIssue[] = [];
  const loaBuffer = berth.loaBufferPct ?? defaults.loaBufferPct;
  const beamBuffer = berth.beamBufferPct ?? defaults.beamBufferPct;
  const ukcMargin = berth.ukcMarginFt ?? defaults.ukcMarginFt;

  if (vessel.loaFt == null || berth.lengthFt == null) {
    issues.push({
      field: "loa",
      status: "unverified",
      message: "LOA not verified: vessel or berth length is missing.",
    });
  } else {
    const maxLoa = berth.lengthFt * (1 - loaBuffer);
    if (vessel.loaFt > maxLoa) {
      issues.push({
        field: "loa",
        status: "violation",
        message: `Vessel LOA (${vessel.loaFt} ft) exceeds berth capacity of ${maxLoa.toFixed(1)} ft (${berth.lengthFt} ft berth, ${(loaBuffer * 100).toFixed(0)}% buffer).`,
      });
    }
  }

  if (vessel.draftFt == null || berth.depthAtLowTideFt == null) {
    issues.push({
      field: "draft",
      status: "unverified",
      message: "Draft not verified: vessel draft or berth depth at low tide is missing.",
    });
  } else {
    const required = vessel.draftFt + ukcMargin;
    if (required > berth.depthAtLowTideFt) {
      issues.push({
        field: "draft",
        status: "violation",
        message: `Vessel draft (${vessel.draftFt} ft) plus ${ukcMargin} ft under-keel clearance exceeds berth depth at low tide (${berth.depthAtLowTideFt} ft).`,
      });
    }
  }

  // Beam is only checked where the berth's width is actually on file.
  if (berth.widthFt != null) {
    if (vessel.beamFt == null) {
      issues.push({
        field: "beam",
        status: "unverified",
        message: "Beam not verified: vessel beam is missing.",
      });
    } else {
      const maxBeam = berth.widthFt * (1 - beamBuffer);
      if (vessel.beamFt > maxBeam) {
        issues.push({
          field: "beam",
          status: "violation",
          message: `Vessel beam (${vessel.beamFt} ft) exceeds berth capacity of ${maxBeam.toFixed(1)} ft (${berth.widthFt} ft berth, ${(beamBuffer * 100).toFixed(0)}% buffer).`,
        });
      }
    }
  }

  return issues;
}
