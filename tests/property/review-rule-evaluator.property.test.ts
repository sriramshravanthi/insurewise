import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { evaluateReviewRule } from "@/engine/review-rule-evaluator";
import type {
  Condition,
  ConditionOperator,
  ReviewRule,
} from "@/schemas/review-rule";

function ruleWith(condition: Condition): ReviewRule {
  return {
    id: "property-test-rule",
    appliesTo: "both",
    requiredInputs: ["x", "y"],
    condition,
    severity: "notice",
    messageTemplateId: "msg.property-test",
    sourceIds: ["S-DEMO-1"],
    parameters: {},
  };
}

const operatorArb: fc.Arbitrary<ConditionOperator> = fc.constantFrom(
  "gt",
  "gte",
  "lt",
  "lte",
  "eq",
  "ne",
);

function applyOperator(op: ConditionOperator, left: number, right: number) {
  switch (op) {
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

describe("evaluateReviewRule (§4) properties", () => {
  it("a single comparison matches the operator's exact semantics for any inputs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        operatorArb,
        (x, threshold, operator) => {
          const rule = ruleWith({
            kind: "comparison",
            inputKey: "x",
            operator,
            value: threshold,
          });
          const result = evaluateReviewRule(
            { ...rule, requiredInputs: ["x"] },
            { x },
          );

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          expect(result.value.triggered).toBe(
            applyOperator(operator, x, threshold),
          );
        },
      ),
    );
  });

  it("NOT(A AND B) equals (NOT A) OR (NOT B) for any inputs (De Morgan)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        (x, y) => {
          const a: Condition = { kind: "comparison", inputKey: "x", operator: "gt", value: 0 };
          const b: Condition = { kind: "comparison", inputKey: "y", operator: "gt", value: 0 };

          const left = evaluateReviewRule(
            ruleWith({ kind: "not", condition: { kind: "and", conditions: [a, b] } }),
            { x, y },
          );
          const right = evaluateReviewRule(
            ruleWith({
              kind: "or",
              conditions: [
                { kind: "not", condition: a },
                { kind: "not", condition: b },
              ],
            }),
            { x, y },
          );

          expect(left.status).toBe("ok");
          expect(right.status).toBe("ok");
          if (left.status !== "ok" || right.status !== "ok") return;
          expect(left.value.triggered).toBe(right.value.triggered);
        },
      ),
    );
  });

  it("every missing required input is reported, regardless of condition complexity", () => {
    fc.assert(
      fc.property(
        fc.subarray(["x", "y", "z"], { minLength: 1 }),
        (missingKeys) => {
          const rule: ReviewRule = {
            ...ruleWith({ kind: "comparison", inputKey: "x", operator: "gt", value: 0 }),
            requiredInputs: ["x", "y", "z"],
          };
          const allInputs = { x: 1, y: 2, z: 3 };
          const providedInputs = Object.fromEntries(
            Object.entries(allInputs).filter(([key]) => !missingKeys.includes(key)),
          );

          const result = evaluateReviewRule(rule, providedInputs);
          expect(result).toEqual({
            status: "insufficient_data",
            missing: [...missingKeys],
          });
        },
      ),
    );
  });
});
