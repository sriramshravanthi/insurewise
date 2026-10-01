import {
  ReviewRuleSchema,
  type Condition,
  type ReviewRule,
} from "@/schemas/review-rule";
import { insufficientData, invalid, ok, type FieldError, type Result } from "@/schemas/result";
import type { Trace, Value } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";

export interface RuleFinding {
  /** True when the rule's condition evaluated to true for these inputs. */
  triggered: boolean;
  /** The required inputs used, so the UI can show "what this is based on" (GAP-1). */
  inputsUsed: string[];
  severity: string;
  messageTemplateId: string;
  sourceIds: string[];
  /** The rule's own parameters, echoed back with their provenance label. */
  parameters: Record<string, Value<number>>;
}

function zodErrorsToFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): FieldError[] {
  return issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "(root)",
    code: "invalid_rule",
    message: issue.message,
  }));
}

function collectReferencedKeys(
  condition: Condition,
  inputKeys: Set<string>,
  parameterKeys: Set<string>,
): void {
  switch (condition.kind) {
    case "comparison":
      inputKeys.add(condition.inputKey);
      if (typeof condition.value !== "number") {
        parameterKeys.add(condition.value.parameterKey);
      }
      return;
    case "and":
    case "or":
      for (const c of condition.conditions) {
        collectReferencedKeys(c, inputKeys, parameterKeys);
      }
      return;
    case "not":
      collectReferencedKeys(condition.condition, inputKeys, parameterKeys);
  }
}

function evaluateCondition(
  condition: Condition,
  inputs: Record<string, number>,
  parameters: ReviewRule["parameters"],
): boolean {
  switch (condition.kind) {
    case "and":
      return condition.conditions.every((c) =>
        evaluateCondition(c, inputs, parameters),
      );
    case "or":
      return condition.conditions.some((c) =>
        evaluateCondition(c, inputs, parameters),
      );
    case "not":
      return !evaluateCondition(condition.condition, inputs, parameters);
    case "comparison": {
      const left = inputs[condition.inputKey];
      const right =
        typeof condition.value === "number"
          ? condition.value
          : parameters[condition.value.parameterKey].value;
      switch (condition.operator) {
        case "gt":
          return left > right;
        case "gte":
          return left >= right;
        case "lt":
          return left < right;
        case "lte":
          return left <= right;
        case "eq":
          return left === right;
        case "ne":
          return left !== right;
      }
    }
  }
}

export function evaluateReviewRule(
  rule: ReviewRule,
  inputs: Record<string, number>,
): Result<RuleFinding> {
  const parsed = ReviewRuleSchema.safeParse(rule);
  if (!parsed.success) {
    return invalid(zodErrorsToFieldErrors(parsed.error.issues));
  }

  const referencedInputKeys = new Set<string>();
  const referencedParameterKeys = new Set<string>();
  collectReferencedKeys(rule.condition, referencedInputKeys, referencedParameterKeys);

  for (const key of referencedInputKeys) {
    if (!rule.requiredInputs.includes(key)) {
      return invalid([
        {
          field: "condition",
          code: "input_not_declared",
          message: `condition references input "${key}", which is not listed in requiredInputs.`,
        },
      ]);
    }
  }
  for (const key of referencedParameterKeys) {
    if (!(key in rule.parameters)) {
      return invalid([
        {
          field: "condition",
          code: "parameter_not_declared",
          message: `condition references parameter "${key}", which is not declared in parameters.`,
        },
      ]);
    }
  }

  const missing = rule.requiredInputs.filter(
    (key) => inputs[key] === undefined || !Number.isFinite(inputs[key]),
  );
  // docs/CALCULATIONS.md §4 / PRD GAP-2: missing required input -> "not
  // enough information", mapped onto the engine's existing insufficient_data
  // status rather than inventing a parallel one.
  if (missing.length > 0) return insufficientData(missing);

  const triggered = evaluateCondition(rule.condition, inputs, rule.parameters);

  const parameterValues: Record<string, Value<number>> = Object.fromEntries(
    Object.entries(rule.parameters).map(([key, p]) => [
      key,
      { amount: p.value, provenance: p.provenance },
    ]),
  );

  const trace: Trace = {
    formulaId: "REVIEW-RULE",
    engineVersion: ENGINE_VERSION,
    inputs: rule.requiredInputs.map((key) => ({
      key,
      label: key,
      value: inputs[key],
      provenance: "entered",
    })),
    steps: [
      {
        label: `Evaluate rule "${rule.id}"`,
        expression: "condition(inputs, parameters)",
        result: triggered,
      },
    ],
    output: { triggered },
    notes: [],
  };

  return ok(
    {
      triggered,
      inputsUsed: rule.requiredInputs,
      severity: rule.severity,
      messageTemplateId: rule.messageTemplateId,
      sourceIds: rule.sourceIds,
      parameters: parameterValues,
    },
    trace,
  );
}
