import type { MoneyCents } from "@/schemas/money";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export type LimitBasis = "after_deductible" | "before_deductible";

export interface OutOfPocketInput {
  lossCents: MoneyCents;
  deductibleCents: MoneyCents;
  /** Omit for an unbounded (no-limit) coverage. */
  limitCents?: MoneyCents;
  /** @default "after_deductible" */
  limitBasis?: LimitBasis;
}

export interface OutOfPocketOutput {
  insurerPaysCents: Value<MoneyCents>;
  userPaysCents: Value<MoneyCents>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

export function outOfPocketOnClaim(
  input: OutOfPocketInput,
): Result<OutOfPocketOutput> {
  const { lossCents, deductibleCents, limitCents } = input;
  const limitBasis = input.limitBasis ?? "after_deductible";

  if (!isNonNegativeInt(lossCents)) {
    return invalid([
      {
        field: "lossCents",
        code: "invalid_money",
        message: "lossCents must be a non-negative integer.",
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

  const effectiveLimit = limitCents ?? Infinity;
  const insurerPaysCents =
    limitBasis === "after_deductible"
      ? Math.max(0, Math.min(lossCents - deductibleCents, effectiveLimit))
      : Math.max(0, Math.min(lossCents, effectiveLimit) - deductibleCents);
  const userPaysCents = lossCents - insurerPaysCents;

  const traceInputs: TraceInput[] = [
    { key: "lossCents", label: "Loss", value: lossCents, provenance: "entered" },
    {
      key: "deductibleCents",
      label: "Deductible",
      value: deductibleCents,
      provenance: "entered",
    },
    {
      key: "limitCents",
      label: "Limit",
      value: limitCents ?? "unbounded",
      provenance: "entered",
    },
    { key: "limitBasis", label: "Limit basis", value: limitBasis, provenance: "entered" },
  ];

  // The limit/deductible interaction order isn't yet verified against a
  // sourced policy form, so C3's output is always Illustrative — not just
  // when inputs are (docs/CALCULATIONS.md §2, C3).
  const trace: Trace = {
    formulaId: "C3",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps: [
      {
        label: "Insurer pays",
        expression:
          limitBasis === "after_deductible"
            ? `max(0, min(${lossCents} − ${deductibleCents}, ${limitCents ?? "∞"}))`
            : `max(0, min(${lossCents}, ${limitCents ?? "∞"}) − ${deductibleCents})`,
        result: insurerPaysCents,
      },
      {
        label: "User pays",
        expression: `${lossCents} − ${insurerPaysCents}`,
        result: userPaysCents,
      },
    ],
    output: { insurerPaysCents, userPaysCents },
    notes: [
      "This result is Illustrative: how a limit and a deductible interact can vary by policy form; check your policy language.",
    ],
  };

  return ok(
    {
      insurerPaysCents: { amount: insurerPaysCents, provenance: "illustrative" },
      userPaysCents: { amount: userPaysCents, provenance: "illustrative" },
    },
    trace,
  );
}
