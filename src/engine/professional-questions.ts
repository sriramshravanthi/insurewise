import type { CompiledFinding } from "./review-findings-compiler";
import { ok, type Result } from "@/schemas/result";
import type { Trace } from "@/schemas/value";
import { ENGINE_VERSION } from "./engine-version";
import type { DiffRow } from "./policy-diff";

export type ProfessionalQuestionSource = "finding" | "difference";

export interface ProfessionalQuestion {
  source: ProfessionalQuestionSource;
  questionTemplateId: string;
  /** The rule id (finding-sourced) or diff row identity (difference-sourced). */
  reference: string;
}

/** Diff row category -> question template id. Content-authoring data, not an engine constant. */
export type DiffQuestionMapping = Partial<Record<DiffRow["category"], string>>;

export interface ProfessionalQuestionsOutput {
  questions: ProfessionalQuestion[];
}

function diffRowIdentity(row: DiffRow): string {
  return row.kind === "presence" ? row.key : row.coverageCode ?? row.category;
}

// PRD EDU-4: "'Questions to ask a professional' generated from templates
// tied to findings and differences." Output is always an opaque template
// reference, never rendered prose (GAP-3: templates, never LLM-written).
export function generateProfessionalQuestions(
  findings: CompiledFinding[],
  diffRows: DiffRow[],
  diffQuestionMapping: DiffQuestionMapping,
): Result<ProfessionalQuestionsOutput> {
  const questions: ProfessionalQuestion[] = [];

  for (const { ruleId, finding } of findings) {
    if (finding.questionTemplateId) {
      questions.push({
        source: "finding",
        questionTemplateId: finding.questionTemplateId,
        reference: ruleId,
      });
    }
  }

  for (const row of diffRows) {
    if (row.status !== "different") continue;
    const questionTemplateId = diffQuestionMapping[row.category];
    if (!questionTemplateId) continue; // no mapped question for this category: skip, not an error
    questions.push({
      source: "difference",
      questionTemplateId,
      reference: diffRowIdentity(row),
    });
  }

  const trace: Trace = {
    formulaId: "EDU-PROFESSIONAL-QUESTIONS",
    engineVersion: ENGINE_VERSION,
    inputs: [
      { key: "findings.length", label: "Findings considered", value: findings.length, provenance: "entered" },
      { key: "diffRows.length", label: "Diff rows considered", value: diffRows.length, provenance: "entered" },
    ],
    steps: [
      {
        label: "Questions generated",
        expression: "count(finding.questionTemplateId) + count(different rows with a mapped question)",
        result: questions.length,
      },
    ],
    output: { questionCount: questions.length },
    notes: [],
  };

  return ok({ questions }, trace);
}
