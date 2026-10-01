import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { breakEvenYears } from "@/engine/break-even";

describe("breakEvenYears (C5) properties", () => {
  it("computes a finite, non-negative break-even that is within rounding tolerance of extra/savings whenever there are savings", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }), // savings, always > 0
        (lowDeductible, deltaDeductible, savingsCents) => {
          const lowPremium = 1_000_000;
          const result = breakEvenYears({
            low: { deductibleCents: lowDeductible, annualPremiumCents: lowPremium },
            high: {
              deductibleCents: lowDeductible + deltaDeductible,
              annualPremiumCents: lowPremium - savingsCents,
            },
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          expect(result.value.status).toBe("computed");
          const years = result.value.breakEvenYears!.amount;

          expect(Number.isFinite(years)).toBe(true);
          expect(years).toBeGreaterThanOrEqual(0);
          // Half-up rounding to one decimal can be off by up to 0.05; allow
          // a hair of floating-point slack on top of that bound.
          expect(
            Math.abs(years - deltaDeductible / savingsCents),
          ).toBeLessThanOrEqual(0.0500001);
        },
      ),
    );
  });

  it("reports no_premium_savings_entered exactly when savings are zero or negative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }), // non-positive savings via >= premium
        (lowDeductible, deltaDeductible, extraPremium) => {
          const lowPremium = 1_000_000;
          const result = breakEvenYears({
            low: { deductibleCents: lowDeductible, annualPremiumCents: lowPremium },
            high: {
              deductibleCents: lowDeductible + deltaDeductible,
              annualPremiumCents: lowPremium + extraPremium,
            },
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          expect(result.value.status).toBe("no_premium_savings_entered");
          expect(result.value.breakEvenYears).toBeUndefined();
        },
      ),
    );
  });
});
