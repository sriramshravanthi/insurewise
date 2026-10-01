import { describe, expect, it } from "vitest";
import { deductibleTradeOff } from "@/engine/deductible-trade-off";

// Golden example from docs/CALCULATIONS.md §2 (C4), which is also PRD
// SCN-1's own acceptance-criteria example.
describe("deductibleTradeOff (C4)", () => {
  it("D_low=$500@$1,400/yr, D_high=$1,000@$1,250/yr → +$150/yr, +$500 extra out-of-pocket", () => {
    const result = deductibleTradeOff({
      low: { deductibleCents: 50_000, annualPremiumCents: 140_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 125_000 },
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.annualPremiumDifferenceCents.amount).toBe(15_000);
    expect(result.value.extraOutOfPocketIfClaimCents.amount).toBe(50_000);
    expect(result.value.annualPremiumDifferenceCents.provenance).toBe(
      "calculated",
    );
    expect(result.trace.notes).toEqual([]);
  });

  it("returns invalid when the high deductible does not exceed the low deductible", () => {
    const result = deductibleTradeOff({
      low: { deductibleCents: 100_000, annualPremiumCents: 140_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 125_000 },
      provenance: "entered",
    });

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.errors[0].code).toBe("not_greater_than_low");
  });

  it("returns ok with a neutral note when the higher deductible has no premium reduction", () => {
    const result = deductibleTradeOff({
      low: { deductibleCents: 50_000, annualPremiumCents: 125_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 140_000 },
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.annualPremiumDifferenceCents.amount).toBe(-15_000);
    expect(result.trace.notes).toContain(
      "No premium reduction was entered for the higher deductible.",
    );
  });

  it("labels the output Illustrative when the input is Illustrative", () => {
    const result = deductibleTradeOff({
      low: { deductibleCents: 50_000, annualPremiumCents: 140_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 125_000 },
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.annualPremiumDifferenceCents.provenance).toBe(
      "illustrative",
    );
  });

  it("rejects negative money as invalid", () => {
    const result = deductibleTradeOff({
      low: { deductibleCents: -1, annualPremiumCents: 140_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 125_000 },
      provenance: "entered",
    });

    expect(result.status).toBe("invalid");
  });
});
