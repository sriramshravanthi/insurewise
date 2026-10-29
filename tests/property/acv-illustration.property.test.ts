import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { acvIllustration } from "@/engine/acv-illustration";

describe("acvIllustration (C12) properties", () => {
  it("the ACV loss never exceeds the original loss, and is never NaN/Infinity/negative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (replacementCostLossCents, depreciationPct, deductibleCents) => {
          const result = acvIllustration({
            replacementCostLossCents,
            depreciationPct,
            deductibleCents,
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const acv = result.value.acvLossCents.amount;

          expect(Number.isFinite(acv)).toBe(true);
          expect(acv).toBeGreaterThanOrEqual(0);
          expect(acv).toBeLessThanOrEqual(replacementCostLossCents);
        },
      ),
    );
  });

  it("the ACV basis never requires the user to pay less than the replacement-cost basis", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (replacementCostLossCents, depreciationPct, deductibleCents) => {
          const result = acvIllustration({
            replacementCostLossCents,
            depreciationPct,
            deductibleCents,
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          // Depreciation can only shift cost from insurer to user, never the
          // other way, since acvLoss <= replacementCostLossCents.
          expect(
            result.value.actualCashValue.userPaysCents.amount,
          ).toBeGreaterThanOrEqual(
            result.value.replacementCost.userPaysCents.amount,
          );
        },
      ),
    );
  });

  it("both bases' insurer-pays plus user-pays always equal the full original loss", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (replacementCostLossCents, depreciationPct, deductibleCents) => {
          const result = acvIllustration({
            replacementCostLossCents,
            depreciationPct,
            deductibleCents,
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          expect(
            result.value.actualCashValue.insurerPaysCents.amount +
              result.value.actualCashValue.userPaysCents.amount,
          ).toBe(replacementCostLossCents);
          expect(
            result.value.replacementCost.insurerPaysCents.amount +
              result.value.replacementCost.userPaysCents.amount,
          ).toBe(replacementCostLossCents);
        },
      ),
    );
  });

  it("rejects any depreciationPct outside [0, 100]", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -1_000, max: -1 }),
          fc.integer({ min: 101, max: 1_000 }),
        ),
        (depreciationPct) => {
          const result = acvIllustration({
            replacementCostLossCents: 2_000_000,
            depreciationPct,
            deductibleCents: 100_000,
          });
          expect(result.status).toBe("invalid");
        },
      ),
    );
  });
});
