import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { bundleDelta } from "@/engine/bundle-delta";

describe("bundleDelta (C9) properties", () => {
  // docs/CALCULATIONS.md §5: "C8/C9 antisymmetry: swapping baseline and
  // scenario flips the sign of the delta." For C9, swapping which amount
  // plays "separate total" vs. "bundled" is the analogous swap.
  it("swapping the separate total and the bundled premium flips the sign of the difference", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        (a, b) => {
          const forward = bundleDelta({
            separatePremiumsCents: [a],
            bundledPremiumCents: b,
            provenance: "entered",
          });
          const swapped = bundleDelta({
            separatePremiumsCents: [b],
            bundledPremiumCents: a,
            provenance: "entered",
          });

          expect(forward.status).toBe("ok");
          expect(swapped.status).toBe("ok");
          if (forward.status !== "ok" || swapped.status !== "ok") return;
          expect(swapped.value.differenceCents.amount).toBe(
            -forward.value.differenceCents.amount,
          );
        },
      ),
    );
  });

  it("the separate total always equals the sum of the separate premiums, and difference is never NaN/Infinity", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 1_000_000 }), { maxLength: 6 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        (separatePremiumsCents, bundledPremiumCents) => {
          const result = bundleDelta({
            separatePremiumsCents,
            bundledPremiumCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const expectedSeparateTotal = separatePremiumsCents.reduce(
            (sum, a) => sum + a,
            0,
          );
          expect(result.value.separateTotalCents.amount).toBe(
            expectedSeparateTotal,
          );
          expect(result.value.differenceCents.amount).toBe(
            expectedSeparateTotal - bundledPremiumCents,
          );
          expect(Number.isFinite(result.value.differenceCents.amount)).toBe(
            true,
          );
        },
      ),
    );
  });

  it("the wording always matches the sign of the difference", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 1_000_000 }), { maxLength: 6 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        (separatePremiumsCents, bundledPremiumCents) => {
          const result = bundleDelta({
            separatePremiumsCents,
            bundledPremiumCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const diff = result.value.differenceCents.amount;
          if (diff > 0) expect(result.value.wording).toBe("lower");
          else if (diff < 0) expect(result.value.wording).toBe("higher");
          else expect(result.value.wording).toBe("the same");
        },
      ),
    );
  });

  it("the percentage is present whenever the separate total is positive, and omitted exactly when it is zero", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 1_000_000 }), { maxLength: 6 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        (separatePremiumsCents, bundledPremiumCents) => {
          const result = bundleDelta({
            separatePremiumsCents,
            bundledPremiumCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const separateTotal = separatePremiumsCents.reduce(
            (sum, a) => sum + a,
            0,
          );
          if (separateTotal === 0) {
            expect(result.value.percentage).toBeUndefined();
          } else {
            expect(result.value.percentage).toBeDefined();
          }
        },
      ),
    );
  });
});
