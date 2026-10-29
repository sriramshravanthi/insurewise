import type { MoneyCents } from "@/schemas/money";
import type { Provenance } from "@/schemas/provenance";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface DeductibleAffordabilityInput {
  deductibleCents: MoneyCents;
  /** Optional and never required (docs/CALCULATIONS.md §2, C15). */
  emergencySavingsCents?: MoneyCents;
  provenance: Provenance;
}

export interface DeductibleAffordabilityOutput {
  /** max(0, deductible - emergencySavings). Omitted when savings were not entered. */
  shortfallCents?: Value<MoneyCents>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

export function deductibleAffordability(
  input: DeductibleAffordabilityInput,
): Result<DeductibleAffordabilityOutput> {
  const { deductibleCents, emergencySavingsCents } = input;

  if (!isNonNegativeInt(deductibleCents)) {
    return invalid([
      {
        field: "deductibleCents",
        code: "invalid_money",
        message: "deductibleCents must be a non-negative integer.",
      },
    ]);
  }
  if (
    emergencySavingsCents !== undefined &&
    !isNonNegativeInt(emergencySavingsCents)
  ) {
    return invalid([
      {
        field: "emergencySavingsCents",
        code: "invalid_money",
        message: "emergencySavingsCents must be a non-negative integer.",
      },
    ]);
  }

  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";

  const traceInputs: TraceInput[] = [
    {
      key: "deductibleCents",
      label: "Deductible",
      value: deductibleCents,
      provenance: input.provenance,
    },
  ];
  const steps: Trace["steps"] = [];

  let shortfallCents: Value<MoneyCents> | undefined;
  if (emergencySavingsCents !== undefined) {
    traceInputs.push({
      key: "emergencySavingsCents",
      label: "Emergency savings",
      value: emergencySavingsCents,
      provenance: input.provenance,
    });
    const value = Math.max(0, deductibleCents - emergencySavingsCents);
    shortfallCents = { amount: value, provenance: outputProvenance };
    steps.push({
      label: "Shortfall",
      expression: `max(0, ${deductibleCents} − ${emergencySavingsCents})`,
      result: value,
    });
  }

  const trace: Trace = {
    formulaId: "C15",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps,
    output: shortfallCents?.amount,
    notes: [],
  };

  return ok({ shortfallCents }, trace);
}
