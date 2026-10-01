import type { ReviewRule } from "@/schemas/review-rule";
import { ok, type Result } from "@/schemas/result";
import type { Trace } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";
import { evaluateReviewRule, type RuleFinding } from "./review-rule-evaluator";

export interface CompiledFinding {
  ruleId: string;
  finding: RuleFinding;
}

export interface NotEnoughInformationItem {
  ruleId: string;
  missing: string[];
}

export interface ReviewFindingsResult {
  /** The "review items" to show (PRD GAP-1) — only rules that triggered. */
  findings: CompiledFinding[];
  /** Rules skipped for missing data (PRD GAP-2: "Not enough information"). */
  notEnoughInformation: NotEnoughInformationItem[];
}

export function compileReviewFindings(
  rules: ReviewRule[],
  inputs: Record<string, number>,
): Result<ReviewFindingsResult> {
  const findings: CompiledFinding[] = [];
  const notEnoughInformation: NotEnoughInformationItem[] = [];

  for (const rule of rules) {
    const result = evaluateReviewRule(rule, inputs);
    // A malformed rule is an authoring/content bug, not a per-item condition
    // to route around — same posture as every other engine function toward
    // impossible input.
    if (result.status === "invalid") return result;
    if (result.status === "insufficient_data") {
      notEnoughInformation.push({ ruleId: rule.id, missing: result.missing });
      continue;
    }
    if (result.value.triggered) {
      findings.push({ ruleId: rule.id, finding: result.value });
    }
    // else: evaluated fine, condition false -> nothing to show, dropped.
  }

  const trace: Trace = {
    formulaId: "REVIEW-FINDINGS-COMPILER",
    engineVersion: ENGINE_VERSION,
    inputs: rules.map((rule) => ({
      key: rule.id,
      label: `Rule: ${rule.id}`,
      value: "evaluated",
      provenance: "entered",
    })),
    steps: [
      { label: "Rules evaluated", expression: `${rules.length} rule(s)`, result: rules.length },
      { label: "Findings triggered", expression: "count(triggered)", result: findings.length },
      {
        label: "Not enough information",
        expression: "count(insufficient_data)",
        result: notEnoughInformation.length,
      },
    ],
    output: {
      findingsCount: findings.length,
      notEnoughInformationCount: notEnoughInformation.length,
    },
    notes:
      findings.length === 0
        ? [
            "No review items were triggered. This does not imply the coverage is adequate.",
          ]
        : [],
  };

  return ok({ findings, notEnoughInformation }, trace);
}
