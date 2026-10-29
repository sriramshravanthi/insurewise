import { describe, expect, it } from "vitest";
import { nYearCost } from "@/engine/n-year-cost";

// Golden examples from docs/CALCULATIONS.md §2 (C6), using the same options
// as the C4/C5 examples: D_low=$500@$1,400/yr, D_high=$1,000@$1,250/yr.
describe("nYearCost (C6)", () => {
  const low = { deductibleCents: 50_000, annualPremiumCents: 140_000 };
  const high = { deductibleCents: 100_000, annualPremiumCents: 125_000 };

  it("N=5: low-deductible $7,500, high-deductible $7,250", () => {
    const result = nYearCost({ low, high, n: 5 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.lowCostCents.amount).toBe(750_000);
    expect(result.value.highCostCents.amount).toBe(725_000);
    expect(result.value.lowCostCents.provenance).toBe("illustrative");
    expect(result.value.highCostCents.provenance).toBe("illustrative");
  });

  it("N=3: low-deductible $4,700, high-deductible $4,750 (consistent with the ~3.3-year break-even)", () => {
    const result = nYearCost({ low, high, n: 3 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.lowCostCents.amount).toBe(470_000);
    expect(result.value.highCostCents.amount).toBe(475_000);
  });

  it("rejects a non-positive N as invalid", () => {
    expect(nYearCost({ low, high, n: 0 }).status).toBe("invalid");
    expect(nYearCost({ low, high, n: -1 }).status).toBe("invalid");
  });

  it("rejects a non-integer N as invalid", () => {
    expect(nYearCost({ low, high, n: 2.5 }).status).toBe("invalid");
  });

  it("propagates the ordering violation (high deductible must exceed low)", () => {
    const result = nYearCost({
      low: { deductibleCents: 100_000, annualPremiumCents: 140_000 },
      high: { deductibleCents: 100_000, annualPremiumCents: 125_000 },
      n: 5,
    });

    expect(result.status).toBe("invalid");
  });

  it("rejects negative money as invalid", () => {
    const result = nYearCost({
      low: { deductibleCents: -1, annualPremiumCents: 140_000 },
      high,
      n: 5,
    });

    expect(result.status).toBe("invalid");
  });
});
