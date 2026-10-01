import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { comparePolicies } from "@/engine/comparability-checks";
import type { ComparableCoverage, ComparablePolicy } from "@/schemas/comparable-policy";

const CODES = ["liability", "collision", "comprehensive"] as const;

const coverageArb: fc.Arbitrary<ComparableCoverage> = fc.record({
  code: fc.constantFrom(...CODES),
  included: fc.boolean(),
  limitPrimaryCents: fc.option(fc.integer({ min: 0, max: 1_000_000 }), {
    nil: undefined,
  }),
  limitSecondaryCents: fc.option(fc.integer({ min: 0, max: 1_000_000 }), {
    nil: undefined,
  }),
  deductibleCents: fc.option(fc.integer({ min: 0, max: 1_000_000 }), {
    nil: undefined,
  }),
  valuationBasis: fc.option(
    fc.constantFrom("replacement_cost", "actual_cash_value"),
    { nil: undefined },
  ),
});

function dedupeByCode(coverages: ComparableCoverage[]): ComparableCoverage[] {
  const seen = new Set<string>();
  return coverages.filter((c) => {
    if (seen.has(c.code)) return false;
    seen.add(c.code);
    return true;
  });
}

const policyArb: fc.Arbitrary<ComparablePolicy> = fc.record({
  policyType: fc.constantFrom("car", "home"),
  termMonths: fc.option(fc.constantFrom(1, 3, 6, 12), { nil: undefined }),
  coverages: fc.array(coverageArb, { maxLength: 4 }).map(dedupeByCode),
});

function sortedWarningKeys(
  warnings: { type: string; coverageCode?: string; fields: string[] }[],
) {
  return warnings.map((w) => JSON.stringify(w)).sort();
}

describe("comparePolicies (§3 comparability checks) properties", () => {
  it("is symmetric: swapping baseline and comparison yields the same comparable flag and warning set", () => {
    fc.assert(
      fc.property(policyArb, policyArb, (a, b) => {
        const forward = comparePolicies(a, b);
        const swapped = comparePolicies(b, a);

        expect(forward.status).toBe("ok");
        expect(swapped.status).toBe("ok");
        if (forward.status !== "ok" || swapped.status !== "ok") return;
        expect(swapped.value.comparable).toBe(forward.value.comparable);
        expect(sortedWarningKeys(swapped.value.warnings)).toEqual(
          sortedWarningKeys(forward.value.warnings),
        );
      }),
    );
  });

  it("a policy compared against an identical copy of itself always has no warnings and is comparable", () => {
    fc.assert(
      fc.property(policyArb, (policy) => {
        const result = comparePolicies(policy, structuredClone(policy));

        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        expect(result.value.comparable).toBe(true);
        expect(result.value.warnings).toEqual([]);
      }),
    );
  });

  it("every coverage-specific warning names a coverage code present in at least one of the two policies", () => {
    fc.assert(
      fc.property(policyArb, policyArb, (a, b) => {
        const result = comparePolicies(a, b);
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;

        const knownCodes = new Set([
          ...a.coverages.map((c) => c.code),
          ...b.coverages.map((c) => c.code),
        ]);
        for (const warning of result.value.warnings) {
          if (warning.coverageCode !== undefined) {
            expect(knownCodes.has(warning.coverageCode)).toBe(true);
          }
        }
      }),
    );
  });

  it("comparable is false if and only if a DIFFERENT_POLICY_TYPE warning is present", () => {
    fc.assert(
      fc.property(policyArb, policyArb, (a, b) => {
        const result = comparePolicies(a, b);
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;

        const hasPolicyTypeWarning = result.value.warnings.some(
          (w) => w.type === "DIFFERENT_POLICY_TYPE",
        );
        expect(result.value.comparable).toBe(!hasPolicyTypeWarning);
      }),
    );
  });

  it("when policy types differ, exactly one warning is produced and no coverage checks run", () => {
    fc.assert(
      fc.property(policyArb, policyArb, (a, b) => {
        fc.pre(a.policyType !== b.policyType);
        const result = comparePolicies(a, b);

        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        expect(result.value.warnings).toEqual([
          { type: "DIFFERENT_POLICY_TYPE", fields: ["policyType"] },
        ]);
      }),
    );
  });
});
