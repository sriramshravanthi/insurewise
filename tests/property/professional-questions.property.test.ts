import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { generateProfessionalQuestions } from "@/engine/professional-questions";
import type { CompiledFinding } from "@/engine/review-findings-compiler";
import type { DiffRow, DiffStatus } from "@/engine/policy-diff";

function findingWith(ruleId: string, questionTemplateId?: string): CompiledFinding {
  return {
    ruleId,
    finding: {
      triggered: true,
      inputsUsed: [],
      severity: "notice",
      messageTemplateId: `msg.${ruleId}`,
      questionTemplateId,
      sourceIds: ["S-DEMO-1"],
      parameters: {},
    },
  };
}

function moneyRowWith(coverageCode: string, status: DiffStatus): DiffRow {
  return {
    kind: "money",
    category: "coverage_deductible",
    coverageCode,
    label: `${coverageCode}: deductible`,
    baseline: { amount: 50_000, provenance: "entered" },
    comparison: { amount: 100_000, provenance: "entered" },
    status,
  };
}

describe("generateProfessionalQuestions (PRD EDU-4) properties", () => {
  it("emits exactly one question per finding that declares a questionTemplateId, none for those that don't", () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { maxLength: 8 }),
        (hasQuestionFlags) => {
          const findings = hasQuestionFlags.map((has, i) =>
            findingWith(`rule-${i}`, has ? `q.rule-${i}` : undefined),
          );
          const result = generateProfessionalQuestions(findings, [], {});

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const expectedCount = hasQuestionFlags.filter(Boolean).length;
          expect(result.value.questions).toHaveLength(expectedCount);
          expect(
            result.value.questions.every((q) => q.source === "finding"),
          ).toBe(true);
        },
      ),
    );
  });

  it("emits exactly one question per 'different' row whose category is mapped, none otherwise", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            coverageCode: fc.string({ minLength: 1, maxLength: 5 }).filter((s) => /^[a-z]+$/.test(s)),
            status: fc.constantFrom("same", "different", "not_comparable"),
            mapped: fc.boolean(),
          }),
          { maxLength: 8 },
        ),
        (entries) => {
          const rows = entries.map((e) => moneyRowWith(e.coverageCode, e.status));
          const mapping = entries.every((e) => e.mapped)
            ? { coverage_deductible: "q.different-deductible" }
            : {};
          const result = generateProfessionalQuestions([], rows, mapping);

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const expectedCount =
            Object.keys(mapping).length > 0
              ? entries.filter((e) => e.status === "different").length
              : 0;
          expect(result.value.questions).toHaveLength(expectedCount);
        },
      ),
    );
  });
});
