import { describe, expect, it } from "vitest";
import { comparePolicies } from "@/engine/comparability-checks";
import type { ComparablePolicy } from "@/schemas/comparable-policy";

function hasWarning(
  warnings: { type: string; coverageCode?: string }[],
  type: string,
  coverageCode?: string,
) {
  return warnings.some(
    (w) => w.type === type && w.coverageCode === coverageCode,
  );
}

const basePolicy: ComparablePolicy = {
  policyType: "car",
  termMonths: 12,
  coverages: [
    {
      code: "liability",
      included: true,
      limitPrimaryCents: 3_000_000,
      limitSecondaryCents: 6_000_000,
      deductibleCents: 0,
      valuationBasis: "replacement_cost",
    },
    {
      code: "collision",
      included: true,
      deductibleCents: 50_000,
      valuationBasis: "actual_cash_value",
    },
  ],
};

describe("comparePolicies (§3 comparability checks)", () => {
  it("normal comparable case: identical policies produce no warnings", () => {
    const result = comparePolicies(basePolicy, structuredClone(basePolicy));

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.comparable).toBe(true);
    expect(result.value.warnings).toEqual([]);
  });

  it("DIFFERENT_POLICY_TYPE blocks comparison and suppresses every other check", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      policyType: "home",
      termMonths: 6, // also differs, to prove it's suppressed
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.comparable).toBe(false);
    expect(result.value.warnings).toEqual([
      { type: "DIFFERENT_POLICY_TYPE", fields: ["policyType"] },
    ]);
  });

  it("DIFFERENT_TERM when both terms are entered but differ", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      termMonths: 6,
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.comparable).toBe(true);
    expect(hasWarning(result.value.warnings, "DIFFERENT_TERM")).toBe(true);
  });

  it("FIELD_NOT_ENTERED for term when one side's term is missing (missing-data case)", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      termMonths: undefined,
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(hasWarning(result.value.warnings, "FIELD_NOT_ENTERED")).toBe(true);
    expect(hasWarning(result.value.warnings, "DIFFERENT_TERM")).toBe(false);
  });

  it("COVERAGE_ONLY_IN_ONE when a coverage is entirely absent on one side", () => {
    const comparison: ComparablePolicy = {
      policyType: "car",
      termMonths: 12,
      coverages: [basePolicy.coverages[0]], // missing "collision"
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(hasWarning(result.value.warnings, "COVERAGE_ONLY_IN_ONE", "collision")).toBe(
      true,
    );
  });

  it("COVERAGE_ONLY_IN_ONE when a coverage is explicitly excluded on one side", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      coverages: [
        basePolicy.coverages[0],
        { ...basePolicy.coverages[1], included: false },
      ],
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(hasWarning(result.value.warnings, "COVERAGE_ONLY_IN_ONE", "collision")).toBe(
      true,
    );
  });

  it("no warning when a coverage is excluded/absent on both sides (incompatible but agreeing)", () => {
    const baseline: ComparablePolicy = {
      policyType: "car",
      termMonths: 12,
      coverages: [{ code: "um", included: false }],
    };
    const comparison: ComparablePolicy = {
      policyType: "car",
      termMonths: 12,
      coverages: [],
    };
    const result = comparePolicies(baseline, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.warnings).toEqual([]);
  });

  it("DIFFERENT_LIMIT when both limits are entered but differ (incompatible-data case)", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      coverages: [
        { ...basePolicy.coverages[0], limitPrimaryCents: 5_000_000 },
        basePolicy.coverages[1],
      ],
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const warning = result.value.warnings.find(
      (w) => w.type === "DIFFERENT_LIMIT" && w.coverageCode === "liability",
    );
    expect(warning?.fields).toEqual(["limitPrimaryCents"]);
  });

  it("FIELD_NOT_ENTERED for a limit when one side's limit is missing while the coverage is included on both", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      coverages: [
        { ...basePolicy.coverages[0], limitSecondaryCents: undefined },
        basePolicy.coverages[1],
      ],
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const warning = result.value.warnings.find(
      (w) => w.type === "FIELD_NOT_ENTERED" && w.coverageCode === "liability",
    );
    expect(warning?.fields).toEqual(["limitSecondaryCents"]);
    expect(
      hasWarning(result.value.warnings, "DIFFERENT_LIMIT", "liability"),
    ).toBe(false);
  });

  it("DIFFERENT_DEDUCTIBLE when both deductibles are entered but differ", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      coverages: [
        basePolicy.coverages[0],
        { ...basePolicy.coverages[1], deductibleCents: 100_000 },
      ],
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(
      hasWarning(result.value.warnings, "DIFFERENT_DEDUCTIBLE", "collision"),
    ).toBe(true);
  });

  it("FIELD_NOT_ENTERED for a deductible when one side's deductible is missing", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      coverages: [
        basePolicy.coverages[0],
        { ...basePolicy.coverages[1], deductibleCents: undefined },
      ],
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(
      hasWarning(result.value.warnings, "FIELD_NOT_ENTERED", "collision"),
    ).toBe(true);
  });

  it("DIFFERENT_VALUATION_BASIS when both are entered but differ", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      coverages: [
        basePolicy.coverages[0],
        { ...basePolicy.coverages[1], valuationBasis: "replacement_cost" },
      ],
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(
      hasWarning(result.value.warnings, "DIFFERENT_VALUATION_BASIS", "collision"),
    ).toBe(true);
  });

  it("aggregates multiple simultaneous warnings across term and several coverages", () => {
    const comparison: ComparablePolicy = {
      policyType: "car",
      termMonths: 6, // different term
      coverages: [
        { ...basePolicy.coverages[0], limitPrimaryCents: 5_000_000 }, // different limit
        { ...basePolicy.coverages[1], deductibleCents: 100_000 }, // different deductible
      ],
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(hasWarning(result.value.warnings, "DIFFERENT_TERM")).toBe(true);
    expect(
      hasWarning(result.value.warnings, "DIFFERENT_LIMIT", "liability"),
    ).toBe(true);
    expect(
      hasWarning(result.value.warnings, "DIFFERENT_DEDUCTIBLE", "collision"),
    ).toBe(true);
  });

  it("never produces free-text prose, only structural type/field data (no ranking language is possible)", () => {
    const result = comparePolicies(basePolicy, {
      ...structuredClone(basePolicy),
      termMonths: 6,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    for (const warning of result.value.warnings) {
      expect(typeof warning.type).toBe("string");
      expect(Array.isArray(warning.fields)).toBe(true);
      for (const field of warning.fields) {
        expect(field).not.toMatch(/best|cheapest|recommended|top pick|winner/i);
      }
    }
  });

  it("boundary: a zero deductible on both sides is not flagged as different or missing", () => {
    const comparison: ComparablePolicy = structuredClone(basePolicy);
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(hasWarning(result.value.warnings, "DIFFERENT_DEDUCTIBLE", "liability")).toBe(
      false,
    );
    expect(hasWarning(result.value.warnings, "FIELD_NOT_ENTERED", "liability")).toBe(
      false,
    );
  });

  it("rejects duplicate coverage codes within a single policy as invalid", () => {
    const malformed: ComparablePolicy = {
      policyType: "car",
      termMonths: 12,
      coverages: [
        { code: "liability", included: true },
        { code: "liability", included: false },
      ],
    };
    const result = comparePolicies(malformed, basePolicy);

    expect(result.status).toBe("invalid");
  });

  it("rejects negative money fields as invalid", () => {
    const malformed: ComparablePolicy = {
      policyType: "car",
      termMonths: 12,
      coverages: [{ code: "liability", included: true, deductibleCents: -1 }],
    };
    const result = comparePolicies(malformed, basePolicy);

    expect(result.status).toBe("invalid");
  });

  it("rejects a non-positive term as invalid", () => {
    const malformed: ComparablePolicy = {
      policyType: "car",
      termMonths: 0,
      coverages: [],
    };
    const result = comparePolicies(malformed, basePolicy);

    expect(result.status).toBe("invalid");
  });

  it("trace: identifies the formula and records the blocking note when policy types differ", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      policyType: "home",
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("CMP-COMPARABILITY");
    expect(result.trace.notes[0]).toMatch(/not meaningful/i);
  });

  it("trace: records the number of warnings found for a normal comparison", () => {
    const comparison: ComparablePolicy = {
      ...structuredClone(basePolicy),
      termMonths: 6,
    };
    const result = comparePolicies(basePolicy, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("CMP-COMPARABILITY");
    expect(result.trace.steps[0].result).toBe(result.value.warnings.length);
  });
});
