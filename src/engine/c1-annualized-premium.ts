/**
 * C1: Annualized premium
 * Converts a per-term or per-installment premium to an annual figure.
 */

import {
  ENGINE_VERSION,
  EngineResult,
  ProvenancedInput,
  provenanceOfInputs,
  roundHalfUp,
} from "./types";

export type AmountBasis = "per_term" | "per_installment";
export type TermMonths = 1 | 3 | 6 | 12;
export type InstallmentsPerYear = 1 | 2 | 4 | 6 | 12;

export interface C1Input {
  amountCents: number;
  amountBasis: AmountBasis;
  termMonths?: TermMonths; // required for per_term
  installmentsPerYear?: InstallmentsPerYear; // required for per_installment
}

const VALID_TERM_MONTHS: readonly number[] = [1, 3, 6, 12];

export function c1AnnualizedPremium(
  input: C1Input
): EngineResult<{ annualCents: number }> {
  const { amountCents, amountBasis, termMonths, installmentsPerYear } = input;

  // Validate amount
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    return {
      status: "invalid",
      errors: [
        {
          field: "amountCents",
          code: "NON_NEGATIVE_FINITE",
          message: "Premium amount must be a non-negative number.",
        },
      ],
    };
  }

  const provenancedInputs: ProvenancedInput[] = [
    {
      key: "amountCents",
      label: "Premium amount",
      value: amountCents,
      provenance: "Entered",
    },
  ];

  let annualCents: number;
  let steps: { label: string; expression: string; result: number | string }[] =
    [];

  if (amountBasis === "per_term") {
    if (termMonths === undefined) {
      return { status: "insufficient_data", missing: ["termMonths"] };
    }
    if (!VALID_TERM_MONTHS.includes(termMonths)) {
      return {
        status: "invalid",
        errors: [
          {
            field: "termMonths",
            code: "INVALID_TERM",
            message: `Term must be one of ${VALID_TERM_MONTHS.join(", ")} months.`,
          },
        ],
      };
    }
    if (12 % termMonths !== 0) {
      return {
        status: "invalid",
        errors: [
          {
            field: "termMonths",
            code: "TERM_DOES_NOT_DIVIDE_YEAR",
            message: `Term ${termMonths} months does not divide evenly into 12.`,
          },
        ],
      };
    }
    provenancedInputs.push({
      key: "termMonths",
      label: "Policy term (months)",
      value: termMonths,
      provenance: "Entered",
    });
    const multiplier = 12 / termMonths;
    annualCents = roundHalfUp(amountCents * multiplier);
    steps = [
      {
        label: "Multiplier",
        expression: `12 ÷ ${termMonths}`,
        result: multiplier,
      },
      {
        label: "Annual premium",
        expression: `${amountCents} × ${multiplier}`,
        result: annualCents,
      },
    ];
  } else {
    // per_installment
    if (installmentsPerYear === undefined) {
      return { status: "insufficient_data", missing: ["installmentsPerYear"] };
    }
    provenancedInputs.push({
      key: "installmentsPerYear",
      label: "Installments per year",
      value: installmentsPerYear,
      provenance: "Entered",
    });
    annualCents = roundHalfUp(amountCents * installmentsPerYear);
    steps = [
      {
        label: "Annual premium",
        expression: `${amountCents} × ${installmentsPerYear}`,
        result: annualCents,
      },
    ];
  }

  const outputProvenance = provenanceOfInputs(provenancedInputs);
  const notes: string[] = [];
  if (amountCents === 0) {
    notes.push("Premium amount is zero — confirm this is correct.");
  }

  return {
    status: "ok",
    value: { annualCents },
    trace: {
      formulaId: "C1",
      engineVersion: ENGINE_VERSION,
      inputs: provenancedInputs,
      steps,
      output: annualCents,
      outputProvenance,
      roundingNote: "Final value rounded half-up to nearest cent.",
      notes,
    },
  };
}
