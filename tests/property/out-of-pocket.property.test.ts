import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { outOfPocketOnClaim, type LimitBasis } from "@/engine/out-of-pocket";

const basisArb = fc.constantFrom<LimitBasis>(
  "after_deductible",
  "before_deductible",
);

describe("outOfPocketOnClaim (C3) properties", () => {
  it("userPays + insurerPays = loss; both are non-negative and no greater than the loss", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.option(fc.integer({ min: 0, max: 10_000_000 }), { nil: undefined }),
        basisArb,
        (lossCents, deductibleCents, limitCents, limitBasis) => {
          const result = outOfPocketOnClaim({
            lossCents,
            deductibleCents,
            limitCents,
            limitBasis,
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const insurer = result.value.insurerPaysCents.amount;
          const user = result.value.userPaysCents.amount;

          expect(Number.isFinite(insurer)).toBe(true);
          expect(Number.isFinite(user)).toBe(true);
          expect(insurer).toBeGreaterThanOrEqual(0);
          expect(user).toBeGreaterThanOrEqual(0);
          expect(user).toBeLessThanOrEqual(lossCents);
          expect(insurer + user).toBe(lossCents);
        },
      ),
    );
  });

  it("increasing the deductible never decreases what the user pays (same basis, loss, and limit)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.option(fc.integer({ min: 0, max: 10_000_000 }), { nil: undefined }),
        basisArb,
        (lossCents, deductibleA, deltaCents, limitCents, limitBasis) => {
          const deductibleB = deductibleA + deltaCents;
          const lower = outOfPocketOnClaim({
            lossCents,
            deductibleCents: deductibleA,
            limitCents,
            limitBasis,
          });
          const higher = outOfPocketOnClaim({
            lossCents,
            deductibleCents: deductibleB,
            limitCents,
            limitBasis,
          });

          if (lower.status !== "ok" || higher.status !== "ok") return;
          expect(higher.value.userPaysCents.amount).toBeGreaterThanOrEqual(
            lower.value.userPaysCents.amount,
          );
        },
      ),
    );
  });

  it("with no limit, the user pays exactly min(loss, deductible)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        basisArb,
        (lossCents, deductibleCents, limitBasis) => {
          const result = outOfPocketOnClaim({
            lossCents,
            deductibleCents,
            limitBasis,
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          expect(result.value.userPaysCents.amount).toBe(
            Math.min(lossCents, deductibleCents),
          );
        },
      ),
    );
  });
});
