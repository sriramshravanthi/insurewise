/**
 * C3: Out-of-pocket on a claim (first-party coverages)
 * Two limit-basis variants. Always labeled Illustrative per spec.
 */

import {
  ENGINE_VERSION,
  EngineResult,
  Provenance,
  roundHalfUp,
  weakerProvenance,
} from "./types";

export type LimitBasis = "after_deductible" | "before_deductible";

export interface C3Input {
  lossCents: number; // L ≥ 0
  deductibleCents: number; // D ≥ 0
  limitCents?: number; // M, undefined = unbounded
  limitBasis?: LimitBasis; // default: after_deductible
  /** Optional: percentage deductible (e.g. 0.02 for 2%). Overrides deductibleCents. */
  deductiblePct?: number;
  /** Required if deductiblePct is provided */
  deductibleBaseCents?: number;
  lossCentsProvenance?: Provenance;
  deductibleProvenance?: Provenance;
}

export function c3OutOfPocket(
  input: C3Input
): EngineResult<{ userPaysCents: number; insurerPaysCents: number }> {
  const {
    lossCents,
    limitBasis = "after_deductible",
    limitCents,
    deductiblePct,
    deductibleBaseCents,
    lossCentsProvenance = "Entered",
    deductibleProvenance = "Entered",
  } = input;

  // Validation
  if (!Number.isFinite(lossCents) || lossCents < 0) {
    return {
      status: "invalid",
      errors: [{ field: "lossCents", code: "NON_NEGATIVE_FINITE", message: "Loss must be ≥ 0." }],
    };
  }

  let effectiveDeductible = input.deductibleCents;
  const steps: { label: string; expression: string; result: number | string }[] = [];
  const notes: string[] = [];
  let deductibleActualProvenance: Provenance = deductibleProvenance;

  // Percentage deductible
  if (deductiblePct !== undefined) {
    if (deductibleBaseCents === undefined) {
      return { status: "insufficient_data", missing: ["deductibleBaseCents"] };
    }
    if (!Number.isFinite(deductiblePct) || deductiblePct < 0 || deductiblePct > 1) {
      return {
        status: "invalid",
        errors: [{ field: "deductiblePct", code: "INVALID_PCT", message: "Percentage must be between 0 and 1." }],
      };
    }
    effectiveDeductible = roundHalfUp(deductiblePct * deductibleBaseCents);
    deductibleActualProvenance = weakerProvenance(deductibleProvenance, "Illustrative");
    steps.push({
      label: "Deductible (percentage)",
      expression: `${deductiblePct * 100}% × ${deductibleBaseCents}`,
      result: effectiveDeductible,
    });
    notes.push("Percentage deductible: how the percentage applies depends on your policy language.");
  }

  const D = effectiveDeductible;
  const L = lossCents;
  const M = limitCents ?? Infinity;

  if (!Number.isFinite(D) || D < 0) {
    return {
      status: "invalid",
      errors: [{ field: "deductibleCents", code: "NON_NEGATIVE_FINITE", message: "Deductible must be ≥ 0." }],
    };
  }
  if (limitCents !== undefined && (!Number.isFinite(limitCents) || limitCents < 0)) {
    return {
      status: "invalid",
      errors: [{ field: "limitCents", code: "NON_NEGATIVE_FINITE", message: "Limit must be ≥ 0." }],
    };
  }

  let insurerPaysCents: number;

  if (limitBasis === "after_deductible") {
    // insurerPays = max(0, min(L − D, M))
    const afterDed = L - D;
    insurerPaysCents = Math.max(0, M === Infinity ? afterDed : Math.min(afterDed, M));
    steps.push(
      { label: "Loss after deductible", expression: `${L} − ${D}`, result: L - D },
      {
        label: "Insurer pays (capped at limit)",
        expression: M === Infinity
          ? `max(0, ${L - D})`
          : `max(0, min(${L - D}, ${M}))`,
        result: insurerPaysCents,
      }
    );
  } else {
    // before_deductible: insurerPays = max(0, min(L, M) − D)
    const capped = M === Infinity ? L : Math.min(L, M);
    insurerPaysCents = Math.max(0, capped - D);
    steps.push(
      { label: "Loss capped at limit", expression: M === Infinity ? `${L}` : `min(${L}, ${M})`, result: capped },
      { label: "Insurer pays (after deductible)", expression: `max(0, ${capped} − ${D})`, result: insurerPaysCents }
    );
  }

  const userPaysCents = L - insurerPaysCents;

  steps.push({ label: "User pays", expression: `${L} − ${insurerPaysCents}`, result: userPaysCents });

  notes.push(
    "Output labeled Illustrative: the interaction between limit and deductible depends on your policy form. Check your policy language."
  );

  const provenancedInputs = [
    { key: "lossCents", label: "Loss amount", value: L, provenance: lossCentsProvenance },
    { key: "deductibleCents", label: "Deductible", value: D, provenance: deductibleActualProvenance },
    ...(limitCents !== undefined
      ? [{ key: "limitCents", label: "Coverage limit", value: limitCents, provenance: "Entered" as Provenance }]
      : []),
  ];

  return {
    status: "ok",
    value: { userPaysCents, insurerPaysCents },
    trace: {
      formulaId: "C3",
      engineVersion: ENGINE_VERSION,
      inputs: provenancedInputs,
      steps,
      output: userPaysCents,
      outputProvenance: "Illustrative",
      notes,
    },
  };
}
