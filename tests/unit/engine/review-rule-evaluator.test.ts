import { describe, expect, it } from "vitest";
import { evaluateReviewRule } from "@/engine/review-rule-evaluator";
import type { ReviewRule } from "@/schemas/review-rule";

const thresholdRule: ReviewRule = {
  id: "high-coverage-to-value-ratio",
  appliesTo: "car",
  requiredInputs: ["coverageToValueRatioPct"],
  condition: {
    kind: "comparison",
    inputKey: "coverageToValueRatioPct",
    operator: "gt",
    value: { parameterKey: "thresholdPct" },
  },
  severity: "notice",
  messageTemplateId: "msg.high-coverage-to-value-ratio",
  sourceIds: ["S-DEMO-1"],
  parameters: {
    thresholdPct: {
      value: 10,
      provenance: "illustrative",
      rationale: "A round, clearly-labeled starting point pending research.",
    },
  },
};

describe("evaluateReviewRule (§4 review-rule evaluation)", () => {
  it("echoes questionTemplateId through when the rule declares one (PRD EDU-4)", () => {
    const rule: ReviewRule = { ...thresholdRule, questionTemplateId: "q.high-ratio" };
    const result = evaluateReviewRule(rule, { coverageToValueRatioPct: 15 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questionTemplateId).toBe("q.high-ratio");
  });

  it("leaves questionTemplateId undefined when the rule does not declare one", () => {
    const result = evaluateReviewRule(thresholdRule, {
      coverageToValueRatioPct: 15,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questionTemplateId).toBeUndefined();
  });

  it("triggers a finding when the condition is true", () => {
    const result = evaluateReviewRule(thresholdRule, {
      coverageToValueRatioPct: 15,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.triggered).toBe(true);
    expect(result.value.inputsUsed).toEqual(["coverageToValueRatioPct"]);
    expect(result.value.severity).toBe("notice");
    expect(result.value.messageTemplateId).toBe("msg.high-coverage-to-value-ratio");
    expect(result.value.sourceIds).toEqual(["S-DEMO-1"]);
    expect(result.value.parameters.thresholdPct).toEqual({
      amount: 10,
      provenance: "illustrative",
    });
  });

  it("does not trigger when the condition is false, but still evaluates ok", () => {
    const result = evaluateReviewRule(thresholdRule, {
      coverageToValueRatioPct: 5,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.triggered).toBe(false);
  });

  it('reports "not enough information" (insufficient_data) when a required input is missing (PRD GAP-2)', () => {
    const result = evaluateReviewRule(thresholdRule, {});

    expect(result).toEqual({
      status: "insufficient_data",
      missing: ["coverageToValueRatioPct"],
    });
  });

  it("lists every missing required input when a rule needs more than one", () => {
    const rule: ReviewRule = {
      ...thresholdRule,
      requiredInputs: ["a", "b"],
      condition: { kind: "comparison", inputKey: "a", operator: "gt", value: 0 },
    };
    const result = evaluateReviewRule(rule, { a: 1 });

    expect(result).toEqual({ status: "insufficient_data", missing: ["b"] });
  });

  it("evaluates AND/OR/NOT composite conditions correctly", () => {
    const rule: ReviewRule = {
      ...thresholdRule,
      requiredInputs: ["a", "b"],
      condition: {
        kind: "and",
        conditions: [
          { kind: "comparison", inputKey: "a", operator: "gt", value: 0 },
          {
            kind: "or",
            conditions: [
              { kind: "comparison", inputKey: "b", operator: "eq", value: 1 },
              {
                kind: "not",
                condition: { kind: "comparison", inputKey: "b", operator: "eq", value: 2 },
              },
            ],
          },
        ],
      },
      parameters: {},
    };

    expect(evaluateReviewRule(rule, { a: 1, b: 1 })).toMatchObject({
      status: "ok",
      value: { triggered: true },
    });
    expect(evaluateReviewRule(rule, { a: -1, b: 1 })).toMatchObject({
      status: "ok",
      value: { triggered: false },
    });
  });

  it("compares against a literal value when the condition does not reference a parameter", () => {
    const rule: ReviewRule = {
      ...thresholdRule,
      condition: {
        kind: "comparison",
        inputKey: "coverageToValueRatioPct",
        operator: "gte",
        value: 10,
      },
      parameters: {},
    };

    const result = evaluateReviewRule(rule, { coverageToValueRatioPct: 10 });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.triggered).toBe(true);
  });

  it("rejects a condition that references an input not listed in requiredInputs", () => {
    const rule: ReviewRule = {
      ...thresholdRule,
      condition: {
        kind: "comparison",
        inputKey: "somethingElse",
        operator: "gt",
        value: 0,
      },
    };

    const result = evaluateReviewRule(rule, { coverageToValueRatioPct: 15 });
    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.errors[0].code).toBe("input_not_declared");
  });

  it("rejects a condition that references a parameter not declared in parameters", () => {
    const rule: ReviewRule = {
      ...thresholdRule,
      condition: {
        kind: "comparison",
        inputKey: "coverageToValueRatioPct",
        operator: "gt",
        value: { parameterKey: "doesNotExist" },
      },
    };

    const result = evaluateReviewRule(rule, { coverageToValueRatioPct: 15 });
    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.errors[0].code).toBe("parameter_not_declared");
  });

  it("rejects an Illustrative parameter with no rationale (docs/CALCULATIONS.md §4)", () => {
    const rule: ReviewRule = {
      ...thresholdRule,
      parameters: {
        thresholdPct: { value: 10, provenance: "illustrative" },
      },
    };

    const result = evaluateReviewRule(rule, { coverageToValueRatioPct: 15 });
    expect(result.status).toBe("invalid");
  });

  it("accepts a Calculated or Entered parameter with no rationale", () => {
    const rule: ReviewRule = {
      ...thresholdRule,
      parameters: {
        thresholdPct: { value: 10, provenance: "entered" },
      },
    };

    const result = evaluateReviewRule(rule, { coverageToValueRatioPct: 15 });
    expect(result.status).toBe("ok");
  });

  it("rejects a rule with no sourceIds", () => {
    const rule: ReviewRule = { ...thresholdRule, sourceIds: [] };
    const result = evaluateReviewRule(rule, { coverageToValueRatioPct: 15 });
    expect(result.status).toBe("invalid");
  });

  it("rejects a rule with no requiredInputs", () => {
    const rule: ReviewRule = { ...thresholdRule, requiredInputs: [] };
    const result = evaluateReviewRule(rule, { coverageToValueRatioPct: 15 });
    expect(result.status).toBe("invalid");
  });

  it("treats a non-finite input value (e.g. NaN) the same as a missing one", () => {
    const result = evaluateReviewRule(thresholdRule, {
      coverageToValueRatioPct: NaN,
    });
    expect(result).toEqual({
      status: "insufficient_data",
      missing: ["coverageToValueRatioPct"],
    });
  });

  it("trace: identifies the rule and reproduces the triggered result", () => {
    const result = evaluateReviewRule(thresholdRule, {
      coverageToValueRatioPct: 15,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("REVIEW-RULE");
    expect(result.trace.steps[0].result).toBe(result.value.triggered);
    expect(result.trace.inputs[0].value).toBe(15);
  });
});
