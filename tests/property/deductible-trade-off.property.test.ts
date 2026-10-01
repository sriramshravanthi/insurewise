import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { deductibleTradeOff } from "@/engine/deductible-trade-off";

describe("deductibleTradeOff (C4) properties", () => {
  it("never returns NaN or Infinity, and the extra out-of-pocket is always positive", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (lowDeductible, deltaDeductible, lowPremium, highPremium) => {
          const result = deductibleTradeOff({
            low: { deductibleCents: lowDeductible, annualPremiumCents: lowPremium },
            high: {
              deductibleCents: lowDeductible + deltaDeductible,
              annualPremiumCents: highPremium,
            },
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;

          const diff = result.value.annualPremiumDifferenceCents.amount;
          const extra = result.value.extraOutOfPocketIfClaimCents.amount;

          expect(Number.isFinite(diff)).toBe(true);
          expect(Number.isFinite(extra)).toBe(true);
          expect(extra).toBe(deltaDeductible);
          expect(extra).toBeGreaterThan(0);
          expect(diff).toBe(lowPremium - highPremium);
        },
      ),
    );
  });

  it("rejects any input where the high deductible does not exceed the low deductible", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (lowDeductible, nonPositiveDelta) => {
          const highDeductible = lowDeductible - Math.abs(nonPositiveDelta);
          const result = deductibleTradeOff({
            low: { deductibleCents: lowDeductible, annualPremiumCents: 100_000 },
            high: { deductibleCents: highDeductible, annualPremiumCents: 100_000 },
            provenance: "entered",
          });

          expect(result.status).toBe("invalid");
        },
      ),
    );
  });
});
