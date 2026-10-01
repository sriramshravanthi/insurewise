import { describe, expect, it } from "vitest";
import { rebuildEstimate } from "@/engine/rebuild-estimate";

// Golden example from docs/CALCULATIONS.md §2 (C11).
describe("rebuildEstimate (C11)", () => {
  it("2,000 sq ft at $350/sq ft -> $700,000 (Illustrative)", () => {
    const result = rebuildEstimate({
      squareFeet: 2_000,
      costPerSqFtCents: 35_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.rebuildEstimateCents.amount).toBe(70_000_000);
    expect(result.value.rebuildEstimateCents.provenance).toBe("illustrative");
  });

  it("is always Illustrative, even though squareFeet itself is Entered", () => {
    const result = rebuildEstimate({ squareFeet: 1_500, costPerSqFtCents: 20_000 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.inputs.find((i) => i.key === "squareFeet")?.provenance).toBe(
      "entered",
    );
    expect(
      result.trace.inputs.find((i) => i.key === "costPerSqFtCents")?.provenance,
    ).toBe("illustrative");
    expect(result.value.rebuildEstimateCents.provenance).toBe("illustrative");
  });

  it("returns ok with a note when square footage is zero", () => {
    const result = rebuildEstimate({ squareFeet: 0, costPerSqFtCents: 35_000 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.rebuildEstimateCents.amount).toBe(0);
    expect(result.trace.notes).toContain("Entered square footage is 0.");
  });

  it("returns ok with a note when cost per square foot is zero", () => {
    const result = rebuildEstimate({ squareFeet: 2_000, costPerSqFtCents: 0 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.rebuildEstimateCents.amount).toBe(0);
    expect(result.trace.notes).toContain("Entered cost per square foot is $0.00.");
  });

  it("rejects a negative or non-integer square footage as invalid", () => {
    expect(
      rebuildEstimate({ squareFeet: -1, costPerSqFtCents: 35_000 }).status,
    ).toBe("invalid");
    expect(
      rebuildEstimate({ squareFeet: 2_000.5, costPerSqFtCents: 35_000 }).status,
    ).toBe("invalid");
  });

  it("rejects negative money as invalid", () => {
    expect(
      rebuildEstimate({ squareFeet: 2_000, costPerSqFtCents: -1 }).status,
    ).toBe("invalid");
  });

  it("trace: re-deriving the estimate from its expression reproduces the output", () => {
    const result = rebuildEstimate({ squareFeet: 2_000, costPerSqFtCents: 35_000 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C11");
    expect(result.trace.steps[0].result).toBe(
      result.value.rebuildEstimateCents.amount,
    );
  });
});
