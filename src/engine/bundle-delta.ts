import type { MoneyCents } from "@/schemas/money";
import type { Provenance } from "@/schemas/provenance";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export type BundleWording = "lower" | "higher" | "the same";

export interface BundleDeltaInput {
  /** Annual premiums of the policies if bought separately. */
  separatePremiumsCents: MoneyCents[];
  /** Annual premium of the bundled entry. */
  bundledPremiumCents: MoneyCents;
  /** Provenance of the entered premiums. */
  provenance: Provenance;
}

export interface BundleDeltaOutput {
  separateTotalCents: Value<MoneyCents>;
  /** separate − bundled, in cents. Positive means the bundle is lower. */
  differenceCents: Value<number>;
  /** difference / separate × 100, one decimal, signed. Omitted when separateTotal is $0. */
  percentage?: Value<number>;
  /** Neutral, sign-derived wording — never "best"/"cheapest" (CLAUDE.md rule 4). */
  wording: BundleWording;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

function roundHalfUpToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function wordingFor(differenceCents: number): BundleWording {
  if (differenceCents > 0) return "lower";
  if (differenceCents < 0) return "higher";
  return "the same";
}

export function bundleDelta(input: BundleDeltaInput): Result<BundleDeltaOutput> {
  const { separatePremiumsCents, bundledPremiumCents } = input;

  for (const [index, amount] of separatePremiumsCents.entries()) {
    if (!isNonNegativeInt(amount)) {
      return invalid([
        {
          field: `separatePremiumsCents[${index}]`,
          code: "invalid_money",
          message: "Each separate premium must be a non-negative integer.",
        },
      ]);
    }
  }
  if (!isNonNegativeInt(bundledPremiumCents)) {
    return invalid([
      {
        field: "bundledPremiumCents",
        code: "invalid_money",
        message: "bundledPremiumCents must be a non-negative integer.",
      },
    ]);
  }

  const separateTotalCents = separatePremiumsCents.reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const differenceCents = separateTotalCents - bundledPremiumCents;
  const wording = wordingFor(differenceCents);
  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";

  const traceInputs: TraceInput[] = [
    ...separatePremiumsCents.map((amount, index) => ({
      key: `separatePremiumsCents[${index}]`,
      label: `Separate policy ${index + 1} premium`,
      value: amount,
      provenance: input.provenance,
    })),
    {
      key: "bundledPremiumCents",
      label: "Bundled premium",
      value: bundledPremiumCents,
      provenance: input.provenance,
    },
  ];

  const steps = [
    {
      label: "Separate total",
      expression: separatePremiumsCents.join(" + ") || "0",
      result: separateTotalCents,
    },
    {
      label: "Difference",
      expression: `${separateTotalCents} − ${bundledPremiumCents}`,
      result: differenceCents,
    },
  ];
  const notes: string[] = [];

  let percentage: Value<number> | undefined;
  if (separateTotalCents === 0) {
    notes.push(
      "Percentage change is not shown because the separate total is $0.00.",
    );
  } else {
    const percentageValue = roundHalfUpToOneDecimal(
      (differenceCents / separateTotalCents) * 100,
    );
    percentage = { amount: percentageValue, provenance: outputProvenance };
    steps.push({
      label: "Percentage",
      expression: `${differenceCents} / ${separateTotalCents} × 100`,
      result: percentageValue,
    });
  }

  const trace: Trace = {
    formulaId: "C9",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps,
    output: { differenceCents, percentage: percentage?.amount, wording },
    roundingNote: "Percentage rounded to one decimal, half-up.",
    notes,
  };

  return ok(
    {
      separateTotalCents: {
        amount: separateTotalCents,
        provenance: outputProvenance,
      },
      differenceCents: { amount: differenceCents, provenance: outputProvenance },
      percentage,
      wording,
    },
    trace,
  );
}
