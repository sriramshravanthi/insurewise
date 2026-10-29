import { describe, expect, it } from "vitest";
import { scenarioDelta } from "@/engine/scenario-delta";

// Golden example from docs/CALCULATIONS.md §2 (C8).
describe("scenarioDelta (C8)", () => {
  it("baseline $2,000, scenario $2,150 -> +$150 (+7.5%)", () => {
    const result = scenarioDelta({
      baselineCents: 200_000,
      scenarioCents: 215_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.deltaCents.amount).toBe(15_000);
    expect(result.value.percentage?.amount).toBe(7.5);
    expect(result.value.deltaCents.provenance).toBe("calculated");
  });

  it("preserves a negative sign when the scenario is cheaper than the baseline", () => {
    const result = scenarioDelta({
      baselineCents: 200_000,
      scenarioCents: 180_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.deltaCents.amount).toBe(-20_000);
    expect(result.value.percentage?.amount).toBe(-10);
  });

  it("omits the percentage, with a note, when the baseline is $0", () => {
    const result = scenarioDelta({
      baselineCents: 0,
      scenarioCents: 50_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.deltaCents.amount).toBe(50_000);
    expect(result.value.percentage).toBeUndefined();
    expect(result.trace.notes[0]).toMatch(/baseline is \$0\.00/i);
  });

  it("labels the output Illustrative when the input is Illustrative", () => {
    const result = scenarioDelta({
      baselineCents: 200_000,
      scenarioCents: 215_000,
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.deltaCents.provenance).toBe("illustrative");
    expect(result.value.percentage?.provenance).toBe("illustrative");
  });

  it("rejects negative money as invalid", () => {
    const result = scenarioDelta({
      baselineCents: -1,
      scenarioCents: 50_000,
      provenance: "entered",
    });

    expect(result.status).toBe("invalid");
  });

  it("trace: re-deriving delta and percentage from their expressions reproduces the output", () => {
    const result = scenarioDelta({
      baselineCents: 200_000,
      scenarioCents: 215_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C8");
    expect(result.trace.steps[0].result).toBe(result.value.deltaCents.amount);
    expect(result.trace.steps[1].result).toBe(result.value.percentage?.amount);
  });
});
