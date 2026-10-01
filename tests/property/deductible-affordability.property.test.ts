import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { deductibleAffordability } from "@/engine/deductible-affordability";

describe("deductibleAffordability (C15) properties", () => {
  it("matches max(0, deductible - savings) exactly, and is never NaN/Infinity/negative when savings are provided", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        (deductibleCents, emergencySavingsCents) => {
          const result = deductibleAffordability({
            deductibleCents,
            emergencySavingsCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const shortfall = result.value.shortfallCents!.amount;

          expect(Number.isFinite(shortfall)).toBe(true);
          expect(shortfall).toBeGreaterThanOrEqual(0);
          expect(shortfall).toBe(
            Math.max(0, deductibleCents - emergencySavingsCents),
          );
        },
      ),
    );
  });

  it("the shortfall is present if and only if savings were entered", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.option(fc.integer({ min: 0, max: 10_000_000 }), { nil: undefined }),
        (deductibleCents, emergencySavingsCents) => {
          const result = deductibleAffordability({
            deductibleCents,
            emergencySavingsCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          if (emergencySavingsCents === undefined) {
            expect(result.value.shortfallCents).toBeUndefined();
          } else {
            expect(result.value.shortfallCents).toBeDefined();
          }
        },
      ),
    );
  });

  it("increasing the deductible never decreases the shortfall, and increasing savings never increases it", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (deductibleCents, emergencySavingsCents, delta) => {
          const base = deductibleAffordability({
            deductibleCents,
            emergencySavingsCents,
            provenance: "entered",
          });
          const moreDeductible = deductibleAffordability({
            deductibleCents: deductibleCents + delta,
            emergencySavingsCents,
            provenance: "entered",
          });
          const moreSavings = deductibleAffordability({
            deductibleCents,
            emergencySavingsCents: emergencySavingsCents + delta,
            provenance: "entered",
          });

          if (
            base.status !== "ok" ||
            moreDeductible.status !== "ok" ||
            moreSavings.status !== "ok"
          ) {
            return;
          }
          expect(
            moreDeductible.value.shortfallCents!.amount,
          ).toBeGreaterThanOrEqual(base.value.shortfallCents!.amount);
          expect(moreSavings.value.shortfallCents!.amount).toBeLessThanOrEqual(
            base.value.shortfallCents!.amount,
          );
        },
      ),
    );
  });
});
