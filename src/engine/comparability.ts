/**
 * Comparability checks — pure functions over normalized policy pairs/groups.
 * Returns typed warnings; never implies which policy is preferable.
 */

export type ComparabilityWarningCode =
  | "DIFFERENT_LIMIT"
  | "DIFFERENT_DEDUCTIBLE"
  | "COVERAGE_ONLY_IN_ONE"
  | "DIFFERENT_TERM"
  | "DIFFERENT_VALUATION_BASIS"
  | "FIELD_NOT_ENTERED"
  | "DIFFERENT_POLICY_TYPE";

export interface ComparabilityWarning {
  code: ComparabilityWarningCode;
  fields: string[];
  policyLabels: string[];
  message: string;
}

export interface PolicySnapshot {
  label: string;
  termMonths?: number;
  policyType?: string;
  coverages: {
    key: string;
    limitCents?: number | null;
    deductibleCents?: number | null;
    valuationBasis?: "ACV" | "RCV" | null;
    included?: boolean | null; // null = not_entered
  }[];
}

export function checkComparability(
  policies: PolicySnapshot[]
): ComparabilityWarning[] {
  if (policies.length < 2) return [];

  const warnings: ComparabilityWarning[] = [];

  // Different policy type blocks comparison
  const policyTypes = policies.map((p) => p.policyType).filter(Boolean);
  if (new Set(policyTypes).size > 1) {
    warnings.push({
      code: "DIFFERENT_POLICY_TYPE",
      fields: ["policyType"],
      policyLabels: policies.map((p) => p.label),
      message: "Policies have different types — comparison may not be meaningful.",
    });
  }

  // Different term
  const terms = policies.map((p) => p.termMonths).filter((t) => t !== undefined);
  if (new Set(terms).size > 1) {
    warnings.push({
      code: "DIFFERENT_TERM",
      fields: ["termMonths"],
      policyLabels: policies.map((p) => p.label),
      message: "Policies have different terms — annualized premiums are used for comparison.",
    });
  }

  // Collect all unique coverage keys
  const allKeys = new Set(
    policies.flatMap((p) => p.coverages.map((c) => c.key))
  );

  for (const key of allKeys) {
    const coverages = policies.map((p) =>
      p.coverages.find((c) => c.key === key)
    );

    // Coverage present in some but not others
    const someHave = coverages.some((c) => c?.included === true);
    const someLack = coverages.some((c) => c?.included === false || c === undefined);
    if (someHave && someLack) {
      warnings.push({
        code: "COVERAGE_ONLY_IN_ONE",
        fields: [key],
        policyLabels: policies
          .filter((_, i) => coverages[i]?.included !== true)
          .map((p) => p.label),
        message: `${key} appears in some policies but not others.`,
      });
    }

    // Field not entered
    const someNotEntered = coverages.some(
      (c) => c !== undefined && c.included === null
    );
    if (someNotEntered) {
      warnings.push({
        code: "FIELD_NOT_ENTERED",
        fields: [key],
        policyLabels: policies
          .filter((_, i) => coverages[i]?.included === null)
          .map((p) => p.label),
        message: `${key} was not entered in some policies — those rows show 'Not entered'.`,
      });
    }

    // Different limits
    const limits = coverages
      .map((c) => c?.limitCents)
      .filter((l) => l !== undefined && l !== null);
    if (limits.length > 1 && new Set(limits).size > 1) {
      warnings.push({
        code: "DIFFERENT_LIMIT",
        fields: [`${key}.limit`],
        policyLabels: policies.map((p) => p.label),
        message: `Limits differ for ${key}.`,
      });
    }

    // Different deductibles
    const deductibles = coverages
      .map((c) => c?.deductibleCents)
      .filter((d) => d !== undefined && d !== null);
    if (deductibles.length > 1 && new Set(deductibles).size > 1) {
      warnings.push({
        code: "DIFFERENT_DEDUCTIBLE",
        fields: [`${key}.deductible`],
        policyLabels: policies.map((p) => p.label),
        message: `Deductibles differ for ${key}.`,
      });
    }

    // Different valuation basis
    const bases = coverages
      .map((c) => c?.valuationBasis)
      .filter((b) => b !== undefined && b !== null);
    if (bases.length > 1 && new Set(bases).size > 1) {
      warnings.push({
        code: "DIFFERENT_VALUATION_BASIS",
        fields: [`${key}.valuationBasis`],
        policyLabels: policies.map((p) => p.label),
        message: `Policies use different valuation bases for ${key} (ACV vs Replacement Cost).`,
      });
    }
  }

  return warnings;
}
