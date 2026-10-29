import { describe, expect, it } from "vitest";
import {
  COMPARISON_COVERAGE_CODES,
  PolicyComparisonFormSchema,
  emptyPolicyForm,
  fromPolicyForComparison,
  toPolicyForComparison,
} from "@/schemas/policy-comparison-form";
import type { PolicyForComparison } from "@/schemas/policy-for-comparison";

describe("emptyPolicyForm", () => {
  it("creates a policy form with all four coverage codes, none included", () => {
    const form = emptyPolicyForm("Baseline");
    expect(form.coverages.map((c) => c.code)).toEqual([
      ...COMPARISON_COVERAGE_CODES,
    ]);
    expect(form.coverages.every((c) => !c.included)).toBe(true);
  });

  it("validates against PolicyComparisonFormSchema when wrapped", () => {
    const result = PolicyComparisonFormSchema.safeParse({
      baseline: emptyPolicyForm("Baseline"),
      comparisons: [emptyPolicyForm("Option 1")],
    });
    expect(result.success).toBe(true);
  });
});

describe("toPolicyForComparison", () => {
  it("converts dollars to cents and splits endorsements/limitations by line", () => {
    const form = {
      ...emptyPolicyForm("Baseline"),
      termMonths: 12,
      annualPremiumDollars: 1_500,
      coverages: emptyPolicyForm("x").coverages.map((c, i) =>
        i === 0
          ? { ...c, included: true, limitPrimaryDollars: 100_000, deductibleDollars: 500 }
          : c,
      ),
      endorsementsText: "Roadside assistance\n\nRental reimbursement",
      limitationsText: "Excludes racing use.",
    };

    const policy = toPolicyForComparison(form);
    expect(policy.policyType).toBe("car");
    expect(policy.annualPremiumCents).toBe(150_000);
    expect(policy.coverages[0]).toMatchObject({
      code: "liability",
      included: true,
      limitPrimaryCents: 10_000_000,
      deductibleCents: 50_000,
    });
    expect(policy.endorsements).toEqual([
      { label: "Roadside assistance" },
      { label: "Rental reimbursement" },
    ]);
    expect(policy.limitations).toEqual([{ text: "Excludes racing use." }]);
  });

  it("omits optional money fields and valuationBasis when not entered", () => {
    const policy = toPolicyForComparison(emptyPolicyForm("Baseline"));
    expect(policy.coverages[0].limitPrimaryCents).toBeUndefined();
    expect(policy.coverages[0].valuationBasis).toBeUndefined();
  });
});

describe("fromPolicyForComparison", () => {
  it("round-trips through toPolicyForComparison", () => {
    const original: PolicyForComparison = {
      policyType: "car",
      termMonths: 6,
      provenance: "entered",
      annualPremiumCents: 90_000,
      coverages: [
        {
          code: "liability",
          included: true,
          limitPrimaryCents: 3_000_000,
          deductibleCents: 0,
          valuationBasis: "replacement_cost",
        },
        { code: "collision", included: false },
        { code: "comprehensive", included: false },
        { code: "um", included: false },
      ],
      endorsements: [{ label: "Roadside assistance" }],
      limitations: [{ text: "Excludes racing use." }],
    };

    const form = fromPolicyForComparison("Baseline", original);
    const roundTripped = toPolicyForComparison(form);

    expect(roundTripped).toEqual(original);
  });
});
