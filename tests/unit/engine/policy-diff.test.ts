import { describe, expect, it } from "vitest";
import { diffPolicies, type DiffRow } from "@/engine/policy-diff";
import type { DiffablePolicy } from "@/schemas/diffable-policy";

function findRow(rows: DiffRow[], category: string, identity?: string) {
  return rows.find(
    (r) =>
      r.category === category &&
      (identity === undefined ||
        (r.kind === "presence" ? r.key === identity : r.coverageCode === identity)),
  );
}

const baseline: DiffablePolicy = {
  provenance: "entered",
  annualPremiumCents: 150_000,
  coverages: [
    {
      code: "liability",
      included: true,
      limitPrimaryCents: 3_000_000,
      deductibleCents: 0,
    },
    { code: "collision", included: true, deductibleCents: 50_000 },
  ],
  endorsements: [{ code: "roadside", label: "Roadside assistance" }],
  limitations: [{ text: "Excludes racing use." }],
};

describe("diffPolicies (PRD CMP-2 row-by-row diff)", () => {
  it("produces a premium row marked different when premiums differ", () => {
    const comparison: DiffablePolicy = { ...structuredClone(baseline), annualPremiumCents: 175_000 };
    const result = diffPolicies(baseline, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const premiumRow = findRow(result.value.rows, "premium");
    expect(premiumRow).toMatchObject({
      status: "different",
      baseline: { amount: 150_000, provenance: "entered" },
      comparison: { amount: 175_000, provenance: "entered" },
    });
  });

  it("marks the premium row 'same' when both sides match, and omits it entirely when neither entered a premium", () => {
    const sameResult = diffPolicies(baseline, structuredClone(baseline));
    expect(sameResult.status).toBe("ok");
    if (sameResult.status !== "ok") return;
    expect(findRow(sameResult.value.rows, "premium")?.status).toBe("same");

    const neither: DiffablePolicy = {
      ...structuredClone(baseline),
      annualPremiumCents: undefined,
    };
    const omittedResult = diffPolicies(neither, structuredClone(neither));
    expect(omittedResult.status).toBe("ok");
    if (omittedResult.status !== "ok") return;
    expect(findRow(omittedResult.value.rows, "premium")).toBeUndefined();
  });

  it("marks a money row not_comparable when exactly one side entered it", () => {
    const comparison: DiffablePolicy = {
      ...structuredClone(baseline),
      annualPremiumCents: undefined,
    };
    const result = diffPolicies(baseline, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const premiumRow = findRow(result.value.rows, "premium");
    expect(premiumRow?.status).toBe("not_comparable");
    expect(premiumRow).toMatchObject({ comparison: null });
  });

  it("always emits a coverage_included row, even when both sides agree", () => {
    const result = diffPolicies(baseline, structuredClone(baseline));

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const row = findRow(result.value.rows, "coverage_included", "liability");
    expect(row).toMatchObject({ inBaseline: true, inComparison: true, status: "same" });
  });

  it("marks coverage_included 'different' when a coverage is only on one side, and skips limit/deductible rows for it", () => {
    const comparison: DiffablePolicy = {
      ...structuredClone(baseline),
      coverages: [baseline.coverages[0]], // missing "collision"
    };
    const result = diffPolicies(baseline, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(findRow(result.value.rows, "coverage_included", "collision")).toMatchObject({
      status: "different",
    });
    expect(
      findRow(result.value.rows, "coverage_deductible", "collision"),
    ).toBeUndefined();
  });

  it("produces coverage_limit_primary/deductible rows when both sides include the coverage", () => {
    const comparison: DiffablePolicy = {
      ...structuredClone(baseline),
      coverages: [
        { ...baseline.coverages[0], limitPrimaryCents: 5_000_000 },
        baseline.coverages[1],
      ],
    };
    const result = diffPolicies(baseline, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(
      findRow(result.value.rows, "coverage_limit_primary", "liability"),
    ).toMatchObject({ status: "different" });
    expect(
      findRow(result.value.rows, "coverage_deductible", "liability"),
    ).toMatchObject({ status: "same" }); // both $0
  });

  it("diffs endorsements by code-or-label identity", () => {
    const comparison: DiffablePolicy = {
      ...structuredClone(baseline),
      endorsements: [{ label: "Rental reimbursement" }],
    };
    const result = diffPolicies(baseline, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(findRow(result.value.rows, "endorsement", "roadside")).toMatchObject({
      inBaseline: true,
      inComparison: false,
      status: "different",
    });
    expect(
      findRow(result.value.rows, "endorsement", "Rental reimbursement"),
    ).toMatchObject({ inBaseline: false, inComparison: true, status: "different" });
  });

  it("diffs limitations by exact text identity", () => {
    const result = diffPolicies(baseline, structuredClone(baseline));

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(
      findRow(result.value.rows, "limitation", "Excludes racing use."),
    ).toMatchObject({ inBaseline: true, inComparison: true, status: "same" });
  });

  it("rejects duplicate coverage codes within a single policy as invalid", () => {
    const malformed: DiffablePolicy = {
      provenance: "entered",
      coverages: [
        { code: "liability", included: true },
        { code: "liability", included: false },
      ],
      endorsements: [],
      limitations: [],
    };
    const result = diffPolicies(malformed, baseline);
    expect(result.status).toBe("invalid");
  });

  it("rejects negative money as invalid", () => {
    const malformed: DiffablePolicy = {
      provenance: "entered",
      annualPremiumCents: -1,
      coverages: [],
      endorsements: [],
      limitations: [],
    };
    const result = diffPolicies(malformed, baseline);
    expect(result.status).toBe("invalid");
  });

  it("trace: records row counts for a known diff", () => {
    const comparison: DiffablePolicy = { ...structuredClone(baseline), annualPremiumCents: 175_000 };
    const result = diffPolicies(baseline, comparison);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("CMP-DIFF");
    expect(result.trace.steps[0].result).toBe(result.value.rows.length);
  });
});
