import type { MoneyCents } from "@/schemas/money";
import type { Provenance } from "@/schemas/provenance";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface HomeCoverageRatiosInput {
  /** Coverage A, dwelling limit. Required: it's the denominator for two of the three ratios. */
  dwellingLimitCents: MoneyCents;
  /** Coverage C, contents limit. */
  contentsLimitCents?: MoneyCents;
  /** Coverage D, loss-of-use limit. */
  lossOfUseLimitCents?: MoneyCents;
  /** Entered directly, or sourced from C11 once that exists. */
  rebuildEstimateCents?: MoneyCents;
  provenance: Provenance;
  /**
   * Provenance of rebuildEstimateCents specifically, when it differs from
   * `provenance` — e.g. computed via C11 (always Illustrative,
   * docs/CALCULATIONS.md §2) rather than entered directly. Defaults to
   * `provenance` when omitted, so existing callers are unaffected.
   */
  rebuildEstimateProvenance?: Provenance;
}

export interface HomeCoverageRatiosOutput {
  contentsRatio?: Value<number>;
  lossOfUseRatio?: Value<number>;
  dwellingVsRebuildRatio?: Value<number>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

function roundHalfUpToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function homeCoverageRatios(
  input: HomeCoverageRatiosInput,
): Result<HomeCoverageRatiosOutput> {
  const {
    dwellingLimitCents,
    contentsLimitCents,
    lossOfUseLimitCents,
    rebuildEstimateCents,
  } = input;

  if (!isNonNegativeInt(dwellingLimitCents)) {
    return invalid([
      {
        field: "dwellingLimitCents",
        code: "invalid_money",
        message: "dwellingLimitCents must be a non-negative integer.",
      },
    ]);
  }
  for (const [field, value] of [
    ["contentsLimitCents", contentsLimitCents],
    ["lossOfUseLimitCents", lossOfUseLimitCents],
    ["rebuildEstimateCents", rebuildEstimateCents],
  ] as const) {
    if (value !== undefined && !isNonNegativeInt(value)) {
      return invalid([
        {
          field,
          code: "invalid_money",
          message: `${field} must be a non-negative integer.`,
        },
      ]);
    }
  }

  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";
  const rebuildEstimateProvenance = input.rebuildEstimateProvenance ?? input.provenance;
  // dwellingVsRebuildRatio depends on rebuildEstimateCents, not
  // contents/lossOfUse — its provenance must reflect rebuildEstimateCents's
  // own weakest-link provenance, which can differ from the other two
  // ratios' (CALCULATIONS.md §1: "If any input is Illustrative, the output
  // is labeled Illustrative").
  const dwellingVsRebuildProvenance: Provenance =
    input.provenance === "illustrative" || rebuildEstimateProvenance === "illustrative"
      ? "illustrative"
      : "calculated";

  const traceInputs: TraceInput[] = [
    {
      key: "dwellingLimitCents",
      label: "Dwelling limit (Coverage A)",
      value: dwellingLimitCents,
      provenance: input.provenance,
    },
  ];
  const steps: Trace["steps"] = [];
  const notes: string[] = [];

  let contentsRatio: Value<number> | undefined;
  if (contentsLimitCents !== undefined) {
    traceInputs.push({
      key: "contentsLimitCents",
      label: "Contents limit (Coverage C)",
      value: contentsLimitCents,
      provenance: input.provenance,
    });
    if (dwellingLimitCents === 0) {
      notes.push(
        "Contents ratio is not shown because the dwelling limit is $0.00.",
      );
    } else {
      const value = roundHalfUpToOneDecimal(
        (contentsLimitCents / dwellingLimitCents) * 100,
      );
      contentsRatio = { amount: value, provenance: outputProvenance };
      steps.push({
        label: "Contents ratio",
        expression: `${contentsLimitCents} / ${dwellingLimitCents} × 100`,
        result: value,
      });
    }
  }

  let lossOfUseRatio: Value<number> | undefined;
  if (lossOfUseLimitCents !== undefined) {
    traceInputs.push({
      key: "lossOfUseLimitCents",
      label: "Loss-of-use limit (Coverage D)",
      value: lossOfUseLimitCents,
      provenance: input.provenance,
    });
    if (dwellingLimitCents === 0) {
      notes.push(
        "Loss-of-use ratio is not shown because the dwelling limit is $0.00.",
      );
    } else {
      const value = roundHalfUpToOneDecimal(
        (lossOfUseLimitCents / dwellingLimitCents) * 100,
      );
      lossOfUseRatio = { amount: value, provenance: outputProvenance };
      steps.push({
        label: "Loss-of-use ratio",
        expression: `${lossOfUseLimitCents} / ${dwellingLimitCents} × 100`,
        result: value,
      });
    }
  }

  let dwellingVsRebuildRatio: Value<number> | undefined;
  if (rebuildEstimateCents !== undefined) {
    traceInputs.push({
      key: "rebuildEstimateCents",
      label: "Rebuild estimate",
      value: rebuildEstimateCents,
      provenance: rebuildEstimateProvenance,
    });
    if (rebuildEstimateCents === 0) {
      notes.push(
        "Dwelling-vs-rebuild ratio is not shown because the rebuild estimate is $0.00.",
      );
    } else {
      const value = roundHalfUpToOneDecimal(
        (dwellingLimitCents / rebuildEstimateCents) * 100,
      );
      dwellingVsRebuildRatio = { amount: value, provenance: dwellingVsRebuildProvenance };
      steps.push({
        label: "Dwelling-vs-rebuild ratio",
        expression: `${dwellingLimitCents} / ${rebuildEstimateCents} × 100`,
        result: value,
      });
    }
  }

  const trace: Trace = {
    formulaId: "C10",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps,
    output: {
      contentsRatio: contentsRatio?.amount,
      lossOfUseRatio: lossOfUseRatio?.amount,
      dwellingVsRebuildRatio: dwellingVsRebuildRatio?.amount,
    },
    roundingNote: "Percentages rounded to one decimal, half-up.",
    notes,
  };

  return ok(
    { contentsRatio, lossOfUseRatio, dwellingVsRebuildRatio },
    trace,
  );
}
