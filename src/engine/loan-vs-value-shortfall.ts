import type { MoneyCents } from "@/schemas/money";
import type { Provenance } from "@/schemas/provenance";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface LoanVsValueShortfallInput {
  loanBalanceCents: MoneyCents;
  vehicleValueCents: MoneyCents;
  /** A raw entered fact, reported back unchanged alongside the shortfall. */
  gapCoverageEntered: boolean;
  provenance: Provenance;
}

export interface LoanVsValueShortfallOutput {
  shortfallCents: Value<MoneyCents>;
  /** Always "entered" — this is a raw fact, never calculated or illustrative. */
  gapCoverageEntered: Value<boolean>;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

export function loanVsValueShortfall(
  input: LoanVsValueShortfallInput,
): Result<LoanVsValueShortfallOutput> {
  const { loanBalanceCents, vehicleValueCents, gapCoverageEntered } = input;

  if (!isNonNegativeInt(loanBalanceCents)) {
    return invalid([
      {
        field: "loanBalanceCents",
        code: "invalid_money",
        message: "loanBalanceCents must be a non-negative integer.",
      },
    ]);
  }
  if (!isNonNegativeInt(vehicleValueCents)) {
    return invalid([
      {
        field: "vehicleValueCents",
        code: "invalid_money",
        message: "vehicleValueCents must be a non-negative integer.",
      },
    ]);
  }
  if (typeof gapCoverageEntered !== "boolean") {
    return invalid([
      {
        field: "gapCoverageEntered",
        code: "invalid_boolean",
        message: "gapCoverageEntered must be a boolean.",
      },
    ]);
  }

  const shortfallCents = Math.max(0, loanBalanceCents - vehicleValueCents);
  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";

  const trace: Trace = {
    formulaId: "C14",
    engineVersion: ENGINE_VERSION,
    inputs: [
      {
        key: "loanBalanceCents",
        label: "Loan balance",
        value: loanBalanceCents,
        provenance: input.provenance,
      },
      {
        key: "vehicleValueCents",
        label: "Vehicle value",
        value: vehicleValueCents,
        provenance: input.provenance,
      },
      {
        key: "gapCoverageEntered",
        label: "Gap coverage entered",
        value: gapCoverageEntered,
        provenance: "entered",
      },
    ],
    steps: [
      {
        label: "Shortfall",
        expression: `max(0, ${loanBalanceCents} − ${vehicleValueCents})`,
        result: shortfallCents,
      },
    ],
    output: { shortfallCents, gapCoverageEntered },
    notes: [],
  };

  return ok(
    {
      shortfallCents: { amount: shortfallCents, provenance: outputProvenance },
      gapCoverageEntered: { amount: gapCoverageEntered, provenance: "entered" },
    },
    trace,
  );
}
