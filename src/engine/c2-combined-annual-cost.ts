/**
 * C2: Combined annual cost (car + home)
 * Never treats missing as zero.
 */

import {
  ENGINE_VERSION,
  EngineResult,
  provenanceOfInputs,
  roundHalfUp,
} from "./types";

export interface C2Input {
  carAnnualCents: number | null;
  homeAnnualCents: number | null;
}

export function c2CombinedAnnualCost(
  input: C2Input
): EngineResult<{ combinedCents: number }> {
  const missing: string[] = [];
  if (input.carAnnualCents === null) missing.push("carAnnualCents");
  if (input.homeAnnualCents === null) missing.push("homeAnnualCents");

  if (missing.length > 0) {
    return { status: "insufficient_data", missing };
  }

  const car = input.carAnnualCents!;
  const home = input.homeAnnualCents!;

  if (!Number.isFinite(car) || car < 0) {
    return {
      status: "invalid",
      errors: [
        {
          field: "carAnnualCents",
          code: "NON_NEGATIVE_FINITE",
          message: "Car annual premium must be non-negative.",
        },
      ],
    };
  }
  if (!Number.isFinite(home) || home < 0) {
    return {
      status: "invalid",
      errors: [
        {
          field: "homeAnnualCents",
          code: "NON_NEGATIVE_FINITE",
          message: "Home annual premium must be non-negative.",
        },
      ],
    };
  }

  const combinedCents = roundHalfUp(car + home);

  const provenancedInputs = [
    { key: "carAnnualCents", label: "Car annual premium", value: car, provenance: "Entered" as const },
    { key: "homeAnnualCents", label: "Home annual premium", value: home, provenance: "Entered" as const },
  ];

  return {
    status: "ok",
    value: { combinedCents },
    trace: {
      formulaId: "C2",
      engineVersion: ENGINE_VERSION,
      inputs: provenancedInputs,
      steps: [
        {
          label: "Combined cost",
          expression: `${car} + ${home}`,
          result: combinedCents,
        },
      ],
      output: combinedCents,
      outputProvenance: provenanceOfInputs(provenancedInputs),
      notes: [],
    },
  };
}
