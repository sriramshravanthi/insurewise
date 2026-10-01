import type { MoneyCents } from "@/schemas/money";
import type { Provenance } from "@/schemas/provenance";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface DeductibleOption {
  deductibleCents: MoneyCents;
  annualPremiumCents: MoneyCents;
}

export interface DeductibleTradeOffInput {
  low: DeductibleOption;
  high: DeductibleOption;
  /** Provenance of the entered deductibles and premiums (usually "entered"). */
  provenance: Provenance;
}

export interface DeductibleTradeOffOutput {
  /** P_low − P_high, in cents. Positive means the higher deductible has the lower premium. */
  annualPremiumDifferenceCents: Value<number>;
  /** D_high − D_low, in cents. Always positive given valid (ordered) input. */
  extraOutOfPocketIfClaimCents: Value<MoneyCents>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

export function deductibleTradeOff(
  input: DeductibleTradeOffInput,
): Result<DeductibleTradeOffOutput> {
  const { low, high } = input;

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

  const annualPremiumDifferenceCents =
    low.annualPremiumCents - high.annualPremiumCents;
  const extraOutOfPocketIfClaimCents =
    high.deductibleCents - low.deductibleCents;

  const notes: string[] = [];
  if (annualPremiumDifferenceCents <= 0) {
    notes.push(
      "No premium reduction was entered for the higher deductible.",
    );
  }

  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";

  const traceInputs: TraceInput[] = [
    {
      key: "low.deductibleCents",
      label: "Lower deductible",
      value: low.deductibleCents,
      provenance: input.provenance,
    },
    {
      key: "low.annualPremiumCents",
      label: "Premium at the lower deductible",
      value: low.annualPremiumCents,
      provenance: input.provenance,
    },
    {
      key: "high.deductibleCents",
      label: "Higher deductible",
      value: high.deductibleCents,
      provenance: input.provenance,
    },
    {
      key: "high.annualPremiumCents",
      label: "Premium at the higher deductible",
      value: high.annualPremiumCents,
      provenance: input.provenance,
    },
  ];

  const trace: Trace = {
    formulaId: "C4",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps: [
      {
        label: "Annual premium difference",
        expression: `${low.annualPremiumCents} − ${high.annualPremiumCents}`,
        result: annualPremiumDifferenceCents,
      },
      {
        label: "Extra out-of-pocket if a claim happens",
        expression: `${high.deductibleCents} − ${low.deductibleCents}`,
        result: extraOutOfPocketIfClaimCents,
      },
    ],
    output: { annualPremiumDifferenceCents, extraOutOfPocketIfClaimCents },
    notes,
  };

  return ok(
    {
      annualPremiumDifferenceCents: {
        amount: annualPremiumDifferenceCents,
        provenance: outputProvenance,
      },
      extraOutOfPocketIfClaimCents: {
        amount: extraOutOfPocketIfClaimCents,
        provenance: outputProvenance,
      },
    },
    trace,
  );
}
