import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { premiumComposition } from "@/engine/premium-composition";

const lineArb = fc.integer({ min: 0, max: 1_000_000 });

describe("premiumComposition (C7) properties", () => {
  it("percentages always sum to exactly 100.0% when the total is positive", () => {
    fc.assert(
      fc.property(
        fc.array(lineArb, { minLength: 1, maxLength: 8 }),
        (amounts) => {
          const total = amounts.reduce((sum, a) => sum + a, 0);
          if (total === 0) return;

          const result = premiumComposition({
            lines: amounts.map((amountCents, i) => ({
              key: `line-${i}`,
              label: `Line ${i}`,
              amountCents,
            })),
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const sum = result.value.shares.reduce(
            (acc, share) => acc + share.percentage.amount,
            0,
          );
          expect(sum).toBeCloseTo(100.0, 5);
        },
      ),
    );
  });

  it("every share is non-negative and no share exceeds 100%", () => {
    fc.assert(
      fc.property(
        fc.array(lineArb, { minLength: 1, maxLength: 8 }),
        (amounts) => {
          const total = amounts.reduce((sum, a) => sum + a, 0);
          if (total === 0) return;

          const result = premiumComposition({
            lines: amounts.map((amountCents, i) => ({
              key: `line-${i}`,
              label: `Line ${i}`,
              amountCents,
            })),
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          for (const share of result.value.shares) {
            expect(share.percentage.amount).toBeGreaterThanOrEqual(0);
            expect(share.percentage.amount).toBeLessThanOrEqual(100);
          }
        },
      ),
    );
  });

  it("never rescales when lines exceed a positive entered total (invalid instead)", () => {
    fc.assert(
      fc.property(
        fc.array(lineArb, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 1, max: 100 }),
        (amounts, shortfallPercent) => {
          const sum = amounts.reduce((acc, a) => acc + a, 0);
          if (sum === 0) return;
          // 0 < totalCents < sum: strictly between zero and the line sum.
          const totalCents = Math.max(
            1,
            Math.floor((sum * shortfallPercent) / 200),
          );
          if (totalCents >= sum) return;

          const result = premiumComposition({
            lines: amounts.map((amountCents, i) => ({
              key: `line-${i}`,
              label: `Line ${i}`,
              amountCents,
            })),
            totalCents,
          });

          expect(result.status).toBe("invalid");
        },
      ),
    );
  });

  it("a zero entered total is always insufficient_data, even when lines are positive", () => {
    fc.assert(
      fc.property(
        fc.array(lineArb.filter((a) => a > 0), { minLength: 1, maxLength: 5 }),
        (amounts) => {
          const result = premiumComposition({
            lines: amounts.map((amountCents, i) => ({
              key: `line-${i}`,
              label: `Line ${i}`,
              amountCents,
            })),
            totalCents: 0,
          });

          expect(result).toEqual({
            status: "insufficient_data",
            missing: ["totalCents"],
          });
        },
      ),
    );
  });
});
