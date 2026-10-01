import type { MoneyCents } from "@/schemas/money";
import type { Provenance } from "@/schemas/provenance";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface CoverageToValueRatioInput {
  collisionPremiumCents: MoneyCents;
  comprehensivePremiumCents: MoneyCents;
  vehicleValueCents: MoneyCents;
  provenance: Provenance;
}

export interface CoverageToValueRatioOutput {
  /** (collision + comprehensive) / vehicleValue x 100. Omitted when vehicleValue is $0. */
  ratio?: Value<number>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

function roundHalfUpToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function coverageToValueRatio(
  input: CoverageToValueRatioInput,
): Result<CoverageToValueRatioOutput> {
  const { collisionPremiumCents, comprehensivePremiumCents, vehicleValueCents } =
    input;

  for (const [field, value] of [
    ["collisionPremiumCents", collisionPremiumCents],
    ["comprehensivePremiumCents", comprehensivePremiumCents],
    ["vehicleValueCents", vehicleValueCents],
  ] as const) {
    if (!isNonNegativeInt(value)) {
      return invalid([
        {
          field,
          code: "invalid_money",
          message: `${field} must be a non-negative integer.`,
        },
      ]);
    }
  }

  const combinedPremiumCents = collisionPremiumCents + comprehensivePremiumCents;
  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";

  const steps: Trace["steps"] = [
    {
      label: "Combined collision + comprehensive premium",
      expression: `${collisionPremiumCents} + ${comprehensivePremiumCents}`,
      result: combinedPremiumCents,
    },
  ];
  const notes: string[] = [];

  let ratio: Value<number> | undefined;
  if (vehicleValueCents === 0) {
    notes.push("Ratio is not shown because the vehicle value is $0.00.");
  } else {
    const ratioValue = roundHalfUpToOneDecimal(
      (combinedPremiumCents / vehicleValueCents) * 100,
    );
    ratio = { amount: ratioValue, provenance: outputProvenance };
    steps.push({
      label: "Coverage-to-value ratio",
      expression: `${combinedPremiumCents} / ${vehicleValueCents} × 100`,
      result: ratioValue,
    });
  }

  const trace: Trace = {
    formulaId: "C13",
    engineVersion: ENGINE_VERSION,
    inputs: [
      {
        key: "collisionPremiumCents",
        label: "Collision premium",
        value: collisionPremiumCents,
        provenance: input.provenance,
      },
      {
        key: "comprehensivePremiumCents",
        label: "Comprehensive premium",
        value: comprehensivePremiumCents,
        provenance: input.provenance,
      },
      {
        key: "vehicleValueCents",
        label: "Vehicle value",
        value: vehicleValueCents,
        provenance: input.provenance,
      },
    ],
    steps,
    output: ratio?.amount,
    roundingNote: "Rounded to one decimal, half-up.",
    notes,
  };

  return ok({ ratio }, trace);
}
