import { findLanguagePolicyViolations } from "@/schemas/language-policy";
import { AssistantOutputSchema, type AssistantOutput } from "@/schemas/assistant-output";
import type { FactPacket } from "@/schemas/fact";

// PRD AI-4: "Output validator: schema, citation presence, numeric
// grounding, language policy; regenerate once then safe fallback." This
// file is the full check; src/ai/explain.ts owns the retry/fallback.

export type ValidationResult =
  | { status: "ok"; output: AssistantOutput }
  | { status: "invalid"; reason: "not_json" | "schema" | "no_citation" | "unknown_fact_id" | "ungrounded_number" | "language_policy" };

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

export function validateAssistantOutput(
  rawText: string,
  factPacket: FactPacket,
): ValidationResult {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return { status: "invalid", reason: "not_json" };
  }

  const parsed = AssistantOutputSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { status: "invalid", reason: "schema" };
  }
  const output = parsed.data;

  // Citation presence (PRD AI-2): every claim must be backed by a fact id,
  // unless the model is explicitly saying the facts don't cover the
  // question (PRD AI-3) rather than making an uncited claim.
  if (!output.insufficientData && output.citedFactIds.length === 0) {
    return { status: "invalid", reason: "no_citation" };
  }

  const factIds = new Set(factPacket.facts.map((fact) => fact.id));
  for (const citedId of output.citedFactIds) {
    if (!factIds.has(citedId)) {
      return { status: "invalid", reason: "unknown_fact_id" };
    }
  }

  // Numeric grounding: every number in the answer must trace back to a
  // number actually in the fact packet — never a hallucinated figure.
  const factNumbers = new Set(
    factPacket.facts
      .filter((fact): fact is typeof fact & { value: number } => typeof fact.value === "number")
      .map((fact) => fact.value),
  );
  for (const number of extractNumbers(output.answer)) {
    if (!factNumbers.has(number)) {
      return { status: "invalid", reason: "ungrounded_number" };
    }
  }

  // Language policy (PRD INT-6): the same lint that already guards UI copy.
  if (findLanguagePolicyViolations(output.answer).length > 0) {
    return { status: "invalid", reason: "language_policy" };
  }

  return { status: "ok", output };
}
