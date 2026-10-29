import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { comparePolicySet } from "@/engine/policy-set-comparison";
import type { PolicyForComparison } from "@/schemas/policy-for-comparison";

const basePolicy: PolicyForComparison = {
  policyType: "car",
  termMonths: 12,
  provenance: "entered",
  annualPremiumCents: 150_000,
  coverages: [],
  endorsements: [],
  limitations: [],
};

describe("comparePolicySet (PRD CMP-1) properties", () => {
  it("accepts any comparisons array with length in [1, 3] and produces exactly that many items, in order", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 1_000_000 }), { minLength: 1, maxLength: 3 }),
        (premiums) => {
          const comparisons = premiums.map((p) => ({
            ...structuredClone(basePolicy),
            annualPremiumCents: p,
          }));
          const result = comparePolicySet(basePolicy, comparisons);

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          expect(result.value.items).toHaveLength(comparisons.length);
          expect(result.value.items.map((i) => i.comparisonIndex)).toEqual(
            comparisons.map((_, i) => i),
          );
        },
      ),
    );
  });

  it("rejects any comparisons array with length outside [1, 3]", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0),
          fc.integer({ min: 4, max: 10 }),
        ),
        (length) => {
          const comparisons = Array.from({ length }, () => structuredClone(basePolicy));
          const result = comparePolicySet(basePolicy, comparisons);
          expect(result.status).toBe("invalid");
        },
      ),
    );
  });

  it("diff is null if and only if comparability.comparable is false", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("car", "home"), { minLength: 1, maxLength: 3 }),
        (policyTypes) => {
          const comparisons = policyTypes.map((policyType) => ({
            ...structuredClone(basePolicy),
            policyType,
          }));
          const result = comparePolicySet(basePolicy, comparisons);

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          for (const item of result.value.items) {
            expect(item.diff === null).toBe(!item.comparability.comparable);
          }
        },
      ),
    );
  });
});
