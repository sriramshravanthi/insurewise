import { describe, expect, it } from "vitest";
import { deductibleAffordability } from "@/engine/deductible-affordability";

// Golden example from docs/CALCULATIONS.md §2 (C15).
describe("deductibleAffordability (C15)", () => {
  it("$1,000 deductible vs $800 savings -> $200 shortfall", () => {
    const result = deductibleAffordability({
      deductibleCents: 100_000,
      emergencySavingsCents: 80_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.shortfallCents?.amount).toBe(20_000);
    expect(result.value.shortfallCents?.provenance).toBe("calculated");
  });

  it("omits the shortfall, with no error and no note, when savings were not entered", () => {
    const result = deductibleAffordability({
      deductibleCents: 100_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.shortfallCents).toBeUndefined();
    expect(result.trace.notes).toEqual([]);
  });

  it("returns a $0 shortfall when savings meet or exceed the deductible", () => {
    const result = deductibleAffordability({
      deductibleCents: 100_000,
      emergencySavingsCents: 150_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.shortfallCents?.amount).toBe(0);
  });

  it("labels the output Illustrative when the input is Illustrative", () => {
    const result = deductibleAffordability({
      deductibleCents: 100_000,
      emergencySavingsCents: 80_000,
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.shortfallCents?.provenance).toBe("illustrative");
  });

  it("rejects negative money as invalid", () => {
    expect(
      deductibleAffordability({
        deductibleCents: -1,
        emergencySavingsCents: 80_000,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
    expect(
      deductibleAffordability({
        deductibleCents: 100_000,
        emergencySavingsCents: -1,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
  });

  it("trace: re-deriving the shortfall from its expression reproduces the output", () => {
    const result = deductibleAffordability({
      deductibleCents: 100_000,
      emergencySavingsCents: 80_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C15");
    expect(result.trace.steps[0].result).toBe(result.value.shortfallCents?.amount);
  });
});
