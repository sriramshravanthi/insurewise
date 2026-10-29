import type { MoneyCents } from "@/schemas/money";
import { insufficientData, invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface PremiumLine {
  key: string;
  label: string;
  amountCents: MoneyCents;
}

export interface PremiumCompositionInput {
  lines: PremiumLine[];
  /** The entered overall premium; defaults to the sum of the lines when omitted. */
  totalCents?: MoneyCents;
}

export interface PremiumCompositionShare {
  key: string;
  label: string;
  amountCents: MoneyCents;
  /** One decimal; every share's percentage sums to exactly 100.0%. */
  percentage: Value<number>;
}

export interface PremiumCompositionOutput {
  shares: PremiumCompositionShare[];
  totalCents: MoneyCents;
}

const UNALLOCATED_KEY = "unallocated";
const TENTHS_OF_A_PERCENT = 1000; // 100.0% expressed in units of 0.1%

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

// Largest-remainder method: floor each share's exact tenths-of-a-percent,
// then distribute the leftover tenths to the largest remainders (ties
// broken by input order) so the total is always exactly 1000 (100.0%).
function allocateTenthsOfAPercent(
  amounts: number[],
  totalCents: number,
): number[] {
  const exactTenths = amounts.map(
    (amount) => (amount * TENTHS_OF_A_PERCENT) / totalCents,
  );
  const floors = exactTenths.map((value) => Math.floor(value));
  let remainder = TENTHS_OF_A_PERCENT - floors.reduce((sum, v) => sum + v, 0);

  const order = exactTenths
    .map((value, index) => ({ index, fraction: value - floors[index] }))
    .sort((a, b) => b.fraction - a.fraction);

  const allocated = [...floors];
  for (const { index } of order) {
    if (remainder <= 0) break;
    allocated[index] += 1;
    remainder -= 1;
  }
  return allocated;
}

export function premiumComposition(
  input: PremiumCompositionInput,
): Result<PremiumCompositionOutput> {
  const { lines } = input;

  for (const line of lines) {
    if (!isNonNegativeInt(line.amountCents)) {
      return invalid([
        {
          field: `lines.${line.key}.amountCents`,
          code: "invalid_money",
          message: "amountCents must be a non-negative integer.",
        },
      ]);
    }
  }
  if (input.totalCents !== undefined && !isNonNegativeInt(input.totalCents)) {
    return invalid([
      {
        field: "totalCents",
        code: "invalid_money",
        message: "totalCents must be a non-negative integer.",
      },
    ]);
  }

  const sumOfLinesCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const totalCents = input.totalCents ?? sumOfLinesCents;

  if (totalCents === 0) {
    return insufficientData(["totalCents"]);
  }
  if (sumOfLinesCents > totalCents) {
    return invalid([
      {
        field: "lines",
        code: "lines_exceed_total",
        message: "The line amounts add up to more than the entered total.",
      },
    ]);
  }

  const unallocatedCents = totalCents - sumOfLinesCents;
  const entries = [
    ...lines.map((line) => ({ key: line.key, label: line.label, amountCents: line.amountCents })),
    ...(unallocatedCents > 0
      ? [{ key: UNALLOCATED_KEY, label: "Unallocated", amountCents: unallocatedCents }]
      : []),
  ];

  const tenths = allocateTenthsOfAPercent(
    entries.map((entry) => entry.amountCents),
    totalCents,
  );

  const shares: PremiumCompositionShare[] = entries.map((entry, index) => ({
    key: entry.key,
    label: entry.label,
    amountCents: entry.amountCents,
    percentage: { amount: tenths[index] / 10, provenance: "calculated" },
  }));

  const traceInputs: TraceInput[] = [
    ...lines.map((line) => ({
      key: `lines.${line.key}`,
      label: line.label,
      value: line.amountCents,
      provenance: "entered" as const,
    })),
    { key: "totalCents", label: "Entered total", value: totalCents, provenance: "entered" as const },
  ];

  const trace: Trace = {
    formulaId: "C7",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps: shares.map((share) => ({
      label: `${share.label} share`,
      expression: `${share.amountCents} / ${totalCents} × 100, largest-remainder rounded`,
      result: share.percentage.amount,
    })),
    output: shares,
    roundingNote:
      "Largest-remainder method: percentages are rounded to one decimal so they always sum to exactly 100.0%.",
    notes:
      unallocatedCents > 0
        ? ["The entered lines do not add up to the entered total; the difference is shown as Unallocated."]
        : [],
  };

  return ok({ shares, totalCents }, trace);
}
