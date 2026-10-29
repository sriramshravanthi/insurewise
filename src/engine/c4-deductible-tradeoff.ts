/**
 * C4: Deductible trade-off
 * C5: Break-even claim-free years
 * C6: N-year cost view
 */

import {
  ENGINE_VERSION,
  EngineResult,
  roundHalfUp,
} from "./types";

// ---------------------------------------------------------------------------
// C4
// ---------------------------------------------------------------------------

export interface C4Input {
  dLowCents: number;
  pLowAnnualCents: number;
  dHighCents: number;
  pHighAnnualCents: number;
}

export interface C4Output {
  annualPremiumDifferenceCents: number; // P_low − P_high (positive = high-ded has lower premium)
  extraOutOfPocketIfClaimCents: number; // D_high − D_low
}

export function c4DeductibleTradeoff(
  input: C4Input
): EngineResult<C4Output> {
  const { dLowCents, pLowAnnualCents, dHighCents, pHighAnnualCents } = input;

  for (const [field, val] of [
    ["dLowCents", dLowCents],
    ["pLowAnnualCents", pLowAnnualCents],
    ["dHighCents", dHighCents],
    ["pHighAnnualCents", pHighAnnualCents],
  ] as const) {
    if (!Number.isFinite(val) || val < 0) {
      return {
        status: "invalid",
        errors: [{ field, code: "NON_NEGATIVE_FINITE", message: `${field} must be ≥ 0.` }],
      };
    }
  }

  if (dHighCents <= dLowCents) {
    return {
      status: "invalid",
      errors: [
        {
          field: "dHighCents",
          code: "ORDERING_VIOLATION",
          message: "High deductible must be greater than low deductible.",
        },
      ],
    };
  }

  const annualPremiumDifferenceCents = roundHalfUp(pLowAnnualCents - pHighAnnualCents);
  const extraOutOfPocketIfClaimCents = roundHalfUp(dHighCents - dLowCents);

  const notes: string[] = [];
  if (pHighAnnualCents >= pLowAnnualCents) {
    notes.push(
      "No premium reduction entered for the higher deductible — break-even cannot be computed."
    );
  }

  const provenancedInputs = [
    { key: "dLowCents", label: "Low deductible", value: dLowCents, provenance: "Entered" as const },
    { key: "pLowAnnualCents", label: "Annual premium (low ded)", value: pLowAnnualCents, provenance: "Entered" as const },
    { key: "dHighCents", label: "High deductible", value: dHighCents, provenance: "Entered" as const },
    { key: "pHighAnnualCents", label: "Annual premium (high ded)", value: pHighAnnualCents, provenance: "Entered" as const },
  ];

  return {
    status: "ok",
    value: { annualPremiumDifferenceCents, extraOutOfPocketIfClaimCents },
    trace: {
      formulaId: "C4",
      engineVersion: ENGINE_VERSION,
      inputs: provenancedInputs,
      steps: [
        {
          label: "Annual premium difference",
          expression: `${pLowAnnualCents} − ${pHighAnnualCents}`,
          result: annualPremiumDifferenceCents,
        },
        {
          label: "Extra out-of-pocket if claim",
          expression: `${dHighCents} − ${dLowCents}`,
          result: extraOutOfPocketIfClaimCents,
        },
      ],
      output: annualPremiumDifferenceCents,
      outputProvenance: "Calculated",
      roundingNote: "Values rounded half-up to nearest cent.",
      notes,
    },
  };
}

// ---------------------------------------------------------------------------
// C5
// ---------------------------------------------------------------------------

export interface C5Output {
  breakEvenYears: number;
}

export type C5Status =
  | { status: "ok"; value: C5Output; trace: ReturnType<typeof c4DeductibleTradeoff> extends { trace: infer T } ? T : never }
  | { status: "no_premium_savings_entered" }
  | { status: "insufficient_data"; missing: string[] }
  | { status: "invalid"; errors: { field: string; code: string; message: string }[] };

export function c5BreakEven(input: C4Input): EngineResult<C5Output> | { status: "no_premium_savings_entered" } {
  const c4 = c4DeductibleTradeoff(input);
  if (c4.status !== "ok") return c4 as EngineResult<C5Output>;

  const premiumSavings = c4.value.annualPremiumDifferenceCents;
  const extraOop = c4.value.extraOutOfPocketIfClaimCents;

  if (premiumSavings <= 0) {
    return { status: "no_premium_savings_entered" };
  }

  // Keep as exact ratio for display; round to 2 decimal places
  const breakEvenYears = Math.round((extraOop / premiumSavings) * 100) / 100;

  return {
    status: "ok",
    value: { breakEvenYears },
    trace: {
      formulaId: "C5",
      engineVersion: ENGINE_VERSION,
      inputs: c4.trace.inputs,
      steps: [
        ...c4.trace.steps,
        {
          label: "Break-even years",
          expression: `${extraOop} ÷ ${premiumSavings}`,
          result: breakEvenYears,
        },
      ],
      output: breakEvenYears,
      outputProvenance: "Calculated",
      notes: [
        "Arithmetic on entered numbers — not a prediction of future claims.",
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// C6
// ---------------------------------------------------------------------------

export interface C6Input extends C4Input {
  nYears: number; // ≥ 1, Illustrative
}

export interface C6Option {
  label: "low_deductible" | "high_deductible";
  deductibleCents: number;
  annualPremiumCents: number;
  nYearCostCents: number;
}

export function c6NYearCostView(
  input: C6Input
): EngineResult<{ options: [C6Option, C6Option] }> {
  const { nYears, dLowCents, pLowAnnualCents, dHighCents, pHighAnnualCents } = input;

  if (!Number.isFinite(nYears) || nYears < 1 || !Number.isInteger(nYears)) {
    return {
      status: "invalid",
      errors: [{ field: "nYears", code: "POSITIVE_INTEGER", message: "N must be a positive integer ≥ 1." }],
    };
  }

  for (const [field, val] of [
    ["dLowCents", dLowCents],
    ["pLowAnnualCents", pLowAnnualCents],
    ["dHighCents", dHighCents],
    ["pHighAnnualCents", pHighAnnualCents],
  ] as const) {
    if (!Number.isFinite(val) || val < 0) {
      return {
        status: "invalid",
        errors: [{ field, code: "NON_NEGATIVE_FINITE", message: `${field} must be ≥ 0.` }],
      };
    }
  }

  const lowCost = roundHalfUp(nYears * pLowAnnualCents + dLowCents);
  const highCost = roundHalfUp(nYears * pHighAnnualCents + dHighCents);

  const provenancedInputs = [
    { key: "nYears", label: "Years (illustrative)", value: nYears, provenance: "Illustrative" as const },
    { key: "dLowCents", label: "Low deductible", value: dLowCents, provenance: "Entered" as const },
    { key: "pLowAnnualCents", label: "Annual premium (low ded)", value: pLowAnnualCents, provenance: "Entered" as const },
    { key: "dHighCents", label: "High deductible", value: dHighCents, provenance: "Entered" as const },
    { key: "pHighAnnualCents", label: "Annual premium (high ded)", value: pHighAnnualCents, provenance: "Entered" as const },
  ];

  return {
    status: "ok",
    value: {
      options: [
        {
          label: "low_deductible",
          deductibleCents: dLowCents,
          annualPremiumCents: pLowAnnualCents,
          nYearCostCents: lowCost,
        },
        {
          label: "high_deductible",
          deductibleCents: dHighCents,
          annualPremiumCents: pHighAnnualCents,
          nYearCostCents: highCost,
        },
      ],
    },
    trace: {
      formulaId: "C6",
      engineVersion: ENGINE_VERSION,
      inputs: provenancedInputs,
      steps: [
        {
          label: "Low-deductible N-year cost",
          expression: `${nYears} × ${pLowAnnualCents} + ${dLowCents}`,
          result: lowCost,
        },
        {
          label: "High-deductible N-year cost",
          expression: `${nYears} × ${pHighAnnualCents} + ${dHighCents}`,
          result: highCost,
        },
      ],
      output: lowCost,
      outputProvenance: "Illustrative",
      notes: [
        `Assumes exactly one claim over ${nYears} year(s) with loss ≥ deductible. N is an assumption, not a prediction.`,
      ],
    },
  };
}
