import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { coverageToValueRatio } from "@/engine/coverage-to-value-ratio";

describe("coverageToValueRatio (C13) properties", () => {
  it("matches (collision + comprehensive) / vehicleValue * 100 within rounding tolerance, and is never NaN/Infinity/negative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 100_000_000 }),
        (collisionPremiumCents, comprehensivePremiumCents, vehicleValueCents) => {
          const result = coverageToValueRatio({
            collisionPremiumCents,
            comprehensivePremiumCents,
            vehicleValueCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const ratio = result.value.ratio!.amount;

          expect(Number.isFinite(ratio)).toBe(true);
          expect(ratio).toBeGreaterThanOrEqual(0);
          const exact =
            ((collisionPremiumCents + comprehensivePremiumCents) /
              vehicleValueCents) *
            100;
          expect(Math.abs(ratio - exact)).toBeLessThanOrEqual(0.0500001);
        },
      ),
    );
  });

  it("the ratio is present if and only if the vehicle value is positive", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        (collisionPremiumCents, comprehensivePremiumCents, vehicleValueCents) => {
          const result = coverageToValueRatio({
            collisionPremiumCents,
            comprehensivePremiumCents,
            vehicleValueCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          if (vehicleValueCents === 0) {
            expect(result.value.ratio).toBeUndefined();
          } else {
            expect(result.value.ratio).toBeDefined();
          }
        },
      ),
    );
  });
});
