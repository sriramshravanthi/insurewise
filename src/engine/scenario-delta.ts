import type { MoneyCents } from "@/schemas/money";
import type { Provenance } from "@/schemas/provenance";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface ScenarioDeltaInput {
  baselineCents: MoneyCents;
  scenarioCents: MoneyCents;
  /** Provenance of the entered baseline and scenario premiums. */
  provenance: Provenance;
}

export interface ScenarioDeltaOutput {
  /** scenario − baseline, in cents. Sign preserved. */
  deltaCents: Value<number>;
  /** delta / baseline × 100, one decimal. Omitted when the baseline is $0. */
  percentage?: Value<number>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

function roundHalfUpToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function scenarioDelta(
  input: ScenarioDeltaInput,
): Result<ScenarioDeltaOutput> {
  const { baselineCents, scenarioCents } = input;

  if (!isNonNegativeInt(baselineCents)) {
    return invalid([
      {
        field: "baselineCents",
        code: "invalid_money",
        message: "baselineCents must be a non-negative integer.",
      },
    ]);
  }
  if (!isNonNegativeInt(scenarioCents)) {
    return invalid([
      {
        field: "scenarioCents",
        code: "invalid_money",
        message: "scenarioCents must be a non-negative integer.",
      },
    ]);
  }

  const deltaCents = scenarioCents - baselineCents;
  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";

  const traceInputs: TraceInput[] = [
    {
      key: "baselineCents",
      label: "Baseline premium",
      value: baselineCents,
      provenance: input.provenance,
    },
    {
      key: "scenarioCents",
      label: "Scenario premium",
      value: scenarioCents,
      provenance: input.provenance,
    },
  ];

  const steps = [
    {
      label: "Delta",
      expression: `${scenarioCents} − ${baselineCents}`,
      result: deltaCents,
    },
  ];
  const notes: string[] = [];

  let percentage: Value<number> | undefined;
  if (baselineCents === 0) {
    notes.push(
      "Percentage change is not shown because the baseline is $0.00.",
    );
  } else {
    const percentageValue = roundHalfUpToOneDecimal(
      (deltaCents / baselineCents) * 100,
    );
    percentage = { amount: percentageValue, provenance: outputProvenance };
    steps.push({
      label: "Percentage",
      expression: `${deltaCents} / ${baselineCents} × 100`,
      result: percentageValue,
    });
  }

  const trace: Trace = {
    formulaId: "C8",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps,
    output: { deltaCents, percentage: percentage?.amount },
    roundingNote: "Percentage rounded to one decimal, half-up.",
    notes,
  };

  return ok(
    {
      deltaCents: { amount: deltaCents, provenance: outputProvenance },
      percentage,
    },
    trace,
  );
}
