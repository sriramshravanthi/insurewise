import type { MoneyCents } from "@/schemas/money";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";
import { outOfPocketOnClaim, type LimitBasis } from "./out-of-pocket";

export interface AcvIllustrationInput {
  /** L: the replacement-cost loss. */
  replacementCostLossCents: MoneyCents;
  /** Entered by the user, but always Illustrative (docs/CALCULATIONS.md §2, C12). 0-100. */
  depreciationPct: number;
  deductibleCents: MoneyCents;
  limitCents?: MoneyCents;
  /** @default "after_deductible" */
  limitBasis?: LimitBasis;
}

export interface SettlementBasisResult {
  insurerPaysCents: Value<MoneyCents>;
  userPaysCents: Value<MoneyCents>;
}

export interface AcvIllustrationOutput {
  acvLossCents: Value<MoneyCents>;
  actualCashValue: SettlementBasisResult;
  replacementCost: SettlementBasisResult;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

export function acvIllustration(
  input: AcvIllustrationInput,
): Result<AcvIllustrationOutput> {
  const { replacementCostLossCents, depreciationPct, deductibleCents, limitCents } =
    input;
  const limitBasis = input.limitBasis ?? "after_deductible";

  if (!isNonNegativeInt(replacementCostLossCents)) {
    return invalid([
      {
        field: "replacementCostLossCents",
        code: "invalid_money",
        message: "replacementCostLossCents must be a non-negative integer.",
      },
    ]);
  }
  if (!isNonNegativeInt(deductibleCents)) {
    return invalid([
      {
        field: "deductibleCents",
        code: "invalid_money",
        message: "deductibleCents must be a non-negative integer.",
      },
    ]);
  }
  if (limitCents !== undefined && !isNonNegativeInt(limitCents)) {
    return invalid([
      {
        field: "limitCents",
        code: "invalid_money",
        message: "limitCents must be a non-negative integer.",
      },
    ]);
  }
  if (
    typeof depreciationPct !== "number" ||
    !Number.isFinite(depreciationPct) ||
    depreciationPct < 0 ||
    depreciationPct > 100
  ) {
    return invalid([
      {
        field: "depreciationPct",
        code: "out_of_range",
        message: "depreciationPct must be a number between 0 and 100.",
      },
    ]);
  }

  // Named output: round half-up to the nearest cent (docs/CALCULATIONS.md §1).
  const acvLossCents = Math.round(
    replacementCostLossCents * (1 - depreciationPct / 100),
  );

  const acvClaim = outOfPocketOnClaim({
    lossCents: acvLossCents,
    deductibleCents,
    limitCents,
    limitBasis,
  });
  const replacementCostClaim = outOfPocketOnClaim({
    lossCents: replacementCostLossCents,
    deductibleCents,
    limitCents,
    limitBasis,
  });
  if (acvClaim.status !== "ok") return acvClaim;
  if (replacementCostClaim.status !== "ok") return replacementCostClaim;

  const acvInsurerPaysCents = acvClaim.value.insurerPaysCents.amount;
  // Measured against the full original loss, not the depreciated figure —
  // this is the whole point of the ACV-vs-replacement-cost contrast.
  const acvUserPaysCents = replacementCostLossCents - acvInsurerPaysCents;

  const steps: Trace["steps"] = [
    {
      label: "ACV loss",
      expression: `${replacementCostLossCents} × (1 − ${depreciationPct} / 100)`,
      result: acvLossCents,
    },
    ...acvClaim.trace.steps.map((step) => ({
      ...step,
      label: `ACV basis: ${step.label}`,
    })),
    {
      label: "ACV basis: user pays (vs. the full replacement-cost loss)",
      expression: `${replacementCostLossCents} − ${acvInsurerPaysCents}`,
      result: acvUserPaysCents,
    },
    ...replacementCostClaim.trace.steps.map((step) => ({
      ...step,
      label: `Replacement-cost basis: ${step.label}`,
    })),
  ];

  const trace: Trace = {
    formulaId: "C12",
    engineVersion: ENGINE_VERSION,
    inputs: [
      {
        key: "replacementCostLossCents",
        label: "Replacement-cost loss",
        value: replacementCostLossCents,
        provenance: "entered",
      },
      {
        key: "depreciationPct",
        label: "Depreciation",
        value: depreciationPct,
        provenance: "illustrative",
      },
      {
        key: "deductibleCents",
        label: "Deductible",
        value: deductibleCents,
        provenance: "entered",
      },
    ],
    steps,
    output: {
      acvLossCents,
      acvInsurerPaysCents,
      acvUserPaysCents,
      replacementCostInsurerPaysCents:
        replacementCostClaim.value.insurerPaysCents.amount,
      replacementCostUserPaysCents:
        replacementCostClaim.value.userPaysCents.amount,
    },
    notes: [
      "This model is simplified; real settlement mechanics vary by policy.",
    ],
  };

  return ok(
    {
      acvLossCents: { amount: acvLossCents, provenance: "illustrative" },
      actualCashValue: {
        insurerPaysCents: { amount: acvInsurerPaysCents, provenance: "illustrative" },
        userPaysCents: { amount: acvUserPaysCents, provenance: "illustrative" },
      },
      replacementCost: {
        insurerPaysCents: replacementCostClaim.value.insurerPaysCents,
        userPaysCents: replacementCostClaim.value.userPaysCents,
      },
    },
    trace,
  );
}
