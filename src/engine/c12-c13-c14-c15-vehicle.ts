/**
 * C12: ACV illustration
 * C13: Coverage cost vs vehicle value ratio
 * C14: Loan-versus-value shortfall
 * C15: Deductible affordability shortfall
 */

import { ENGINE_VERSION, EngineResult, roundHalfUp } from "./types";

// ---------------------------------------------------------------------------
// C12: ACV illustration
// ---------------------------------------------------------------------------

export interface C12Input {
  replacementCostLossCents: number; // L
  depreciationPct: number; // 0–1, Illustrative (user entered)
  deductibleCents: number; // D
}

export interface C12Output {
  acvLossCents: number; // L × (1 − dep)
  rcvInsurerPaysCents: number; // L − D
  rcvUserPaysCents: number; // D
  acvInsurerPaysCents: number; // max(0, acvLoss − D)
  acvUserPaysCents: number; // L − acvInsurerPays
}

export function c12AcvIllustration(input: C12Input): EngineResult<C12Output> {
  const { replacementCostLossCents: L, depreciationPct, deductibleCents: D } = input;

  if (!Number.isFinite(L) || L < 0) {
    return { status: "invalid", errors: [{ field: "replacementCostLossCents", code: "NON_NEGATIVE_FINITE", message: "Loss must be ≥ 0." }] };
  }
  if (!Number.isFinite(depreciationPct) || depreciationPct < 0 || depreciationPct > 1) {
    return { status: "invalid", errors: [{ field: "depreciationPct", code: "RANGE_0_1", message: "Depreciation must be between 0 and 1." }] };
  }
  if (!Number.isFinite(D) || D < 0) {
    return { status: "invalid", errors: [{ field: "deductibleCents", code: "NON_NEGATIVE_FINITE", message: "Deductible must be ≥ 0." }] };
  }

  const acvLossCents = roundHalfUp(L * (1 - depreciationPct));
  const rcvInsurerPaysCents = Math.max(0, L - D);
  const rcvUserPaysCents = L - rcvInsurerPaysCents;
  const acvInsurerPaysCents = Math.max(0, acvLossCents - D);
  const acvUserPaysCents = L - acvInsurerPaysCents;

  return {
    status: "ok",
    value: { acvLossCents, rcvInsurerPaysCents, rcvUserPaysCents, acvInsurerPaysCents, acvUserPaysCents },
    trace: {
      formulaId: "C12",
      engineVersion: ENGINE_VERSION,
      inputs: [
        { key: "replacementCostLossCents", label: "Replacement-cost loss", value: L, provenance: "Entered" },
        { key: "depreciationPct", label: "Depreciation % (illustrative)", value: depreciationPct, provenance: "Illustrative" },
        { key: "deductibleCents", label: "Deductible", value: D, provenance: "Entered" },
      ],
      steps: [
        { label: "ACV loss", expression: `${L} × (1 − ${depreciationPct})`, result: acvLossCents },
        { label: "RCV: insurer pays", expression: `max(0, ${L} − ${D})`, result: rcvInsurerPaysCents },
        { label: "RCV: user pays", expression: `${L} − ${rcvInsurerPaysCents}`, result: rcvUserPaysCents },
        { label: "ACV: insurer pays", expression: `max(0, ${acvLossCents} − ${D})`, result: acvInsurerPaysCents },
        { label: "ACV: user pays", expression: `${L} − ${acvInsurerPaysCents}`, result: acvUserPaysCents },
      ],
      output: acvLossCents,
      outputProvenance: "Illustrative",
      notes: ["Simplified model — real ACV settlement mechanics vary by policy."],
    },
  };
}

// ---------------------------------------------------------------------------
// C13: Coverage cost vs vehicle value ratio
// ---------------------------------------------------------------------------

export interface C13Input {
  annualCollisionPremiumCents: number;
  annualComprehensivePremiumCents: number;
  vehicleValueCents: number;
}

export function c13CoverageCostRatio(
  input: C13Input
): EngineResult<{ ratioPct: number }> {
  const { annualCollisionPremiumCents, annualComprehensivePremiumCents, vehicleValueCents } = input;

  for (const [field, val] of [
    ["annualCollisionPremiumCents", annualCollisionPremiumCents],
    ["annualComprehensivePremiumCents", annualComprehensivePremiumCents],
    ["vehicleValueCents", vehicleValueCents],
  ] as const) {
    if (!Number.isFinite(val) || val < 0) {
      return { status: "invalid", errors: [{ field, code: "NON_NEGATIVE_FINITE", message: `${field} must be ≥ 0.` }] };
    }
  }

  if (vehicleValueCents === 0) {
    return { status: "insufficient_data", missing: ["vehicleValueCents"] };
  }

  const combinedPremiumCents = annualCollisionPremiumCents + annualComprehensivePremiumCents;
  const ratioPct = Math.round((combinedPremiumCents / vehicleValueCents) * 1000) / 10;

  return {
    status: "ok",
    value: { ratioPct },
    trace: {
      formulaId: "C13",
      engineVersion: ENGINE_VERSION,
      inputs: [
        { key: "annualCollisionPremiumCents", label: "Collision premium", value: annualCollisionPremiumCents, provenance: "Entered" },
        { key: "annualComprehensivePremiumCents", label: "Comprehensive premium", value: annualComprehensivePremiumCents, provenance: "Entered" },
        { key: "vehicleValueCents", label: "Vehicle value", value: vehicleValueCents, provenance: "Entered" },
      ],
      steps: [
        { label: "Combined premium", expression: `${annualCollisionPremiumCents} + ${annualComprehensivePremiumCents}`, result: combinedPremiumCents },
        { label: "Ratio", expression: `${combinedPremiumCents} ÷ ${vehicleValueCents} × 100`, result: `${ratioPct.toFixed(1)}%` },
      ],
      output: ratioPct,
      outputProvenance: "Calculated",
      notes: ["Any threshold used for a review item is an Illustrative rule parameter, not an engine constant."],
    },
  };
}

// ---------------------------------------------------------------------------
// C14: Loan-versus-value shortfall
// ---------------------------------------------------------------------------

export interface C14Input {
  loanBalanceCents: number;
  vehicleValueCents: number;
  gapCoverageEntered: boolean;
}

export function c14LoanVsValueShortfall(
  input: C14Input
): EngineResult<{ shortfallCents: number; gapCoverageEntered: boolean }> {
  const { loanBalanceCents, vehicleValueCents, gapCoverageEntered } = input;

  for (const [field, val] of [
    ["loanBalanceCents", loanBalanceCents],
    ["vehicleValueCents", vehicleValueCents],
  ] as const) {
    if (!Number.isFinite(val) || val < 0) {
      return { status: "invalid", errors: [{ field, code: "NON_NEGATIVE_FINITE", message: `${field} must be ≥ 0.` }] };
    }
  }

  const shortfallCents = Math.max(0, loanBalanceCents - vehicleValueCents);

  return {
    status: "ok",
    value: { shortfallCents, gapCoverageEntered },
    trace: {
      formulaId: "C14",
      engineVersion: ENGINE_VERSION,
      inputs: [
        { key: "loanBalanceCents", label: "Loan balance", value: loanBalanceCents, provenance: "Entered" },
        { key: "vehicleValueCents", label: "Vehicle value", value: vehicleValueCents, provenance: "Entered" },
      ],
      steps: [
        { label: "Shortfall", expression: `max(0, ${loanBalanceCents} − ${vehicleValueCents})`, result: shortfallCents },
      ],
      output: shortfallCents,
      outputProvenance: "Calculated",
    },
  };
}

// ---------------------------------------------------------------------------
// C15: Deductible affordability shortfall
// ---------------------------------------------------------------------------

export interface C15Input {
  deductibleCents: number;
  emergencySavingsCents?: number; // optional — never required
}

export function c15DeductibleAffordability(
  input: C15Input
): EngineResult<{ shortfallCents: number }> {
  const { deductibleCents, emergencySavingsCents } = input;

  if (!Number.isFinite(deductibleCents) || deductibleCents < 0) {
    return { status: "invalid", errors: [{ field: "deductibleCents", code: "NON_NEGATIVE_FINITE", message: "Deductible must be ≥ 0." }] };
  }

  if (emergencySavingsCents === undefined) {
    return { status: "insufficient_data", missing: ["emergencySavingsCents"] };
  }

  if (!Number.isFinite(emergencySavingsCents) || emergencySavingsCents < 0) {
    return { status: "invalid", errors: [{ field: "emergencySavingsCents", code: "NON_NEGATIVE_FINITE", message: "Emergency savings must be ≥ 0." }] };
  }

  const shortfallCents = Math.max(0, deductibleCents - emergencySavingsCents);

  return {
    status: "ok",
    value: { shortfallCents },
    trace: {
      formulaId: "C15",
      engineVersion: ENGINE_VERSION,
      inputs: [
        { key: "deductibleCents", label: "Deductible", value: deductibleCents, provenance: "Entered" },
        { key: "emergencySavingsCents", label: "Emergency savings", value: emergencySavingsCents, provenance: "Entered" },
      ],
      steps: [
        { label: "Shortfall", expression: `max(0, ${deductibleCents} − ${emergencySavingsCents})`, result: shortfallCents },
      ],
      output: shortfallCents,
      outputProvenance: "Calculated",
    },
  };
}
