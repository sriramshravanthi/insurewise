import { describe, expect, it } from "vitest";
import { coverageToValueRatio } from "@/engine/coverage-to-value-ratio";

// Golden example from docs/CALCULATIONS.md §2 (C13).
describe("coverageToValueRatio (C13)", () => {
  it("$550 combined premium / $6,000 vehicle value -> 9.2%", () => {
    const result = coverageToValueRatio({
      collisionPremiumCents: 35_000,
      comprehensivePremiumCents: 20_000,
      vehicleValueCents: 600_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.ratio?.amount).toBe(9.2);
    expect(result.value.ratio?.provenance).toBe("calculated");
  });

  it("sums collision and comprehensive before computing the ratio", () => {
    const resultSplit = coverageToValueRatio({
      collisionPremiumCents: 10_000,
      comprehensivePremiumCents: 45_000,
      vehicleValueCents: 600_000,
      provenance: "entered",
    });
    const resultCombined = coverageToValueRatio({
      collisionPremiumCents: 55_000,
      comprehensivePremiumCents: 0,
      vehicleValueCents: 600_000,
      provenance: "entered",
    });

    expect(resultSplit.status).toBe("ok");
    expect(resultCombined.status).toBe("ok");
    if (resultSplit.status !== "ok" || resultCombined.status !== "ok") return;
    expect(resultSplit.value.ratio?.amount).toBe(
      resultCombined.value.ratio?.amount,
    );
  });

  it("omits the ratio, with a note, when the vehicle value is $0", () => {
    const result = coverageToValueRatio({
      collisionPremiumCents: 35_000,
      comprehensivePremiumCents: 20_000,
      vehicleValueCents: 0,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.ratio).toBeUndefined();
    expect(result.trace.notes[0]).toMatch(/vehicle value is \$0\.00/i);
  });

  it("labels the output Illustrative when the input is Illustrative", () => {
    const result = coverageToValueRatio({
      collisionPremiumCents: 35_000,
      comprehensivePremiumCents: 20_000,
      vehicleValueCents: 600_000,
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.ratio?.provenance).toBe("illustrative");
  });

  it("rejects negative money as invalid", () => {
    expect(
      coverageToValueRatio({
        collisionPremiumCents: -1,
        comprehensivePremiumCents: 20_000,
        vehicleValueCents: 600_000,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
    expect(
      coverageToValueRatio({
        collisionPremiumCents: 35_000,
        comprehensivePremiumCents: 20_000,
        vehicleValueCents: -1,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
  });

  it("trace: re-deriving the ratio from its expression reproduces the output", () => {
    const result = coverageToValueRatio({
      collisionPremiumCents: 35_000,
      comprehensivePremiumCents: 20_000,
      vehicleValueCents: 600_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C13");
    expect(result.trace.steps[1].result).toBe(result.value.ratio?.amount);
  });
});
