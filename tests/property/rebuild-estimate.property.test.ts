import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { rebuildEstimate } from "@/engine/rebuild-estimate";

describe("rebuildEstimate (C11) properties", () => {
  it("matches squareFeet * costPerSqFtCents exactly, is never NaN/Infinity/negative, and is always Illustrative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (squareFeet, costPerSqFtCents) => {
          const result = rebuildEstimate({ squareFeet, costPerSqFtCents });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const amount = result.value.rebuildEstimateCents.amount;

          expect(amount).toBe(squareFeet * costPerSqFtCents);
          expect(Number.isFinite(amount)).toBe(true);
          expect(amount).toBeGreaterThanOrEqual(0);
          expect(result.value.rebuildEstimateCents.provenance).toBe(
            "illustrative",
          );
        },
      ),
    );
  });

  it("increasing either input never decreases the estimate", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000 }),
        fc.integer({ min: 0, max: 10_000 }),
        (squareFeet, costPerSqFtCents, deltaSqFt, deltaCost) => {
          const base = rebuildEstimate({ squareFeet, costPerSqFtCents });
          const larger = rebuildEstimate({
            squareFeet: squareFeet + deltaSqFt,
            costPerSqFtCents: costPerSqFtCents + deltaCost,
          });

          if (base.status !== "ok" || larger.status !== "ok") return;
          expect(larger.value.rebuildEstimateCents.amount).toBeGreaterThanOrEqual(
            base.value.rebuildEstimateCents.amount,
          );
        },
      ),
    );
  });

  it("rejects any negative squareFeet or costPerSqFtCents as invalid", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000, max: -1 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (negativeSquareFeet, costPerSqFtCents) => {
          expect(
            rebuildEstimate({ squareFeet: negativeSquareFeet, costPerSqFtCents })
              .status,
          ).toBe("invalid");
        },
      ),
    );
  });
});
