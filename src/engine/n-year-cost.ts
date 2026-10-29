import type { MoneyCents } from "@/schemas/money";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import type { DeductibleOption } from "./deductible-trade-off";
import { ENGINE_VERSION } from "./engine-version";

export interface NYearCostInput {
  low: DeductibleOption;
  high: DeductibleOption;
  /** Assumed claim-free interval; Illustrative and user-editable. */
  n: number;
}

export interface NYearCostOutput {
  lowCostCents: Value<MoneyCents>;
  highCostCents: Value<MoneyCents>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

export function nYearCost(input: NYearCostInput): Result<NYearCostOutput> {
  const { low, high, n } = input;

  for (const [key, option] of [
    ["low", low],
    ["high", high],
  ] as const) {
    if (!isNonNegativeInt(option.deductibleCents)) {
      return invalid([
        {
          field: `${key}.deductibleCents`,
          code: "invalid_money",
          message: "deductibleCents must be a non-negative integer.",
        },
      ]);
    }
    if (!isNonNegativeInt(option.annualPremiumCents)) {
      return invalid([
        {
          field: `${key}.annualPremiumCents`,
          code: "invalid_money",
          message: "annualPremiumCents must be a non-negative integer.",
        },
      ]);
    }
  }

  if (high.deductibleCents <= low.deductibleCents) {
    return invalid([
      {
        field: "high.deductibleCents",
        code: "not_greater_than_low",
        message: "high.deductibleCents must be greater than low.deductibleCents.",
      },
    ]);
  }

  if (!Number.isInteger(n) || n < 1) {
    return invalid([
      {
        field: "n",
        code: "invalid_n",
        message: "n must be a positive integer.",
      },
    ]);
  }

  const lowCostCents = n * low.annualPremiumCents + low.deductibleCents;
  const highCostCents = n * high.annualPremiumCents + high.deductibleCents;

  const traceInputs: TraceInput[] = [
    {
      key: "low.annualPremiumCents",
      label: "Premium at the lower deductible",
      value: low.annualPremiumCents,
      provenance: "entered",
    },
    {
      key: "low.deductibleCents",
      label: "Lower deductible",
      value: low.deductibleCents,
      provenance: "entered",
    },
    {
      key: "high.annualPremiumCents",
      label: "Premium at the higher deductible",
      value: high.annualPremiumCents,
      provenance: "entered",
    },
    {
      key: "high.deductibleCents",
      label: "Higher deductible",
      value: high.deductibleCents,
      provenance: "entered",
    },
    { key: "n", label: "Assumed claim-free years (N)", value: n, provenance: "illustrative" },
  ];

  // N is an assumption, not a probability, so every output is Illustrative
  // regardless of the options' own provenance (docs/CALCULATIONS.md §2, C6).
  const trace: Trace = {
    formulaId: "C6",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps: [
      {
        label: "Cost at the lower deductible",
        expression: `${n} × ${low.annualPremiumCents} + ${low.deductibleCents}`,
        result: lowCostCents,
      },
      {
        label: "Cost at the higher deductible",
        expression: `${n} × ${high.annualPremiumCents} + ${high.deductibleCents}`,
        result: highCostCents,
      },
    ],
    output: { lowCostCents, highCostCents },
    notes: [
      "This assumes exactly one claim over the N years, with a loss at least as large as the deductible. It is not a probability.",
    ],
  };

  return ok(
    {
      lowCostCents: { amount: lowCostCents, provenance: "illustrative" },
      highCostCents: { amount: highCostCents, provenance: "illustrative" },
    },
    trace,
  );
}
