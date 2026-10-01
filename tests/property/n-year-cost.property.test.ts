import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { nYearCost } from "@/engine/n-year-cost";

describe("nYearCost (C6) properties", () => {
  it("matches N * premium + deductible exactly, for both options, and is always non-negative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 50 }),
        (lowDeductible, deltaDeductible, lowPremium, highPremium, n) => {
          const high = {
            deductibleCents: lowDeductible + deltaDeductible,
            annualPremiumCents: highPremium,
          };
          const low = { deductibleCents: lowDeductible, annualPremiumCents: lowPremium };
          const result = nYearCost({ low, high, n });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;

          expect(result.value.lowCostCents.amount).toBe(
            n * lowPremium + lowDeductible,
          );
          expect(result.value.highCostCents.amount).toBe(
            n * highPremium + high.deductibleCents,
          );
          expect(result.value.lowCostCents.amount).toBeGreaterThanOrEqual(0);
          expect(result.value.highCostCents.amount).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it("increasing N never decreases the cost of either option", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (lowDeductible, deltaDeductible, lowPremium, highPremium, n, deltaN) => {
          const low = { deductibleCents: lowDeductible, annualPremiumCents: lowPremium };
          const high = {
            deductibleCents: lowDeductible + deltaDeductible,
            annualPremiumCents: highPremium,
          };
          const smaller = nYearCost({ low, high, n });
          const larger = nYearCost({ low, high, n: n + deltaN });

          if (smaller.status !== "ok" || larger.status !== "ok") return;
          expect(larger.value.lowCostCents.amount).toBeGreaterThanOrEqual(
            smaller.value.lowCostCents.amount,
          );
          expect(larger.value.highCostCents.amount).toBeGreaterThanOrEqual(
            smaller.value.highCostCents.amount,
          );
        },
      ),
    );
  });
});
