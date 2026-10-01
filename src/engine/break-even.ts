import type { Provenance } from "@/schemas/provenance";
import { ok, type Result } from "@/schemas/result";
import type { Trace, Value } from "@/schemas/value";
import {
  deductibleTradeOff,
  type DeductibleTradeOffInput,
} from "./deductible-trade-off";
import { ENGINE_VERSION } from "./engine-version";

export type BreakEvenInput = DeductibleTradeOffInput;

export type BreakEvenStatus = "computed" | "no_premium_savings_entered";

export interface BreakEvenOutput {
  status: BreakEvenStatus;
  /** Present only when status is "computed"; rounded to one decimal, half-up. */
  breakEvenYears?: Value<number>;
}

function roundHalfUpToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function breakEvenYears(
  input: BreakEvenInput,
): Result<BreakEvenOutput> {
  const tradeOff = deductibleTradeOff(input);
  if (tradeOff.status !== "ok") return tradeOff;

  const savingsCents = tradeOff.value.annualPremiumDifferenceCents.amount;
  const extraOutOfPocketCents =
    tradeOff.value.extraOutOfPocketIfClaimCents.amount;

  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";

  if (savingsCents <= 0) {
    const trace: Trace = {
      formulaId: "C5",
      engineVersion: ENGINE_VERSION,
      inputs: tradeOff.trace.inputs,
      steps: tradeOff.trace.steps,
      output: null,
      notes: [
        "No break-even: no premium savings were entered for the higher deductible.",
      ],
    };
    return ok({ status: "no_premium_savings_entered" }, trace);
  }

  const rawYears = extraOutOfPocketCents / savingsCents;
  const years = roundHalfUpToOneDecimal(rawYears);

  const trace: Trace = {
    formulaId: "C5",
    engineVersion: ENGINE_VERSION,
    inputs: tradeOff.trace.inputs,
    steps: [
      ...tradeOff.trace.steps,
      {
        label: "Break-even (claim-free years)",
        expression: `${extraOutOfPocketCents} / ${savingsCents}`,
        result: years,
      },
    ],
    output: years,
    roundingNote: "Rounded to one decimal, half-up.",
    notes: [],
  };

  return ok(
    {
      status: "computed",
      breakEvenYears: { amount: years, provenance: outputProvenance },
    },
    trace,
  );
}
