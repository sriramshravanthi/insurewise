import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { diffPolicies } from "@/engine/policy-diff";
import type { DiffablePolicy } from "@/schemas/diffable-policy";
import type { ComparableCoverage } from "@/schemas/comparable-policy";

const CODES = ["liability", "collision", "comprehensive"] as const;

const coverageArb: fc.Arbitrary<ComparableCoverage> = fc.record({
  code: fc.constantFrom(...CODES),
  included: fc.boolean(),
  limitPrimaryCents: fc.option(fc.integer({ min: 0, max: 1_000_000 }), { nil: undefined }),
  limitSecondaryCents: fc.option(fc.integer({ min: 0, max: 1_000_000 }), { nil: undefined }),
  deductibleCents: fc.option(fc.integer({ min: 0, max: 1_000_000 }), { nil: undefined }),
});

function dedupeByCode(coverages: ComparableCoverage[]): ComparableCoverage[] {
  const seen = new Set<string>();
  return coverages.filter((c) => {
    if (seen.has(c.code)) return false;
    seen.add(c.code);
    return true;
  });
}

const policyArb: fc.Arbitrary<DiffablePolicy> = fc.record({
  provenance: fc.constant("entered" as const),
  annualPremiumCents: fc.option(fc.integer({ min: 0, max: 1_000_000 }), {
    nil: undefined,
  }),
  coverages: fc.array(coverageArb, { maxLength: 3 }).map(dedupeByCode),
  endorsements: fc.constant([]),
  limitations: fc.constant([]),
});

describe("diffPolicies (PRD CMP-2) properties", () => {
  it("a policy diffed against an identical copy of itself has no 'different' rows", () => {
    fc.assert(
      fc.property(policyArb, (policy) => {
        const result = diffPolicies(policy, structuredClone(policy));
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        expect(result.value.rows.some((r) => r.status === "different")).toBe(false);
      }),
    );
  });

  it("every money row is either 'same', 'different', or 'not_comparable' consistent with which sides entered it", () => {
    fc.assert(
      fc.property(policyArb, policyArb, (a, b) => {
        const result = diffPolicies(a, b);
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;

        for (const row of result.value.rows) {
          if (row.kind !== "money") continue;
          if (row.baseline === null || row.comparison === null) {
            expect(row.status).toBe("not_comparable");
          } else if (row.baseline.amount === row.comparison.amount) {
            expect(row.status).toBe("same");
          } else {
            expect(row.status).toBe("different");
          }
        }
      }),
    );
  });

  it("is symmetric: swapping baseline and comparison preserves each row's status (only baseline/comparison swap)", () => {
    fc.assert(
      fc.property(policyArb, policyArb, (a, b) => {
        const forward = diffPolicies(a, b);
        const swapped = diffPolicies(b, a);
        expect(forward.status).toBe("ok");
        expect(swapped.status).toBe("ok");
        if (forward.status !== "ok" || swapped.status !== "ok") return;
        expect(swapped.value.rows.length).toBe(forward.value.rows.length);

        const statusByKey = (rows: typeof forward.value.rows) =>
          rows
            .map((r) => `${r.category}:${r.kind === "presence" ? r.key : r.coverageCode ?? ""}:${r.status}`)
            .sort();
        expect(statusByKey(swapped.value.rows)).toEqual(statusByKey(forward.value.rows));
      }),
    );
  });

  it("never omits a coverage_included row for any coverage code present on either side", () => {
    fc.assert(
      fc.property(policyArb, policyArb, (a, b) => {
        const result = diffPolicies(a, b);
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;

        const allCodes = new Set([
          ...a.coverages.map((c) => c.code),
          ...b.coverages.map((c) => c.code),
        ]);
        const presentCodes = new Set(
          result.value.rows
            .filter((r) => r.category === "coverage_included")
            .map((r) => (r as { key: string }).key),
        );
        expect(presentCodes).toEqual(allCodes);
      }),
    );
  });
});
