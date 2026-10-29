import { describe, expect, it } from "vitest";
import { homeCoverageRatios } from "@/engine/home-coverage-ratios";

// Golden example from docs/CALCULATIONS.md §2 (C10).
describe("homeCoverageRatios (C10)", () => {
  it("A=$600,000, C=$300,000, D=$120,000, rebuild=$700,000 -> 50.0%, 20.0%, 85.7%", () => {
    const result = homeCoverageRatios({
      dwellingLimitCents: 60_000_000,
      contentsLimitCents: 30_000_000,
      lossOfUseLimitCents: 12_000_000,
      rebuildEstimateCents: 70_000_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.contentsRatio?.amount).toBe(50.0);
    expect(result.value.lossOfUseRatio?.amount).toBe(20.0);
    expect(result.value.dwellingVsRebuildRatio?.amount).toBe(85.7);
    expect(result.value.contentsRatio?.provenance).toBe("calculated");
  });

  it("omits a ratio (no error) when its input was not entered", () => {
    const result = homeCoverageRatios({
      dwellingLimitCents: 60_000_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.contentsRatio).toBeUndefined();
    expect(result.value.lossOfUseRatio).toBeUndefined();
    expect(result.value.dwellingVsRebuildRatio).toBeUndefined();
    expect(result.trace.notes).toEqual([]);
  });

  it("omits contents/loss-of-use ratios, with notes, when the dwelling limit is $0", () => {
    const result = homeCoverageRatios({
      dwellingLimitCents: 0,
      contentsLimitCents: 30_000_000,
      lossOfUseLimitCents: 12_000_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.contentsRatio).toBeUndefined();
    expect(result.value.lossOfUseRatio).toBeUndefined();
    expect(result.trace.notes).toHaveLength(2);
  });

  it("omits the dwelling-vs-rebuild ratio, with a note, when the rebuild estimate is $0", () => {
    const result = homeCoverageRatios({
      dwellingLimitCents: 60_000_000,
      rebuildEstimateCents: 0,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.dwellingVsRebuildRatio).toBeUndefined();
    expect(result.trace.notes[0]).toMatch(/rebuild estimate is \$0\.00/i);
  });

  it("labels the output Illustrative when the input is Illustrative", () => {
    const result = homeCoverageRatios({
      dwellingLimitCents: 60_000_000,
      contentsLimitCents: 30_000_000,
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.contentsRatio?.provenance).toBe("illustrative");
  });

  it("labels dwellingVsRebuildRatio Illustrative when only the rebuild estimate is Illustrative (C11), leaving the other ratios Calculated", () => {
    const result = homeCoverageRatios({
      dwellingLimitCents: 60_000_000,
      contentsLimitCents: 30_000_000,
      lossOfUseLimitCents: 12_000_000,
      rebuildEstimateCents: 70_000_000,
      provenance: "entered",
      rebuildEstimateProvenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.dwellingVsRebuildRatio?.provenance).toBe("illustrative");
    expect(result.value.contentsRatio?.provenance).toBe("calculated");
    expect(result.value.lossOfUseRatio?.provenance).toBe("calculated");
  });

  it("defaults rebuildEstimateProvenance to the overall provenance when omitted (backward compatible)", () => {
    const result = homeCoverageRatios({
      dwellingLimitCents: 60_000_000,
      rebuildEstimateCents: 70_000_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.dwellingVsRebuildRatio?.provenance).toBe("calculated");
  });

  it("rejects negative money as invalid", () => {
    expect(
      homeCoverageRatios({ dwellingLimitCents: -1, provenance: "entered" })
        .status,
    ).toBe("invalid");
    expect(
      homeCoverageRatios({
        dwellingLimitCents: 60_000_000,
        contentsLimitCents: -1,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
  });

  it("trace: re-deriving each ratio's expression from its inputs reproduces the output", () => {
    const result = homeCoverageRatios({
      dwellingLimitCents: 60_000_000,
      contentsLimitCents: 30_000_000,
      lossOfUseLimitCents: 12_000_000,
      rebuildEstimateCents: 70_000_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C10");
    expect(result.trace.steps).toHaveLength(3);
    expect(result.trace.steps[0].result).toBe(result.value.contentsRatio?.amount);
    expect(result.trace.steps[1].result).toBe(result.value.lossOfUseRatio?.amount);
    expect(result.trace.steps[2].result).toBe(
      result.value.dwellingVsRebuildRatio?.amount,
    );
  });
});
