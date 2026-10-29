import type { MoneyCents } from "@/schemas/money";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface RebuildEstimateInput {
  /** Entered by the user. */
  squareFeet: number;
  /** Entered by the user, but always Illustrative — the engine ships no
   * built-in cost-per-square-foot figures unless a cited reference exists
   * (docs/CALCULATIONS.md §2, C11). */
  costPerSqFtCents: MoneyCents;
}

export interface RebuildEstimateOutput {
  rebuildEstimateCents: Value<MoneyCents>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

export function rebuildEstimate(
  input: RebuildEstimateInput,
): Result<RebuildEstimateOutput> {
  const { squareFeet, costPerSqFtCents } = input;

  if (!isNonNegativeInt(squareFeet)) {
    return invalid([
      {
        field: "squareFeet",
        code: "invalid_square_feet",
        message: "squareFeet must be a non-negative integer.",
      },
    ]);
  }
  if (!isNonNegativeInt(costPerSqFtCents)) {
    return invalid([
      {
        field: "costPerSqFtCents",
        code: "invalid_money",
        message: "costPerSqFtCents must be a non-negative integer.",
      },
    ]);
  }

  const rebuildEstimateCents = squareFeet * costPerSqFtCents;

  const notes: string[] = [];
  if (squareFeet === 0) notes.push("Entered square footage is 0.");
  if (costPerSqFtCents === 0) {
    notes.push("Entered cost per square foot is $0.00.");
  }

  // costPerSqFt is always Illustrative, so the rebuild estimate is always
  // Illustrative too — not conditional on an input provenance parameter
  // (docs/CALCULATIONS.md §2, C11).
  const trace: Trace = {
    formulaId: "C11",
    engineVersion: ENGINE_VERSION,
    inputs: [
      {
        key: "squareFeet",
        label: "Square feet",
        value: squareFeet,
        provenance: "entered",
      },
      {
        key: "costPerSqFtCents",
        label: "Cost per square foot",
        value: costPerSqFtCents,
        provenance: "illustrative",
      },
    ],
    steps: [
      {
        label: "Rebuild estimate",
        expression: `${squareFeet} × ${costPerSqFtCents}`,
        result: rebuildEstimateCents,
      },
    ],
    output: rebuildEstimateCents,
    notes,
  };

  return ok(
    {
      rebuildEstimateCents: {
        amount: rebuildEstimateCents,
        provenance: "illustrative",
      },
    },
    trace,
  );
}
