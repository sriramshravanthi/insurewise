import { z } from "zod";
import { dollarsToCents } from "./deductible-simulator-form";
import type { PolicyForComparison } from "./policy-for-comparison";

// Four generic coverage codes, reused from docs/CALCULATIONS.md §2 (C7)'s
// own worked example (liability, collision, comprehensive, UM) rather than
// inventing a new coverage list. Car-only for this cycle; Home has no
// schema yet (a later milestone).
export const COMPARISON_COVERAGE_CODES = [
  "liability",
  "collision",
  "comprehensive",
  "um",
] as const;

const coverageFormSchema = z.object({
  code: z.enum(COMPARISON_COVERAGE_CODES),
  included: z.boolean(),
  limitPrimaryDollars: z.number().nonnegative().optional(),
  limitSecondaryDollars: z.number().nonnegative().optional(),
  deductibleDollars: z.number().nonnegative().optional(),
  /** "" means not entered. Opaque label, not interpreted (see diffable-policy.ts). */
  valuationBasis: z.string().optional(),
});
export type CoverageForm = z.infer<typeof coverageFormSchema>;

const policyFormSchema = z.object({
  label: z.string().min(1),
  termMonths: z.number().int().positive(),
  annualPremiumDollars: z.number().nonnegative(),
  coverages: z.array(coverageFormSchema).length(COMPARISON_COVERAGE_CODES.length),
  /** One endorsement label per line. */
  endorsementsText: z.string(),
  /** One limitation per line. */
  limitationsText: z.string(),
});
export type PolicyForm = z.infer<typeof policyFormSchema>;

export const PolicyComparisonFormSchema = z.object({
  baseline: policyFormSchema,
  comparisons: z.array(policyFormSchema).min(1).max(3),
});
export type PolicyComparisonForm = z.infer<typeof PolicyComparisonFormSchema>;

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function emptyPolicyForm(label: string): PolicyForm {
  return {
    label,
    termMonths: 12,
    annualPremiumDollars: 0,
    coverages: COMPARISON_COVERAGE_CODES.map((code) => ({
      code,
      included: false,
      valuationBasis: "",
    })),
    endorsementsText: "",
    limitationsText: "",
  };
}

export function toPolicyForComparison(policy: PolicyForm): PolicyForComparison {
  return {
    policyType: "car",
    termMonths: policy.termMonths,
    provenance: "entered",
    annualPremiumCents: dollarsToCents(policy.annualPremiumDollars),
    coverages: policy.coverages.map((c) => ({
      code: c.code,
      included: c.included,
      limitPrimaryCents:
        c.limitPrimaryDollars !== undefined
          ? dollarsToCents(c.limitPrimaryDollars)
          : undefined,
      limitSecondaryCents:
        c.limitSecondaryDollars !== undefined
          ? dollarsToCents(c.limitSecondaryDollars)
          : undefined,
      deductibleCents:
        c.deductibleDollars !== undefined
          ? dollarsToCents(c.deductibleDollars)
          : undefined,
      valuationBasis: c.valuationBasis || undefined,
    })),
    endorsements: linesToList(policy.endorsementsText).map((label) => ({
      label,
    })),
    limitations: linesToList(policy.limitationsText).map((text) => ({ text })),
  };
}

export function fromPolicyForComparison(
  label: string,
  policy: PolicyForComparison,
): PolicyForm {
  const byCode = new Map(policy.coverages.map((c) => [c.code, c]));
  return {
    label,
    termMonths: policy.termMonths ?? 12,
    annualPremiumDollars: (policy.annualPremiumCents ?? 0) / 100,
    coverages: COMPARISON_COVERAGE_CODES.map((code) => {
      const c = byCode.get(code);
      return {
        code,
        included: c?.included ?? false,
        limitPrimaryDollars:
          c?.limitPrimaryCents !== undefined ? c.limitPrimaryCents / 100 : undefined,
        limitSecondaryDollars:
          c?.limitSecondaryCents !== undefined
            ? c.limitSecondaryCents / 100
            : undefined,
        deductibleDollars:
          c?.deductibleCents !== undefined ? c.deductibleCents / 100 : undefined,
        valuationBasis: c?.valuationBasis ?? "",
      };
    }),
    endorsementsText: policy.endorsements.map((e) => e.label).join("\n"),
    limitationsText: policy.limitations.map((l) => l.text).join("\n"),
  };
}
