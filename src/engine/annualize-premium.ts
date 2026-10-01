import type { MoneyCents } from "@/schemas/money";
import type { Provenance } from "@/schemas/provenance";
import { insufficientData, invalid, ok, type Result } from "@/schemas/result";
import type { Trace, TraceInput, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export type PremiumBasis = "per_term" | "per_installment";
export type FeeRecurrence = "per_term" | "per_installment" | "one_time";

export interface AnnualizePremiumFee {
  amountCents: MoneyCents;
  recurrence: FeeRecurrence;
}

export interface AnnualizePremiumInput {
  amountCents: MoneyCents;
  amountBasis: PremiumBasis;
  /** Required when amountBasis, or any fee, is per_term. */
  termMonths?: number;
  /** Required when amountBasis, or any fee, is per_installment. */
  installmentsPerYear?: number;
  fees?: AnnualizePremiumFee[];
  /** One-time fees are excluded from the annual total unless opted in. */
  includeOneTimeFees?: boolean;
  /** Provenance of the entered amount and fees (usually "entered"). */
  provenance: Provenance;
}

export interface AnnualizePremiumOutput {
  annualPremium: Value<MoneyCents>;
  oneTimeFeesCents: MoneyCents;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n > 0;
}

export function annualizePremium(
  input: AnnualizePremiumInput,
): Result<AnnualizePremiumOutput> {
  const { amountCents, amountBasis, termMonths, installmentsPerYear } = input;
  const fees = input.fees ?? [];

  if (!isNonNegativeInt(amountCents)) {
    return invalid([
      {
        field: "amountCents",
        code: "invalid_money",
        message: "amountCents must be a non-negative integer.",
      },
    ]);
  }
  for (const [i, fee] of fees.entries()) {
    if (!isNonNegativeInt(fee.amountCents)) {
      return invalid([
        {
          field: `fees[${i}].amountCents`,
          code: "invalid_money",
          message: "fee amountCents must be a non-negative integer.",
        },
      ]);
    }
  }

  const needsTermMonths =
    amountBasis === "per_term" ||
    fees.some((fee) => fee.recurrence === "per_term");
  const needsInstallments =
    amountBasis === "per_installment" ||
    fees.some((fee) => fee.recurrence === "per_installment");

  const missing: string[] = [];
  if (needsTermMonths && termMonths === undefined) missing.push("termMonths");
  if (needsInstallments && installmentsPerYear === undefined)
    missing.push("installmentsPerYear");
  if (missing.length > 0) return insufficientData(missing);

  if (needsTermMonths && !isPositiveInt(termMonths)) {
    return invalid([
      {
        field: "termMonths",
        code: "invalid_term",
        message: "termMonths must be a positive integer.",
      },
    ]);
  }
  if (needsTermMonths && 12 % (termMonths as number) !== 0) {
    return invalid([
      {
        field: "termMonths",
        code: "not_divisor_of_12",
        message: "termMonths must evenly divide 12.",
      },
    ]);
  }
  if (needsInstallments && !isPositiveInt(installmentsPerYear)) {
    return invalid([
      {
        field: "installmentsPerYear",
        code: "invalid_installments",
        message: "installmentsPerYear must be a positive integer.",
      },
    ]);
  }

  const termFactor = needsTermMonths ? 12 / (termMonths as number) : 0;
  const installmentFactor = needsInstallments
    ? (installmentsPerYear as number)
    : 0;

  const factorFor = (recurrence: FeeRecurrence) =>
    recurrence === "per_term" ? termFactor : installmentFactor;

  const mainAnnualCents = amountCents * factorFor(amountBasis);
  const recurringFeesAnnualCents = fees
    .filter((fee) => fee.recurrence !== "one_time")
    .reduce((sum, fee) => sum + fee.amountCents * factorFor(fee.recurrence), 0);
  const oneTimeFeesCents = fees
    .filter((fee) => fee.recurrence === "one_time")
    .reduce((sum, fee) => sum + fee.amountCents, 0);

  const annualPremiumCents =
    mainAnnualCents +
    recurringFeesAnnualCents +
    (input.includeOneTimeFees ? oneTimeFeesCents : 0);

  const notes: string[] = [];
  if (amountCents === 0) notes.push("Entered premium is $0.00.");
  if (oneTimeFeesCents > 0 && !input.includeOneTimeFees) {
    notes.push(
      "One-time fees are excluded from the annual total shown here.",
    );
  }

  const outputProvenance: Provenance =
    input.provenance === "illustrative" ? "illustrative" : "calculated";

  const traceInputs: TraceInput[] = [
    {
      key: "amountCents",
      label: "Premium amount",
      value: amountCents,
      provenance: input.provenance,
    },
    {
      key: "amountBasis",
      label: "Amount basis",
      value: amountBasis,
      provenance: input.provenance,
    },
  ];
  if (needsTermMonths) {
    traceInputs.push({
      key: "termMonths",
      label: "Term (months)",
      value: termMonths,
      provenance: input.provenance,
    });
  }
  if (needsInstallments) {
    traceInputs.push({
      key: "installmentsPerYear",
      label: "Installments per year",
      value: installmentsPerYear,
      provenance: input.provenance,
    });
  }

  const trace: Trace = {
    formulaId: "C1",
    engineVersion: ENGINE_VERSION,
    inputs: traceInputs,
    steps: [
      {
        label:
          amountBasis === "per_term"
            ? "Annualize the term premium"
            : "Annualize the installment premium",
        expression:
          amountBasis === "per_term"
            ? `${amountCents} × (12 / ${termMonths})`
            : `${amountCents} × ${installmentsPerYear}`,
        result: mainAnnualCents,
      },
      ...(recurringFeesAnnualCents > 0
        ? [
            {
              label: "Annualize recurring fees",
              expression: "Σ fee.amountCents × its own recurrence factor",
              result: recurringFeesAnnualCents,
            },
          ]
        : []),
      {
        label: "Annual premium",
        expression:
          input.includeOneTimeFees && oneTimeFeesCents > 0
            ? `${mainAnnualCents} + ${recurringFeesAnnualCents} + ${oneTimeFeesCents}`
            : `${mainAnnualCents} + ${recurringFeesAnnualCents}`,
        result: annualPremiumCents,
      },
    ],
    output: annualPremiumCents,
    notes,
  };

  return ok(
    {
      annualPremium: {
        amount: annualPremiumCents,
        provenance: outputProvenance,
      },
      oneTimeFeesCents,
    },
    trace,
  );
}
