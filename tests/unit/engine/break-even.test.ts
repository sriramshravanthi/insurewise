import { describe, expect, it } from "vitest";
import { breakEvenYears } from "@/engine/break-even";

// Golden example from docs/CALCULATIONS.md §2 (C5), also PRD SCN-1's own
// acceptance-criteria example: 500 / 150 = 3.33 -> "about 3.3 years."
describe("breakEvenYears (C5)", () => {
  it("D_low=$500@$1,400/yr, D_high=$1,000@$1,250/yr -> about 3.3 years", () => {
    const result = breakEvenYears({
      low: { deductibleCents: 50_000, annualPremiumCents: 140_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 125_000 },
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.status).toBe("computed");
    expect(result.value.breakEvenYears?.amount).toBeCloseTo(3.3, 5);
    expect(result.value.breakEvenYears?.provenance).toBe("calculated");
  });

  it("returns no_premium_savings_entered when the higher deductible has no premium benefit", () => {
    const result = breakEvenYears({
      low: { deductibleCents: 50_000, annualPremiumCents: 125_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 140_000 },
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.status).toBe("no_premium_savings_entered");
    expect(result.value.breakEvenYears).toBeUndefined();
    expect(result.trace.notes[0]).toMatch(/no break-even/i);
  });

  it("propagates the ordering violation from the underlying trade-off as invalid", () => {
    const result = breakEvenYears({
      low: { deductibleCents: 100_000, annualPremiumCents: 140_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 125_000 },
      provenance: "entered",
    });

    expect(result.status).toBe("invalid");
  });

  it("labels the output Illustrative when the input is Illustrative", () => {
    const result = breakEvenYears({
      low: { deductibleCents: 50_000, annualPremiumCents: 140_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 125_000 },
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.breakEvenYears?.provenance).toBe("illustrative");
  });
});
