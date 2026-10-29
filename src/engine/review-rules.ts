/**
 * Review-rule evaluation engine.
 * Rules are defined externally and evaluated here.
 * Never implies which option is preferable.
 */

export type RuleSeverity = "Info" | "Warning";

export interface ReviewRule<TInputs extends Record<string, unknown>> {
  id: string;
  appliesTo: "car" | "home" | "both";
  requiredInputs: (keyof TInputs)[];
  condition: (inputs: TInputs, parameters: Record<string, unknown>) => boolean;
  severity: RuleSeverity;
  messageTemplateId: string;
  sourceIds: string[];
  parameters: Record<string, unknown>; // Illustrative thresholds labeled as such
}

export type ReviewRuleResult =
  | { status: "triggered"; ruleId: string; severity: RuleSeverity; messageTemplateId: string; inputsUsed: Record<string, unknown> }
  | { status: "not_triggered"; ruleId: string }
  | { status: "not_enough_information"; ruleId: string; missing: string[] };

export function evaluateReviewRule<TInputs extends Record<string, unknown>>(
  rule: ReviewRule<TInputs>,
  inputs: Partial<TInputs>
): ReviewRuleResult {
  // Check required inputs
  const missing = rule.requiredInputs.filter(
    (k) => inputs[k] === undefined || inputs[k] === null
  ) as string[];

  if (missing.length > 0) {
    return { status: "not_enough_information", ruleId: rule.id, missing };
  }

  const fullInputs = inputs as TInputs;
  const triggered = rule.condition(fullInputs, rule.parameters);

  if (triggered) {
    const inputsUsed: Record<string, unknown> = {};
    for (const k of rule.requiredInputs) {
      inputsUsed[k as string] = fullInputs[k];
    }
    return {
      status: "triggered",
      ruleId: rule.id,
      severity: rule.severity,
      messageTemplateId: rule.messageTemplateId,
      inputsUsed,
    };
  }

  return { status: "not_triggered", ruleId: rule.id };
}

export function evaluateAllRules<TInputs extends Record<string, unknown>>(
  rules: ReviewRule<TInputs>[],
  inputs: Partial<TInputs>
): ReviewRuleResult[] {
  return rules.map((rule) => evaluateReviewRule(rule, inputs));
}
