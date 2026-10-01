import { describe, expect, it } from "vitest";
import { premiumComposition } from "@/engine/premium-composition";

// Golden example from docs/CALCULATIONS.md §2 (C7).
describe("premiumComposition (C7)", () => {
  it("liability $600, collision $400, comprehensive $150, UM $100 -> 48.0%, 32.0%, 12.0%, 8.0%", () => {
    const result = premiumComposition({
      lines: [
        { key: "liability", label: "Liability", amountCents: 60_000 },
        { key: "collision", label: "Collision", amountCents: 40_000 },
        { key: "comprehensive", label: "Comprehensive", amountCents: 15_000 },
        { key: "um", label: "Uninsured motorist", amountCents: 10_000 },
      ],
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.shares.map((s) => s.percentage.amount)).toEqual([
      48.0, 32.0, 12.0, 8.0,
    ]);
    expect(result.value.shares.every((s) => s.percentage.provenance === "calculated")).toBe(
      true,
    );
  });

  it("percentages always sum to exactly 100.0% even with remainders (three equal lines)", () => {
    const result = premiumComposition({
      lines: [
        { key: "a", label: "A", amountCents: 10_000 },
        { key: "b", label: "B", amountCents: 10_000 },
        { key: "c", label: "C", amountCents: 10_000 },
      ],
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const percentages = result.value.shares.map((s) => s.percentage.amount);
    expect(percentages.reduce((sum, p) => sum + p, 0)).toBeCloseTo(100.0, 5);
    // Largest-remainder, stable tie-break: the first line gets the extra tenth.
    expect(percentages).toEqual([33.4, 33.3, 33.3]);
  });

  it("adds an Unallocated line when entered lines fall short of the entered total, without rescaling", () => {
    const result = premiumComposition({
      lines: [
        { key: "liability", label: "Liability", amountCents: 60_000 },
        { key: "collision", label: "Collision", amountCents: 40_000 },
      ],
      totalCents: 125_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const unallocated = result.value.shares.find((s) => s.key === "unallocated");
    expect(unallocated?.amountCents).toBe(25_000);
    const percentages = result.value.shares.map((s) => s.percentage.amount);
    expect(percentages.reduce((sum, p) => sum + p, 0)).toBeCloseTo(100.0, 5);
  });

  it("returns insufficient_data when the total is zero", () => {
    const result = premiumComposition({ lines: [] });

    expect(result).toEqual({
      status: "insufficient_data",
      missing: ["totalCents"],
    });
  });

  it("returns invalid when the lines exceed the entered total", () => {
    const result = premiumComposition({
      lines: [
        { key: "liability", label: "Liability", amountCents: 60_000 },
        { key: "collision", label: "Collision", amountCents: 40_000 },
      ],
      totalCents: 50_000,
    });

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.errors[0].code).toBe("lines_exceed_total");
  });

  it("rejects negative money as invalid", () => {
    const result = premiumComposition({
      lines: [{ key: "liability", label: "Liability", amountCents: -1 }],
    });

    expect(result.status).toBe("invalid");
  });

  it("trace: re-deriving each share's expression from its inputs reproduces the output", () => {
    const result = premiumComposition({
      lines: [
        { key: "liability", label: "Liability", amountCents: 60_000 },
        { key: "collision", label: "Collision", amountCents: 40_000 },
        { key: "comprehensive", label: "Comprehensive", amountCents: 15_000 },
        { key: "um", label: "Uninsured motorist", amountCents: 10_000 },
      ],
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C7");
    expect(result.trace.steps).toHaveLength(result.value.shares.length);
    result.trace.steps.forEach((step, index) => {
      expect(step.result).toBe(result.value.shares[index].percentage.amount);
    });
  });
});
