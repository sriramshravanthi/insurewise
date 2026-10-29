import type { MoneyCents } from "@/schemas/money";
import {
  DiffablePolicySchema,
  type DiffablePolicy,
} from "@/schemas/diffable-policy";
import type { Provenance } from "@/schemas/provenance";
import { invalid, ok, type FieldError, type Result } from "@/schemas/result";
import type { Trace, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export type DiffStatus = "same" | "different" | "not_comparable";

export type MoneyDiffCategory =
  | "premium"
  | "coverage_limit_primary"
  | "coverage_limit_secondary"
  | "coverage_deductible";

export interface MoneyDiffRow {
  kind: "money";
  category: MoneyDiffCategory;
  coverageCode?: string;
  label: string;
  baseline: Value<MoneyCents> | null;
  comparison: Value<MoneyCents> | null;
  status: DiffStatus;
}

export type PresenceDiffCategory = "coverage_included" | "endorsement" | "limitation";

export interface PresenceDiffRow {
  kind: "presence";
  category: PresenceDiffCategory;
  /** Coverage code, endorsement code-or-label, or limitation text — the row's identity. */
  key: string;
  label: string;
  inBaseline: boolean;
  inComparison: boolean;
  status: "same" | "different";
}

export type DiffRow = MoneyDiffRow | PresenceDiffRow;

export interface PolicyDiffOutput {
  rows: DiffRow[];
}

function zodErrorsToFieldErrors(
  prefix: "baseline" | "comparison",
  issues: { path: PropertyKey[]; message: string }[],
): FieldError[] {
  return issues.map((issue) => ({
    field: `${prefix}.${issue.path.map(String).join(".") || "(root)"}`,
    code: "invalid_policy",
    message: issue.message,
  }));
}

function moneyRow(
  category: MoneyDiffCategory,
  label: string,
  baselineCents: MoneyCents | undefined,
  baselineProvenance: Provenance,
  comparisonCents: MoneyCents | undefined,
  comparisonProvenance: Provenance,
  coverageCode?: string,
): MoneyDiffRow | null {
  if (baselineCents === undefined && comparisonCents === undefined) {
    return null; // neither side entered it: nothing to show
  }
  const status: DiffStatus =
    baselineCents === undefined || comparisonCents === undefined
      ? "not_comparable"
      : baselineCents === comparisonCents
        ? "same"
        : "different";

  return {
    kind: "money",
    category,
    coverageCode,
    label,
    baseline:
      baselineCents === undefined
        ? null
        : { amount: baselineCents, provenance: baselineProvenance },
    comparison:
      comparisonCents === undefined
        ? null
        : { amount: comparisonCents, provenance: comparisonProvenance },
    status,
  };
}

function presenceRow(
  category: PresenceDiffCategory,
  key: string,
  inBaseline: boolean,
  inComparison: boolean,
): PresenceDiffRow {
  return {
    kind: "presence",
    category,
    key,
    label: key,
    inBaseline,
    inComparison,
    status: inBaseline === inComparison ? "same" : "different",
  };
}

export function diffPolicies(
  baseline: DiffablePolicy,
  comparison: DiffablePolicy,
): Result<PolicyDiffOutput> {
  const baselineParsed = DiffablePolicySchema.safeParse(baseline);
  const comparisonParsed = DiffablePolicySchema.safeParse(comparison);
  if (!baselineParsed.success || !comparisonParsed.success) {
    return invalid([
      ...(baselineParsed.success
        ? []
        : zodErrorsToFieldErrors("baseline", baselineParsed.error.issues)),
      ...(comparisonParsed.success
        ? []
        : zodErrorsToFieldErrors("comparison", comparisonParsed.error.issues)),
    ]);
  }

  const rows: DiffRow[] = [];

  const premiumRow = moneyRow(
    "premium",
    "Annual premium",
    baseline.annualPremiumCents,
    baseline.provenance,
    comparison.annualPremiumCents,
    comparison.provenance,
  );
  if (premiumRow) rows.push(premiumRow);

  const coverageCodes = new Set([
    ...baseline.coverages.map((c) => c.code),
    ...comparison.coverages.map((c) => c.code),
  ]);
  for (const code of coverageCodes) {
    const b = baseline.coverages.find((c) => c.code === code);
    const c = comparison.coverages.find((c2) => c2.code === code);
    const bIncluded = b?.included ?? false;
    const cIncluded = c?.included ?? false;

    rows.push(presenceRow("coverage_included", code, bIncluded, cIncluded));

    if (bIncluded && cIncluded) {
      const primary = moneyRow(
        "coverage_limit_primary",
        `${code}: limit (primary)`,
        b?.limitPrimaryCents,
        baseline.provenance,
        c?.limitPrimaryCents,
        comparison.provenance,
        code,
      );
      if (primary) rows.push(primary);

      const secondary = moneyRow(
        "coverage_limit_secondary",
        `${code}: limit (secondary)`,
        b?.limitSecondaryCents,
        baseline.provenance,
        c?.limitSecondaryCents,
        comparison.provenance,
        code,
      );
      if (secondary) rows.push(secondary);

      const deductible = moneyRow(
        "coverage_deductible",
        `${code}: deductible`,
        b?.deductibleCents,
        baseline.provenance,
        c?.deductibleCents,
        comparison.provenance,
        code,
      );
      if (deductible) rows.push(deductible);
    }
  }

  const endorsementKeys = new Set([
    ...baseline.endorsements.map((e) => e.code ?? e.label),
    ...comparison.endorsements.map((e) => e.code ?? e.label),
  ]);
  for (const key of endorsementKeys) {
    const inBaseline = baseline.endorsements.some((e) => (e.code ?? e.label) === key);
    const inComparison = comparison.endorsements.some(
      (e) => (e.code ?? e.label) === key,
    );
    rows.push(presenceRow("endorsement", key, inBaseline, inComparison));
  }

  const limitationKeys = new Set([
    ...baseline.limitations.map((l) => l.text),
    ...comparison.limitations.map((l) => l.text),
  ]);
  for (const key of limitationKeys) {
    const inBaseline = baseline.limitations.some((l) => l.text === key);
    const inComparison = comparison.limitations.some((l) => l.text === key);
    rows.push(presenceRow("limitation", key, inBaseline, inComparison));
  }

  const trace: Trace = {
    formulaId: "CMP-DIFF",
    engineVersion: ENGINE_VERSION,
    inputs: [
      {
        key: "baseline.provenance",
        label: "Baseline provenance",
        value: baseline.provenance,
        provenance: "entered",
      },
      {
        key: "comparison.provenance",
        label: "Comparison provenance",
        value: comparison.provenance,
        provenance: "entered",
      },
    ],
    steps: [
      { label: "Rows produced", expression: "count(rows)", result: rows.length },
      {
        label: "Rows differing",
        expression: 'count(status === "different")',
        result: rows.filter((r) => r.status === "different").length,
      },
    ],
    output: { rowCount: rows.length },
    notes: [],
  };

  return ok({ rows }, trace);
}
