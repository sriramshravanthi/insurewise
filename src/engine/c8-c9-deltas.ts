/**
 * C8: Scenario delta (scenario vs baseline)
 * C9: Bundle delta (separate vs bundled)
 */

import { ENGINE_VERSION, EngineResult, roundHalfUp } from "./types";

// ---------------------------------------------------------------------------
// C8
// ---------------------------------------------------------------------------

export interface C8Input {
  baselineCents: number;
  scenarioCents: number;
}

export interface C8Output {
  deltaCents: number; // scenario − baseline; can be negative
  deltaPct: number | null; // null if baseline = 0
}

export function c8ScenarioDelta(input: C8Input): EngineResult<C8Output> {
  const { baselineCents, scenarioCents } = input;

  for (const [field, val] of [
    ["baselineCents", baselineCents],
    ["scenarioCents", scenarioCents],
  ] as const) {
    if (!Number.isFinite(val) || val < 0) {
      return {
        status: "invalid",
        errors: [{ field, code: "NON_NEGATIVE_FINITE", message: `${field} must be ≥ 0.` }],
      };
    }
  }

  const deltaCents = roundHalfUp(scenarioCents - baselineCents);
  const deltaPct =
    baselineCents === 0
      ? null
      : Math.round(((scenarioCents - baselineCents) / baselineCents) * 1000) / 10; // 1 decimal

  const provenancedInputs = [
    { key: "baselineCents", label: "Baseline premium", value: baselineCents, provenance: "Entered" as const },
    { key: "scenarioCents", label: "Scenario premium", value: scenarioCents, provenance: "Entered" as const },
  ];

  return {
    status: "ok",
    value: { deltaCents, deltaPct },
    trace: {
      formulaId: "C8",
      engineVersion: ENGINE_VERSION,
      inputs: provenancedInputs,
      steps: [
        { label: "Delta (cents)", expression: `${scenarioCents} − ${baselineCents}`, result: deltaCents },
        ...(deltaPct !== null
          ? [{ label: "Delta (%)", expression: `${deltaCents} ÷ ${baselineCents} × 100`, result: `${deltaPct.toFixed(1)}%` }]
          : [{ label: "Delta (%)", expression: "N/A — baseline is zero", result: "N/A" }]),
      ],
      output: deltaCents,
      outputProvenance: "Calculated",
      notes: baselineCents === 0 ? ["Percentage delta not available: baseline is zero."] : [],
    },
  };
}

// ---------------------------------------------------------------------------
// C9
// ---------------------------------------------------------------------------

export interface C9Input {
  separatePolicyCents: number[]; // individual annual premiums
  bundledCents: number; // the user-entered bundled premium
}

export interface C9Output {
  separateTotalCents: number;
  differenceCents: number; // separate − bundled (positive = bundle is lower)
  differencePct: number | null;
  direction: "lower" | "higher" | "same";
}

export function c9BundleDelta(input: C9Input): EngineResult<C9Output> {
  const { separatePolicyCents, bundledCents } = input;

  if (separatePolicyCents.length === 0) {
    return { status: "insufficient_data", missing: ["separatePolicyCents"] };
  }

  for (const [i, v] of separatePolicyCents.entries()) {
    if (!Number.isFinite(v) || v < 0) {
      return {
        status: "invalid",
        errors: [{ field: `separatePolicyCents[${i}]`, code: "NON_NEGATIVE_FINITE", message: "Each separate premium must be ≥ 0." }],
      };
    }
  }
  if (!Number.isFinite(bundledCents) || bundledCents < 0) {
    return {
      status: "invalid",
      errors: [{ field: "bundledCents", code: "NON_NEGATIVE_FINITE", message: "Bundled premium must be ≥ 0." }],
    };
  }

  const separateTotalCents = separatePolicyCents.reduce((s, v) => s + v, 0);
  const differenceCents = roundHalfUp(separateTotalCents - bundledCents);
  const differencePct =
    separateTotalCents === 0
      ? null
      : Math.round((differenceCents / separateTotalCents) * 1000) / 10;
  const direction =
    differenceCents > 0 ? "lower" : differenceCents < 0 ? "higher" : "same";

  const provenancedInputs = [
    ...separatePolicyCents.map((v, i) => ({
      key: `separate_${i}`,
      label: `Separate policy ${i + 1}`,
      value: v,
      provenance: "Entered" as const,
    })),
    { key: "bundledCents", label: "Bundled premium", value: bundledCents, provenance: "Entered" as const },
  ];

  return {
    status: "ok",
    value: { separateTotalCents, differenceCents, differencePct, direction },
    trace: {
      formulaId: "C9",
      engineVersion: ENGINE_VERSION,
      inputs: provenancedInputs,
      steps: [
        { label: "Separate total", expression: separatePolicyCents.join(" + "), result: separateTotalCents },
        { label: "Difference", expression: `${separateTotalCents} − ${bundledCents}`, result: differenceCents },
        ...(differencePct !== null
          ? [{ label: "Difference (%)", expression: `${differenceCents} ÷ ${separateTotalCents} × 100`, result: `${differencePct.toFixed(1)}%` }]
          : []),
      ],
      output: differenceCents,
      outputProvenance: "Calculated",
    },
  };
}
