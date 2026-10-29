import {
  PolicyForComparisonSchema,
  type PolicyForComparison,
} from "@/schemas/policy-for-comparison";
import { invalid, ok, type Result } from "@/schemas/result";
import type { Trace } from "@/schemas/value";
import type { ComparabilityResult } from "./comparability-checks";
import { comparePolicies } from "./comparability-checks";
import { ENGINE_VERSION } from "./engine-version";
import type { PolicyDiffOutput } from "./policy-diff";
import { diffPolicies } from "./policy-diff";

const MIN_COMPARISONS = 1;
const MAX_COMPARISONS = 3;

export interface PolicySetComparisonItem {
  comparisonIndex: number;
  comparability: ComparabilityResult;
  /** Null exactly when comparability.comparable is false — nothing to diff. */
  diff: PolicyDiffOutput | null;
}

export interface PolicySetComparisonOutput {
  items: PolicySetComparisonItem[];
}

function toComparableView(policy: PolicyForComparison) {
  return {
    policyType: policy.policyType,
    termMonths: policy.termMonths,
    coverages: policy.coverages,
  };
}

function toDiffableView(policy: PolicyForComparison) {
  return {
    provenance: policy.provenance,
    annualPremiumCents: policy.annualPremiumCents,
    coverages: policy.coverages,
    endorsements: policy.endorsements,
    limitations: policy.limitations,
  };
}

export function comparePolicySet(
  baseline: PolicyForComparison,
  comparisons: PolicyForComparison[],
): Result<PolicySetComparisonOutput> {
  if (
    comparisons.length < MIN_COMPARISONS ||
    comparisons.length > MAX_COMPARISONS
  ) {
    return invalid([
      {
        field: "comparisons",
        code: "comparisons_out_of_range",
        message: `comparisons must contain between ${MIN_COMPARISONS} and ${MAX_COMPARISONS} policies (PRD CMP-1: "a baseline and up to three hypothetical policies").`,
      },
    ]);
  }

  const baselineParsed = PolicyForComparisonSchema.safeParse(baseline);
  if (!baselineParsed.success) {
    return invalid(
      baselineParsed.error.issues.map((issue) => ({
        field: `baseline.${issue.path.map(String).join(".") || "(root)"}`,
        code: "invalid_policy",
        message: issue.message,
      })),
    );
  }
  for (const [index, comparison] of comparisons.entries()) {
    const parsed = PolicyForComparisonSchema.safeParse(comparison);
    if (!parsed.success) {
      return invalid(
        parsed.error.issues.map((issue) => ({
          field: `comparisons[${index}].${issue.path.map(String).join(".") || "(root)"}`,
          code: "invalid_policy",
          message: issue.message,
        })),
      );
    }
  }

  const items: PolicySetComparisonItem[] = [];
  for (const [index, comparison] of comparisons.entries()) {
    const comparability = comparePolicies(
      toComparableView(baseline),
      toComparableView(comparison),
    );
    // A malformed policy is an input-quality bug, not a per-item condition
    // to route around — same posture as Features 20-23 toward invalid input.
    if (comparability.status !== "ok") return comparability;

    const diff = comparability.value.comparable
      ? diffPolicies(toDiffableView(baseline), toDiffableView(comparison))
      : null;
    if (diff !== null && diff.status !== "ok") return diff;

    items.push({
      comparisonIndex: index,
      comparability: comparability.value,
      diff: diff === null ? null : diff.value,
    });
  }

  const trace: Trace = {
    formulaId: "CMP-POLICY-SET",
    engineVersion: ENGINE_VERSION,
    inputs: [
      {
        key: "baseline.policyType",
        label: "Baseline policy type",
        value: baseline.policyType,
        provenance: "entered",
      },
      {
        key: "comparisons.length",
        label: "Number of comparison policies",
        value: comparisons.length,
        provenance: "entered",
      },
    ],
    steps: [
      {
        label: "Policies compared",
        expression: `${comparisons.length} comparison policy(ies)`,
        result: items.length,
      },
      {
        label: "Comparable (not blocked by DIFFERENT_POLICY_TYPE)",
        expression: "count(comparability.comparable)",
        result: items.filter((i) => i.comparability.comparable).length,
      },
    ],
    output: { itemCount: items.length },
    notes: [],
  };

  return ok({ items }, trace);
}
