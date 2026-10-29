/**
 * C10: Home coverage ratios (A/rebuild, C/A, D/A)
 * C11: Rebuild estimate helper
 */

import { ENGINE_VERSION, EngineResult, Provenance, roundHalfUp } from "./types";

// ---------------------------------------------------------------------------
// C11: Rebuild estimate
// ---------------------------------------------------------------------------

export interface C11Input {
  squareFeet: number;
  costPerSqFtCents: number; // Illustrative — user entered
}

export function c11RebuildEstimate(
  input: C11Input
): EngineResult<{ rebuildEstimateCents: number }> {
  const { squareFeet, costPerSqFtCents } = input;

  if (!Number.isFinite(squareFeet) || squareFeet <= 0) {
    return {
      status: "invalid",
      errors: [{ field: "squareFeet", code: "POSITIVE_FINITE", message: "Square footage must be > 0." }],
    };
  }
  if (!Number.isFinite(costPerSqFtCents) || costPerSqFtCents <= 0) {
    return {
      status: "invalid",
      errors: [{ field: "costPerSqFtCents", code: "POSITIVE_FINITE", message: "Cost per sq ft must be > 0." }],
    };
  }

  const rebuildEstimateCents = roundHalfUp(squareFeet * costPerSqFtCents);

  return {
    status: "ok",
    value: { rebuildEstimateCents },
    trace: {
      formulaId: "C11",
      engineVersion: ENGINE_VERSION,
      inputs: [
        { key: "squareFeet", label: "Square footage", value: squareFeet, provenance: "Entered" },
        { key: "costPerSqFtCents", label: "Cost per sq ft (entered)", value: costPerSqFtCents, provenance: "Illustrative" },
      ],
      steps: [
        {
          label: "Rebuild estimate",
          expression: `${squareFeet} × ${costPerSqFtCents}`,
          result: rebuildEstimateCents,
        },
      ],
      output: rebuildEstimateCents,
      outputProvenance: "Illustrative",
      notes: [
        "Rough illustration using your entered cost per square foot. Actual rebuild costs vary by location, materials and labor. A licensed appraiser or your insurer can give you a verified estimate.",
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// C10: Coverage ratios
// ---------------------------------------------------------------------------

export interface C10Input {
  coverageACents: number; // Dwelling limit (Entered)
  coverageCCents?: number; // Contents (Entered)
  coverageDCents?: number; // Loss of use (Entered)
  rebuildEstimateCents?: number; // from C11 or Entered
  rebuildEstimateProvenance?: Provenance;
}

export interface C10Output {
  dwellingVsRebuildPct: number | null; // A / rebuild × 100
  contentsVsDwellingPct: number | null; // C / A × 100
  lossOfUseVsDwellingPct: number | null; // D / A × 100
}

export function c10CoverageRatios(input: C10Input): EngineResult<C10Output> {
  const {
    coverageACents,
    coverageCCents,
    coverageDCents,
    rebuildEstimateCents,
    rebuildEstimateProvenance = "Illustrative",
  } = input;

  if (!Number.isFinite(coverageACents) || coverageACents < 0) {
    return {
      status: "invalid",
      errors: [{ field: "coverageACents", code: "NON_NEGATIVE_FINITE", message: "Coverage A must be ≥ 0." }],
    };
  }

  if (coverageACents === 0) {
    return { status: "insufficient_data", missing: ["coverageACents"] };
  }

  const roundPct = (n: number) => Math.round(n * 10) / 10; // 1 decimal place

  const dwellingVsRebuildPct =
    rebuildEstimateCents !== undefined && rebuildEstimateCents > 0
      ? roundPct(coverageACents / rebuildEstimateCents * 100)
      : null;

  const contentsVsDwellingPct =
    coverageCCents !== undefined
      ? roundPct(coverageCCents / coverageACents * 100)
      : null;

  const lossOfUseVsDwellingPct =
    coverageDCents !== undefined
      ? roundPct(coverageDCents / coverageACents * 100)
      : null;

  const provenancedInputs = [
    { key: "coverageACents", label: "Coverage A (Dwelling)", value: coverageACents, provenance: "Entered" as Provenance },
    ...(coverageCCents !== undefined
      ? [{ key: "coverageCCents", label: "Coverage C (Contents)", value: coverageCCents, provenance: "Entered" as Provenance }]
      : []),
    ...(coverageDCents !== undefined
      ? [{ key: "coverageDCents", label: "Coverage D (Loss of use)", value: coverageDCents, provenance: "Entered" as Provenance }]
      : []),
    ...(rebuildEstimateCents !== undefined
      ? [{ key: "rebuildEstimateCents", label: "Rebuild estimate", value: rebuildEstimateCents, provenance: rebuildEstimateProvenance }]
      : []),
  ];

  // Output provenance: Illustrative if any input is Illustrative
  const outputProvenance: Provenance =
    rebuildEstimateProvenance === "Illustrative" && dwellingVsRebuildPct !== null
      ? "Illustrative"
      : "Calculated";

  const steps = [
    ...(dwellingVsRebuildPct !== null
      ? [{ label: "Dwelling vs rebuild", expression: `${coverageACents} ÷ ${rebuildEstimateCents} × 100`, result: `${dwellingVsRebuildPct.toFixed(1)}%` }]
      : []),
    ...(contentsVsDwellingPct !== null
      ? [{ label: "Contents vs dwelling", expression: `${coverageCCents} ÷ ${coverageACents} × 100`, result: `${contentsVsDwellingPct.toFixed(1)}%` }]
      : []),
    ...(lossOfUseVsDwellingPct !== null
      ? [{ label: "Loss of use vs dwelling", expression: `${coverageDCents} ÷ ${coverageACents} × 100`, result: `${lossOfUseVsDwellingPct.toFixed(1)}%` }]
      : []),
  ];

  return {
    status: "ok",
    value: { dwellingVsRebuildPct, contentsVsDwellingPct, lossOfUseVsDwellingPct },
    trace: {
      formulaId: "C10",
      engineVersion: ENGINE_VERSION,
      inputs: provenancedInputs,
      steps,
      output: dwellingVsRebuildPct ?? contentsVsDwellingPct ?? lossOfUseVsDwellingPct ?? 0,
      outputProvenance,
    },
  };
}
