import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { homeCoverageRatios } from "@/engine/home-coverage-ratios";

describe("homeCoverageRatios (C10) properties", () => {
  it("matches the exact ratio formulas and is never NaN/Infinity/negative when denominators are positive", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 1, max: 100_000_000 }),
        (dwellingLimitCents, contentsLimitCents, lossOfUseLimitCents, rebuildEstimateCents) => {
          const result = homeCoverageRatios({
            dwellingLimitCents,
            contentsLimitCents,
            lossOfUseLimitCents,
            rebuildEstimateCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;

          const contents = result.value.contentsRatio!.amount;
          const lossOfUse = result.value.lossOfUseRatio!.amount;
          const dwellingVsRebuild = result.value.dwellingVsRebuildRatio!.amount;

          for (const ratio of [contents, lossOfUse, dwellingVsRebuild]) {
            expect(Number.isFinite(ratio)).toBe(true);
            expect(ratio).toBeGreaterThanOrEqual(0);
          }
          expect(
            Math.abs(
              contents - (contentsLimitCents / dwellingLimitCents) * 100,
            ),
          ).toBeLessThanOrEqual(0.0500001);
          expect(
            Math.abs(
              lossOfUse - (lossOfUseLimitCents / dwellingLimitCents) * 100,
            ),
          ).toBeLessThanOrEqual(0.0500001);
          expect(
            Math.abs(
              dwellingVsRebuild -
                (dwellingLimitCents / rebuildEstimateCents) * 100,
            ),
          ).toBeLessThanOrEqual(0.0500001);
        },
      ),
    );
  });

  it("each ratio is present if and only if its inputs were provided with a positive denominator", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.option(fc.integer({ min: 0, max: 100_000_000 }), { nil: undefined }),
        fc.option(fc.integer({ min: 0, max: 100_000_000 }), { nil: undefined }),
        fc.option(fc.integer({ min: 0, max: 100_000_000 }), { nil: undefined }),
        (
          dwellingLimitCents,
          contentsLimitCents,
          lossOfUseLimitCents,
          rebuildEstimateCents,
        ) => {
          const result = homeCoverageRatios({
            dwellingLimitCents,
            contentsLimitCents,
            lossOfUseLimitCents,
            rebuildEstimateCents,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;

          const expectPresence = (
            value: number | undefined,
            denominator: number,
            output: unknown,
          ) => {
            if (value === undefined || denominator === 0) {
              expect(output).toBeUndefined();
            } else {
              expect(output).toBeDefined();
            }
          };

          expectPresence(
            contentsLimitCents,
            dwellingLimitCents,
            result.value.contentsRatio,
          );
          expectPresence(
            lossOfUseLimitCents,
            dwellingLimitCents,
            result.value.lossOfUseRatio,
          );
          expectPresence(
            rebuildEstimateCents,
            rebuildEstimateCents ?? 0,
            result.value.dwellingVsRebuildRatio,
          );
        },
      ),
    );
  });
});
