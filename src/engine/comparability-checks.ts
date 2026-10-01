import {
  ComparablePolicySchema,
  type ComparableCoverage,
  type ComparablePolicy,
} from "@/schemas/comparable-policy";
import { invalid, ok, type FieldError, type Result } from "@/schemas/result";
import type { Trace } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

// docs/CALCULATIONS.md §3: "Pure functions over normalized policies. Each
// returns a typed warning with the fields involved ... Warnings never imply
// which policy is preferable." Warnings are structural (type + field names)
// rather than prose, so there is no surface for ranking/winner language to
// appear in engine output at all — display wording is a future UI/
// message-template concern (CLAUDE.md rule 4; PRD CMP-4).
export type ComparabilityWarningType =
  | "DIFFERENT_POLICY_TYPE"
  | "DIFFERENT_TERM"
  | "COVERAGE_ONLY_IN_ONE"
  | "DIFFERENT_LIMIT"
  | "DIFFERENT_DEDUCTIBLE"
  | "DIFFERENT_VALUATION_BASIS"
  | "FIELD_NOT_ENTERED";

export interface ComparabilityWarning {
  type: ComparabilityWarningType;
  /** Present when the warning is specific to one coverage. */
  coverageCode?: string;
  /** The field(s) involved, so the UI can show "what this is based on". */
  fields: string[];
}

export interface ComparabilityResult {
  /** False only when DIFFERENT_POLICY_TYPE fires — comparison cannot proceed. */
  comparable: boolean;
  warnings: ComparabilityWarning[];
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

function findCoverage(
  coverages: ComparableCoverage[],
  code: string,
): ComparableCoverage | undefined {
  return coverages.find((c) => c.code === code);
}

function compareCoverage(
  code: string,
  baseline: ComparableCoverage | undefined,
  comparison: ComparableCoverage | undefined,
): ComparabilityWarning[] {
  const baselineIncluded = baseline?.included ?? false;
  const comparisonIncluded = comparison?.included ?? false;

  if (baselineIncluded !== comparisonIncluded) {
    return [
      { type: "COVERAGE_ONLY_IN_ONE", coverageCode: code, fields: ["included"] },
    ];
  }
  if (!baselineIncluded) return []; // excluded/absent on both sides: nothing to compare

  const warnings: ComparabilityWarning[] = [];

  // Both sides silent on a field is agreement, not missing information —
  // only an asymmetry (one entered, one not) is genuinely unknown.
  const limitFieldsNotEntered: string[] = [];
  const limitFieldsDifferent: string[] = [];
  for (const field of ["limitPrimaryCents", "limitSecondaryCents"] as const) {
    const b = baseline?.[field];
    const c = comparison?.[field];
    if (b === undefined && c === undefined) {
      // both silent: nothing to compare
    } else if (b === undefined || c === undefined) {
      limitFieldsNotEntered.push(field);
    } else if (b !== c) {
      limitFieldsDifferent.push(field);
    }
  }
  if (limitFieldsNotEntered.length > 0) {
    warnings.push({
      type: "FIELD_NOT_ENTERED",
      coverageCode: code,
      fields: limitFieldsNotEntered,
    });
  }
  if (limitFieldsDifferent.length > 0) {
    warnings.push({
      type: "DIFFERENT_LIMIT",
      coverageCode: code,
      fields: limitFieldsDifferent,
    });
  }

  const baselineDeductible = baseline?.deductibleCents;
  const comparisonDeductible = comparison?.deductibleCents;
  if (baselineDeductible === undefined && comparisonDeductible === undefined) {
    // both silent: nothing to compare
  } else if (baselineDeductible === undefined || comparisonDeductible === undefined) {
    warnings.push({
      type: "FIELD_NOT_ENTERED",
      coverageCode: code,
      fields: ["deductibleCents"],
    });
  } else if (baselineDeductible !== comparisonDeductible) {
    warnings.push({
      type: "DIFFERENT_DEDUCTIBLE",
      coverageCode: code,
      fields: ["deductibleCents"],
    });
  }

  const baselineValuation = baseline?.valuationBasis;
  const comparisonValuation = comparison?.valuationBasis;
  if (baselineValuation === undefined && comparisonValuation === undefined) {
    // both silent: nothing to compare
  } else if (baselineValuation === undefined || comparisonValuation === undefined) {
    warnings.push({
      type: "FIELD_NOT_ENTERED",
      coverageCode: code,
      fields: ["valuationBasis"],
    });
  } else if (baselineValuation !== comparisonValuation) {
    warnings.push({
      type: "DIFFERENT_VALUATION_BASIS",
      coverageCode: code,
      fields: ["valuationBasis"],
    });
  }

  return warnings;
}

export function comparePolicies(
  baseline: ComparablePolicy,
  comparison: ComparablePolicy,
): Result<ComparabilityResult> {
  const baselineParsed = ComparablePolicySchema.safeParse(baseline);
  const comparisonParsed = ComparablePolicySchema.safeParse(comparison);
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

  const warnings: ComparabilityWarning[] = [];

  if (baseline.policyType !== comparison.policyType) {
    warnings.push({ type: "DIFFERENT_POLICY_TYPE", fields: ["policyType"] });
    const trace: Trace = {
      formulaId: "CMP-COMPARABILITY",
      engineVersion: ENGINE_VERSION,
      inputs: [
        { key: "baseline.policyType", label: "Baseline policy type", value: baseline.policyType, provenance: "entered" },
        { key: "comparison.policyType", label: "Comparison policy type", value: comparison.policyType, provenance: "entered" },
      ],
      steps: [
        {
          label: "Policy type check",
          expression: `${baseline.policyType} !== ${comparison.policyType}`,
          result: "blocks comparison",
        },
      ],
      output: { comparable: false, warnings },
      notes: [
        "Comparing policies of different types is not meaningful; no further checks were run.",
      ],
    };
    return ok({ comparable: false, warnings }, trace);
  }

  if (baseline.termMonths === undefined && comparison.termMonths === undefined) {
    // both silent: nothing to compare
  } else if (baseline.termMonths === undefined || comparison.termMonths === undefined) {
    warnings.push({ type: "FIELD_NOT_ENTERED", fields: ["termMonths"] });
  } else if (baseline.termMonths !== comparison.termMonths) {
    warnings.push({ type: "DIFFERENT_TERM", fields: ["termMonths"] });
  }

  const codes = new Set([
    ...baseline.coverages.map((c) => c.code),
    ...comparison.coverages.map((c) => c.code),
  ]);
  for (const code of codes) {
    warnings.push(
      ...compareCoverage(
        code,
        findCoverage(baseline.coverages, code),
        findCoverage(comparison.coverages, code),
      ),
    );
  }

  const trace: Trace = {
    formulaId: "CMP-COMPARABILITY",
    engineVersion: ENGINE_VERSION,
    inputs: [
      { key: "baseline.policyType", label: "Baseline policy type", value: baseline.policyType, provenance: "entered" },
      { key: "comparison.policyType", label: "Comparison policy type", value: comparison.policyType, provenance: "entered" },
      { key: "baseline.termMonths", label: "Baseline term (months)", value: baseline.termMonths ?? "not entered", provenance: "entered" },
      { key: "comparison.termMonths", label: "Comparison term (months)", value: comparison.termMonths ?? "not entered", provenance: "entered" },
    ],
    steps: [
      {
        label: "Coverage-by-coverage comparison",
        expression: `${codes.size} coverage code(s) checked`,
        result: warnings.length,
      },
    ],
    output: { comparable: true, warnings },
    notes: [],
  };

  return ok({ comparable: true, warnings }, trace);
}
