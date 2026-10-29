import { describe, expect, it } from "vitest";
import { comparePolicySet } from "@/engine/policy-set-comparison";
import type { PolicyForComparison } from "@/schemas/policy-for-comparison";

const baseline: PolicyForComparison = {
  policyType: "car",
  termMonths: 12,
  provenance: "entered",
  annualPremiumCents: 150_000,
  coverages: [
    { code: "liability", included: true, limitPrimaryCents: 3_000_000, deductibleCents: 0 },
  ],
  endorsements: [],
  limitations: [],
};

function withPremium(premiumCents: number): PolicyForComparison {
  return { ...structuredClone(baseline), annualPremiumCents: premiumCents };
}

describe("comparePolicySet (PRD CMP-1)", () => {
  it("compares the baseline against a single comparison policy", () => {
    const result = comparePolicySet(baseline, [withPremium(175_000)]);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.items).toHaveLength(1);
    expect(result.value.items[0].comparisonIndex).toBe(0);
    expect(result.value.items[0].comparability.comparable).toBe(true);
    expect(result.value.items[0].diff).not.toBeNull();
    const premiumRow = result.value.items[0].diff?.rows.find(
      (r) => r.category === "premium",
    );
    expect(premiumRow).toMatchObject({ status: "different" });
  });

  it("compares the baseline against up to three comparison policies", () => {
    const result = comparePolicySet(baseline, [
      withPremium(175_000),
      withPremium(140_000),
      withPremium(150_000),
    ]);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.items).toHaveLength(3);
    expect(result.value.items.map((i) => i.comparisonIndex)).toEqual([0, 1, 2]);
  });

  it("rejects zero comparison policies as invalid (PRD CMP-1: at least one)", () => {
    const result = comparePolicySet(baseline, []);
    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.errors[0].code).toBe("comparisons_out_of_range");
  });

  it("rejects more than three comparison policies as invalid (PRD CMP-1: up to three)", () => {
    const result = comparePolicySet(baseline, [
      withPremium(1),
      withPremium(2),
      withPremium(3),
      withPremium(4),
    ]);
    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.errors[0].code).toBe("comparisons_out_of_range");
  });

  it("sets diff to null when a comparison is blocked by DIFFERENT_POLICY_TYPE", () => {
    const homePolicy: PolicyForComparison = { ...structuredClone(baseline), policyType: "home" };
    const result = comparePolicySet(baseline, [homePolicy]);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.items[0].comparability.comparable).toBe(false);
    expect(result.value.items[0].diff).toBeNull();
  });

  it("propagates a malformed baseline as invalid for the whole set", () => {
    const malformedBaseline: PolicyForComparison = {
      ...structuredClone(baseline),
      coverages: [
        { code: "liability", included: true },
        { code: "liability", included: false },
      ],
    };
    const result = comparePolicySet(malformedBaseline, [withPremium(1)]);
    expect(result.status).toBe("invalid");
  });

  it("propagates a malformed comparison policy as invalid for the whole set", () => {
    const malformedComparison: PolicyForComparison = {
      ...structuredClone(baseline),
      annualPremiumCents: -1,
    };
    const result = comparePolicySet(baseline, [malformedComparison]);
    expect(result.status).toBe("invalid");
  });

  it("trace: records how many comparisons were made and how many are comparable", () => {
    const result = comparePolicySet(baseline, [
      withPremium(175_000),
      { ...structuredClone(baseline), policyType: "home" },
    ]);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("CMP-POLICY-SET");
    expect(result.trace.steps[0].result).toBe(2);
    expect(result.trace.steps[1].result).toBe(1); // only the first is comparable
  });
});
