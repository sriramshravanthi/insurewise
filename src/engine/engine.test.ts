/**
 * InsureWise Engine Unit Tests
 * Golden tests from CALCULATIONS.md worked examples + edge cases + property tests.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  c1AnnualizedPremium,
  c2CombinedAnnualCost,
  c3OutOfPocket,
  c4DeductibleTradeoff,
  c5BreakEven,
  c6NYearCostView,
  c7PremiumComposition,
  c8ScenarioDelta,
  c9BundleDelta,
  c10CoverageRatios,
  c11RebuildEstimate,
  c12AcvIllustration,
  c13CoverageCostRatio,
  c14LoanVsValueShortfall,
  c15DeductibleAffordability,
  roundHalfUp,
} from "./index";

// ---------------------------------------------------------------------------
// C1: Annualized premium
// ---------------------------------------------------------------------------

describe("C1: Annualized premium", () => {
  it("golden: $900 six-month term → $1,800/yr", () => {
    const r = c1AnnualizedPremium({ amountCents: 90000, amountBasis: "per_term", termMonths: 6 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.annualCents).toBe(180000);
  });

  it("golden: $150/month installment → $1,800/yr", () => {
    const r = c1AnnualizedPremium({ amountCents: 15000, amountBasis: "per_installment", installmentsPerYear: 12 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.annualCents).toBe(180000);
  });

  it("zero premium → ok with note", () => {
    const r = c1AnnualizedPremium({ amountCents: 0, amountBasis: "per_term", termMonths: 6 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.annualCents).toBe(0);
      expect(r.trace.notes?.some((n) => n.includes("zero"))).toBe(true);
    }
  });

  it("missing termMonths → insufficient_data", () => {
    const r = c1AnnualizedPremium({ amountCents: 90000, amountBasis: "per_term" });
    expect(r.status).toBe("insufficient_data");
    if (r.status === "insufficient_data") expect(r.missing).toContain("termMonths");
  });

  it("missing installmentsPerYear → insufficient_data", () => {
    const r = c1AnnualizedPremium({ amountCents: 15000, amountBasis: "per_installment" });
    expect(r.status).toBe("insufficient_data");
  });

  it("negative amount → invalid", () => {
    const r = c1AnnualizedPremium({ amountCents: -100, amountBasis: "per_term", termMonths: 6 });
    expect(r.status).toBe("invalid");
  });

  it("has formula ID in trace", () => {
    const r = c1AnnualizedPremium({ amountCents: 90000, amountBasis: "per_term", termMonths: 6 });
    if (r.status === "ok") expect(r.trace.formulaId).toBe("C1");
  });
});

// ---------------------------------------------------------------------------
// C2: Combined annual cost
// ---------------------------------------------------------------------------

describe("C2: Combined annual cost", () => {
  it("golden: $1,800 + $2,400 = $4,200/yr", () => {
    const r = c2CombinedAnnualCost({ carAnnualCents: 180000, homeAnnualCents: 240000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.combinedCents).toBe(420000);
  });

  it("missing car → insufficient_data", () => {
    const r = c2CombinedAnnualCost({ carAnnualCents: null, homeAnnualCents: 240000 });
    expect(r.status).toBe("insufficient_data");
    if (r.status === "insufficient_data") expect(r.missing).toContain("carAnnualCents");
  });

  it("missing home → insufficient_data listing home", () => {
    const r = c2CombinedAnnualCost({ carAnnualCents: 180000, homeAnnualCents: null });
    expect(r.status).toBe("insufficient_data");
    if (r.status === "insufficient_data") expect(r.missing).toContain("homeAnnualCents");
  });

  it("never treats missing as zero — both missing → insufficient_data with both keys", () => {
    const r = c2CombinedAnnualCost({ carAnnualCents: null, homeAnnualCents: null });
    expect(r.status).toBe("insufficient_data");
    if (r.status === "insufficient_data") {
      expect(r.missing).toContain("carAnnualCents");
      expect(r.missing).toContain("homeAnnualCents");
    }
  });
});

// ---------------------------------------------------------------------------
// C3: Out-of-pocket
// ---------------------------------------------------------------------------

describe("C3: Out-of-pocket", () => {
  it("golden: L=8000, D=1000, no limit → user=$1,000", () => {
    const r = c3OutOfPocket({ lossCents: 800000, deductibleCents: 100000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.userPaysCents).toBe(100000);
      expect(r.value.insurerPaysCents).toBe(700000);
    }
  });

  it("golden: L=500, D=1000 → insurer $0, user $500", () => {
    const r = c3OutOfPocket({ lossCents: 50000, deductibleCents: 100000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.insurerPaysCents).toBe(0);
      expect(r.value.userPaysCents).toBe(50000);
    }
  });

  it("golden: L=300k, D=2k, M=250k, after_deductible → user=$50k", () => {
    const r = c3OutOfPocket({ lossCents: 30000000, deductibleCents: 200000, limitCents: 25000000, limitBasis: "after_deductible" });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.insurerPaysCents).toBe(25000000);
      expect(r.value.userPaysCents).toBe(5000000);
    }
  });

  it("golden: L=300k, D=2k, M=250k, before_deductible → user=$52k", () => {
    const r = c3OutOfPocket({ lossCents: 30000000, deductibleCents: 200000, limitCents: 25000000, limitBasis: "before_deductible" });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.insurerPaysCents).toBe(24800000);
      expect(r.value.userPaysCents).toBe(5200000);
    }
  });

  it("output is labeled Illustrative", () => {
    const r = c3OutOfPocket({ lossCents: 50000, deductibleCents: 10000 });
    if (r.status === "ok") expect(r.trace.outputProvenance).toBe("Illustrative");
  });

  it("property: userPays + insurerPays = L", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 5_000_000 }),
        fc.option(fc.integer({ min: 0, max: 8_000_000 })),
        (L, D, M) => {
          const r = c3OutOfPocket({ lossCents: L, deductibleCents: D, ...(M !== null ? { limitCents: M } : {}) });
          if (r.status !== "ok") return true;
          return r.value.userPaysCents + r.value.insurerPaysCents === L;
        }
      )
    );
  });

  it("property: both userPays and insurerPays ≥ 0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 5_000_000 }),
        (L, D) => {
          const r = c3OutOfPocket({ lossCents: L, deductibleCents: D });
          if (r.status !== "ok") return true;
          return r.value.userPaysCents >= 0 && r.value.insurerPaysCents >= 0;
        }
      )
    );
  });

  it("property: userPays ≤ L", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 5_000_000 }),
        (L, D) => {
          const r = c3OutOfPocket({ lossCents: L, deductibleCents: D });
          if (r.status !== "ok") return true;
          return r.value.userPaysCents <= L;
        }
      )
    );
  });

  it("property: increasing D never decreases userPays (same L, same basis, no limit)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 2_000_000 }),
        fc.integer({ min: 0, max: 2_000_000 }),
        (L, D1, D2) => {
          const dLow = Math.min(D1, D2);
          const dHigh = Math.max(D1, D2);
          const rLow = c3OutOfPocket({ lossCents: L, deductibleCents: dLow });
          const rHigh = c3OutOfPocket({ lossCents: L, deductibleCents: dHigh });
          if (rLow.status !== "ok" || rHigh.status !== "ok") return true;
          return rHigh.value.userPaysCents >= rLow.value.userPaysCents;
        }
      )
    );
  });

  it("property: no limit → userPays = min(L, D)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 5_000_000 }),
        (L, D) => {
          const r = c3OutOfPocket({ lossCents: L, deductibleCents: D });
          if (r.status !== "ok") return true;
          return r.value.userPaysCents === Math.min(L, D);
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// C4/C5/C6
// ---------------------------------------------------------------------------

describe("C4: Deductible trade-off", () => {
  it("golden: D_low $500@$1,400, D_high $1,000@$1,250 → diff $150, extra OOP $500", () => {
    const r = c4DeductibleTradeoff({ dLowCents: 50000, pLowAnnualCents: 140000, dHighCents: 100000, pHighAnnualCents: 125000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.annualPremiumDifferenceCents).toBe(15000);
      expect(r.value.extraOutOfPocketIfClaimCents).toBe(50000);
    }
  });

  it("D_high ≤ D_low → invalid", () => {
    const r = c4DeductibleTradeoff({ dLowCents: 100000, pLowAnnualCents: 140000, dHighCents: 50000, pHighAnnualCents: 125000 });
    expect(r.status).toBe("invalid");
  });

  it("P_high >= P_low → ok with note", () => {
    const r = c4DeductibleTradeoff({ dLowCents: 50000, pLowAnnualCents: 100000, dHighCents: 100000, pHighAnnualCents: 120000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.trace.notes?.length).toBeGreaterThan(0);
  });
});

describe("C5: Break-even", () => {
  it("golden: (1000−500) / (1400−1250) = 3.33 years", () => {
    const r = c5BreakEven({ dLowCents: 50000, pLowAnnualCents: 140000, dHighCents: 100000, pHighAnnualCents: 125000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.breakEvenYears).toBeCloseTo(3.33, 1);
  });

  it("no premium savings → no_premium_savings_entered", () => {
    const r = c5BreakEven({ dLowCents: 50000, pLowAnnualCents: 100000, dHighCents: 100000, pHighAnnualCents: 120000 });
    expect(r.status).toBe("no_premium_savings_entered");
  });
});

describe("C6: N-year cost view", () => {
  it("golden N=5: low=7,500, high=7,250", () => {
    const r = c6NYearCostView({ nYears: 5, dLowCents: 50000, pLowAnnualCents: 140000, dHighCents: 100000, pHighAnnualCents: 125000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.options[0].nYearCostCents).toBe(750000);
      expect(r.value.options[1].nYearCostCents).toBe(725000);
    }
  });

  it("golden N=3: low=4,700, high=4,750 (cross-check break-even 3.3 yrs)", () => {
    const r = c6NYearCostView({ nYears: 3, dLowCents: 50000, pLowAnnualCents: 140000, dHighCents: 100000, pHighAnnualCents: 125000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.options[0].nYearCostCents).toBe(470000);
      expect(r.value.options[1].nYearCostCents).toBe(475000);
    }
  });

  it("output labeled Illustrative", () => {
    const r = c6NYearCostView({ nYears: 5, dLowCents: 50000, pLowAnnualCents: 140000, dHighCents: 100000, pHighAnnualCents: 125000 });
    if (r.status === "ok") expect(r.trace.outputProvenance).toBe("Illustrative");
  });

  it("N < 1 → invalid", () => {
    const r = c6NYearCostView({ nYears: 0, dLowCents: 50000, pLowAnnualCents: 140000, dHighCents: 100000, pHighAnnualCents: 125000 });
    expect(r.status).toBe("invalid");
  });
});

// ---------------------------------------------------------------------------
// C7: Premium composition
// ---------------------------------------------------------------------------

describe("C7: Premium composition", () => {
  it("golden: liability$600, collision$400, comp$150, UM$100 → 48/32/12/8%", () => {
    const r = c7PremiumComposition([
      { key: "liability", label: "Liability", annualCents: 60000 },
      { key: "collision", label: "Collision", annualCents: 40000 },
      { key: "comprehensive", label: "Comprehensive", annualCents: 15000 },
      { key: "um", label: "UM", annualCents: 10000 },
    ]);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      const shares = r.value.shares;
      expect(shares.find((s) => s.key === "liability")?.sharePct).toBe(48.0);
      expect(shares.find((s) => s.key === "collision")?.sharePct).toBe(32.0);
      expect(shares.find((s) => s.key === "comprehensive")?.sharePct).toBe(12.0);
      expect(shares.find((s) => s.key === "um")?.sharePct).toBe(8.0);
    }
  });

  it("total = 0 → insufficient_data", () => {
    const r = c7PremiumComposition([{ key: "a", label: "A", annualCents: 0 }]);
    expect(r.status).toBe("insufficient_data");
  });

  it("empty lines → insufficient_data", () => {
    const r = c7PremiumComposition([]);
    expect(r.status).toBe("insufficient_data");
  });

  it("property: shares always sum to exactly 100.0%", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 1_000_000 }), { minLength: 1, maxLength: 10 }),
        (amounts) => {
          const lines = amounts.map((a, i) => ({ key: `k${i}`, label: `L${i}`, annualCents: a }));
          const r = c7PremiumComposition(lines);
          if (r.status !== "ok") return true;
          const sum = r.value.shares.reduce((s, x) => s + x.sharePct, 0);
          return Math.abs(sum - 100.0) < 0.001;
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// C8/C9
// ---------------------------------------------------------------------------

describe("C8: Scenario delta", () => {
  it("golden: baseline $2,000, scenario $2,150 → +$150 (+7.5%)", () => {
    const r = c8ScenarioDelta({ baselineCents: 200000, scenarioCents: 215000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.deltaCents).toBe(15000);
      expect(r.value.deltaPct).toBeCloseTo(7.5, 1);
    }
  });

  it("baseline = 0 → deltaPct = null", () => {
    const r = c8ScenarioDelta({ baselineCents: 0, scenarioCents: 10000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.deltaPct).toBeNull();
  });

  it("property: antisymmetry (swap baseline/scenario flips sign)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (a, b) => {
          const r1 = c8ScenarioDelta({ baselineCents: a, scenarioCents: b });
          const r2 = c8ScenarioDelta({ baselineCents: b, scenarioCents: a });
          if (r1.status !== "ok" || r2.status !== "ok") return true;
          return r1.value.deltaCents === -r2.value.deltaCents;
        }
      )
    );
  });
});

describe("C9: Bundle delta", () => {
  it("golden: separate $4,200, bundled $3,950 → $250 lower (6.0%)", () => {
    const r = c9BundleDelta({ separatePolicyCents: [180000, 240000], bundledCents: 395000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.differenceCents).toBe(25000);
      expect(r.value.differencePct).toBeCloseTo(6.0, 0);
      expect(r.value.direction).toBe("lower");
    }
  });

  it("golden: bundled $4,300 → $100 higher (2.4%)", () => {
    const r = c9BundleDelta({ separatePolicyCents: [180000, 240000], bundledCents: 430000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.differenceCents).toBe(-10000);
      expect(r.value.direction).toBe("higher");
    }
  });
});

// ---------------------------------------------------------------------------
// C10/C11
// ---------------------------------------------------------------------------

describe("C11: Rebuild estimate", () => {
  it("golden: 2,000 sqft × $350/sqft = $700,000", () => {
    const r = c11RebuildEstimate({ squareFeet: 2000, costPerSqFtCents: 35000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.rebuildEstimateCents).toBe(70000000);
  });

  it("output labeled Illustrative", () => {
    const r = c11RebuildEstimate({ squareFeet: 2000, costPerSqFtCents: 35000 });
    if (r.status === "ok") expect(r.trace.outputProvenance).toBe("Illustrative");
  });
});

describe("C10: Coverage ratios", () => {
  it("golden: A=$600k, C=$300k, D=$120k, rebuild=$700k", () => {
    const r = c10CoverageRatios({
      coverageACents: 60000000,
      coverageCCents: 30000000,
      coverageDCents: 12000000,
      rebuildEstimateCents: 70000000,
    });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.contentsVsDwellingPct).toBeCloseTo(50.0, 0);
      expect(r.value.lossOfUseVsDwellingPct).toBeCloseTo(20.0, 0);
      expect(r.value.dwellingVsRebuildPct).toBeCloseTo(85.7, 0);
    }
  });

  it("A = 0 → insufficient_data", () => {
    const r = c10CoverageRatios({ coverageACents: 0 });
    expect(r.status).toBe("insufficient_data");
  });
});

// ---------------------------------------------------------------------------
// C12: ACV illustration
// ---------------------------------------------------------------------------

describe("C12: ACV illustration", () => {
  it("golden: L=$20k, dep=30%, D=$1k → ACV insurer=$13k, user=$7k; RCV insurer=$19k, user=$1k", () => {
    const r = c12AcvIllustration({ replacementCostLossCents: 2000000, depreciationPct: 0.3, deductibleCents: 100000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.value.acvInsurerPaysCents).toBe(1300000);
      expect(r.value.acvUserPaysCents).toBe(700000);
      expect(r.value.rcvInsurerPaysCents).toBe(1900000);
      expect(r.value.rcvUserPaysCents).toBe(100000);
    }
  });

  it("output labeled Illustrative", () => {
    const r = c12AcvIllustration({ replacementCostLossCents: 2000000, depreciationPct: 0.3, deductibleCents: 100000 });
    if (r.status === "ok") expect(r.trace.outputProvenance).toBe("Illustrative");
  });

  it("dep > 1 → invalid", () => {
    const r = c12AcvIllustration({ replacementCostLossCents: 2000000, depreciationPct: 1.5, deductibleCents: 100000 });
    expect(r.status).toBe("invalid");
  });
});

// ---------------------------------------------------------------------------
// C13/C14/C15
// ---------------------------------------------------------------------------

describe("C13: Coverage cost ratio", () => {
  it("golden: $550 / $6,000 = 9.2%", () => {
    const r = c13CoverageCostRatio({ annualCollisionPremiumCents: 40000, annualComprehensivePremiumCents: 15000, vehicleValueCents: 600000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.ratioPct).toBeCloseTo(9.2, 0);
  });

  it("vehicle value = 0 → insufficient_data", () => {
    const r = c13CoverageCostRatio({ annualCollisionPremiumCents: 40000, annualComprehensivePremiumCents: 15000, vehicleValueCents: 0 });
    expect(r.status).toBe("insufficient_data");
  });
});

describe("C14: Loan vs value shortfall", () => {
  it("golden: $22k − $18.5k = $3,500 shortfall", () => {
    const r = c14LoanVsValueShortfall({ loanBalanceCents: 2200000, vehicleValueCents: 1850000, gapCoverageEntered: false });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.shortfallCents).toBe(350000);
  });

  it("loan < value → shortfall = 0", () => {
    const r = c14LoanVsValueShortfall({ loanBalanceCents: 1000000, vehicleValueCents: 2000000, gapCoverageEntered: false });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.shortfallCents).toBe(0);
  });
});

describe("C15: Deductible affordability", () => {
  it("golden: $1,000 ded vs $800 savings → $200 shortfall", () => {
    const r = c15DeductibleAffordability({ deductibleCents: 100000, emergencySavingsCents: 80000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.shortfallCents).toBe(20000);
  });

  it("savings > deductible → shortfall = 0", () => {
    const r = c15DeductibleAffordability({ deductibleCents: 50000, emergencySavingsCents: 100000 });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.value.shortfallCents).toBe(0);
  });

  it("savings not provided → insufficient_data", () => {
    const r = c15DeductibleAffordability({ deductibleCents: 100000 });
    expect(r.status).toBe("insufficient_data");
  });
});

// ---------------------------------------------------------------------------
// Global property: no function returns NaN, Infinity, or negative money
// ---------------------------------------------------------------------------

describe("No NaN/Infinity/negative money from any engine function", () => {
  it("c1 outputs are finite and non-negative", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (amt) => {
        const r = c1AnnualizedPremium({ amountCents: amt, amountBasis: "per_term", termMonths: 6 });
        if (r.status !== "ok") return true;
        return Number.isFinite(r.value.annualCents) && r.value.annualCents >= 0;
      })
    );
  });

  it("c3 outputs are finite and non-negative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 0, max: 5_000_000 }),
        (L, D) => {
          const r = c3OutOfPocket({ lossCents: L, deductibleCents: D });
          if (r.status !== "ok") return true;
          return (
            Number.isFinite(r.value.userPaysCents) &&
            r.value.userPaysCents >= 0 &&
            Number.isFinite(r.value.insurerPaysCents) &&
            r.value.insurerPaysCents >= 0
          );
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Rounding helper
// ---------------------------------------------------------------------------

describe("roundHalfUp", () => {
  it("0.5 rounds up", () => expect(roundHalfUp(0.5)).toBe(1));
  it("1.5 rounds up", () => expect(roundHalfUp(1.5)).toBe(2));
  it("2.5 rounds up", () => expect(roundHalfUp(2.5)).toBe(3));
  it("1.4 rounds down", () => expect(roundHalfUp(1.4)).toBe(1));
  it("negative preserved", () => expect(roundHalfUp(-1)).toBe(-1));
});
