import { describe, expect, it } from "vitest";
import { generateProfessionalQuestions } from "@/engine/professional-questions";
import type { CompiledFinding } from "@/engine/review-findings-compiler";
import type { DiffRow } from "@/engine/policy-diff";
import type { RuleFinding } from "@/engine/review-rule-evaluator";

function finding(ruleId: string, overrides: Partial<RuleFinding> = {}): CompiledFinding {
  return {
    ruleId,
    finding: {
      triggered: true,
      inputsUsed: [],
      severity: "notice",
      messageTemplateId: `msg.${ruleId}`,
      sourceIds: ["S-DEMO-1"],
      parameters: {},
      ...overrides,
    },
  };
}

const differentDeductibleRow: DiffRow = {
  kind: "money",
  category: "coverage_deductible",
  coverageCode: "collision",
  label: "collision: deductible",
  baseline: { amount: 50_000, provenance: "entered" },
  comparison: { amount: 100_000, provenance: "entered" },
  status: "different",
};

const sameLimitRow: DiffRow = {
  kind: "money",
  category: "coverage_limit_primary",
  coverageCode: "liability",
  label: "liability: limit (primary)",
  baseline: { amount: 3_000_000, provenance: "entered" },
  comparison: { amount: 3_000_000, provenance: "entered" },
  status: "same",
};

describe("generateProfessionalQuestions (PRD EDU-4)", () => {
  it("emits a question for a finding that carries a questionTemplateId", () => {
    const result = generateProfessionalQuestions(
      [finding("high-ratio", { questionTemplateId: "q.high-ratio" })],
      [],
      {},
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions).toEqual([
      { source: "finding", questionTemplateId: "q.high-ratio", reference: "high-ratio" },
    ]);
  });

  it("emits no question for a finding with no questionTemplateId", () => {
    const result = generateProfessionalQuestions([finding("no-question-rule")], [], {});

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions).toEqual([]);
  });

  it("emits a question for a 'different' diff row whose category is mapped", () => {
    const result = generateProfessionalQuestions(
      [],
      [differentDeductibleRow],
      { coverage_deductible: "q.different-deductible" },
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions).toEqual([
      {
        source: "difference",
        questionTemplateId: "q.different-deductible",
        reference: "collision",
      },
    ]);
  });

  it("skips a 'different' diff row whose category has no mapped question (not an error)", () => {
    const result = generateProfessionalQuestions([], [differentDeductibleRow], {});

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions).toEqual([]);
  });

  it("skips a diff row that is not 'different', even if its category is mapped", () => {
    const result = generateProfessionalQuestions(
      [],
      [sameLimitRow],
      { coverage_limit_primary: "q.different-limit" },
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions).toEqual([]);
  });

  it("does not deduplicate repeated template ids across distinct references", () => {
    const rowA: DiffRow = { ...differentDeductibleRow, coverageCode: "collision" };
    const rowB: DiffRow = { ...differentDeductibleRow, coverageCode: "comprehensive" };
    const result = generateProfessionalQuestions(
      [],
      [rowA, rowB],
      { coverage_deductible: "q.different-deductible" },
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions).toEqual([
      { source: "difference", questionTemplateId: "q.different-deductible", reference: "collision" },
      { source: "difference", questionTemplateId: "q.different-deductible", reference: "comprehensive" },
    ]);
  });

  it("combines finding-sourced and difference-sourced questions", () => {
    const result = generateProfessionalQuestions(
      [finding("high-ratio", { questionTemplateId: "q.high-ratio" })],
      [differentDeductibleRow],
      { coverage_deductible: "q.different-deductible" },
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions).toHaveLength(2);
    expect(result.value.questions.map((q) => q.source).sort()).toEqual([
      "difference",
      "finding",
    ]);
  });

  it("uses a presence row's key as its reference", () => {
    const presenceRow: DiffRow = {
      kind: "presence",
      category: "endorsement",
      key: "roadside",
      label: "roadside",
      inBaseline: true,
      inComparison: false,
      status: "different",
    };
    const result = generateProfessionalQuestions(
      [],
      [presenceRow],
      { endorsement: "q.endorsement-only-in-one" },
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions[0].reference).toBe("roadside");
  });

  it("trace: records the number of questions generated", () => {
    const result = generateProfessionalQuestions(
      [finding("high-ratio", { questionTemplateId: "q.high-ratio" })],
      [differentDeductibleRow],
      { coverage_deductible: "q.different-deductible" },
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("EDU-PROFESSIONAL-QUESTIONS");
    expect(result.trace.steps[0].result).toBe(result.value.questions.length);
  });

  it("returns an empty, valid result when there is nothing to ask about", () => {
    const result = generateProfessionalQuestions([], [], {});

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.questions).toEqual([]);
  });
});
