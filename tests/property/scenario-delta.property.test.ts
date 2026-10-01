import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { scenarioDelta } from "@/engine/scenario-delta";

describe("scenarioDelta (C8) properties", () => {
  // docs/CALCULATIONS.md §5: "C8/C9 antisymmetry: swapping baseline and
  // scenario flips the sign of the delta."
  it("swapping baseline and scenario flips the sign of the delta", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        (a, b) => {
          const forward = scenarioDelta({
            baselineCents: a,
            scenarioCents: b,
            provenance: "entered",
          });
          const swapped = scenarioDelta({
            baselineCents: b,
            scenarioCents: a,
            provenance: "entered",
          });

          expect(forward.status).toBe("ok");
          expect(swapped.status).toBe("ok");
          if (forward.status !== "ok" || swapped.status !== "ok") return;
          // `+ 0` normalizes -0 to +0 so a===b (both deltas 0) doesn't fail
          // toBe's Object.is comparison of -0 vs +0.
          expect(swapped.value.deltaCents.amount + 0).toBe(
            -forward.value.deltaCents.amount + 0,
          );
        },
      ),
    );
  });

  it("delta always equals scenario - baseline and is never NaN/Infinity", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        (baselineCents, scenarioCents) => {
          const result = scenarioDelta({
            baselineCents,
            scenarioCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          expect(result.value.deltaCents.amount).toBe(
            scenarioCents - baselineCents,
          );
          expect(Number.isFinite(result.value.deltaCents.amount)).toBe(true);
          if (result.value.percentage) {
            expect(Number.isFinite(result.value.percentage.amount)).toBe(
              true,
            );
          }
        },
      ),
    );
  });

  it("the percentage is present whenever the baseline is positive, and omitted exactly when it is zero", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 10_000_000 }),
        (baselineCents, scenarioCents) => {
          const result = scenarioDelta({
            baselineCents,
            scenarioCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          if (baselineCents === 0) {
            expect(result.value.percentage).toBeUndefined();
          } else {
            expect(result.value.percentage).toBeDefined();
          }
        },
      ),
    );
  });
});
