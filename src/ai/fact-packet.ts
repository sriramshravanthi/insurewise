import { FactPacketSchema, type Fact, type FactPacket } from "@/schemas/fact";
import type { ReviewFindingsResult } from "@/engine/review-findings-compiler";

/**
 * The one way a FactPacket gets built. `insufficientData` is derived, never
 * passed in, so a caller cannot claim facts exist when the list is empty
 * (docs/ARCHITECTURE.md §3: "Nothing flows to the AI that did not pass
 * through this path").
 */
export function buildFactPacket(facts: Fact[]): FactPacket {
  return FactPacketSchema.parse({ facts, insufficientData: facts.length === 0 });
}

/**
 * Converts an already-computed ReviewFindingsResult (src/engine/review-
 * findings-compiler.ts) into Facts — restructuring values the engine
 * already produced, never introducing new ones (CLAUDE.md rule 1).
 */
export function reviewFindingsToFacts(result: ReviewFindingsResult): Fact[] {
  const facts: Fact[] = [];

  for (const { ruleId, finding } of result.findings) {
    facts.push({
      id: `${ruleId}.triggered`,
      label: `Review item triggered: ${ruleId}`,
      value: true,
      provenance: "calculated",
    });
    for (const [key, value] of Object.entries(finding.parameters)) {
      facts.push({
        id: `${ruleId}.${key}`,
        label: `${ruleId} parameter: ${key}`,
        value: value.amount,
        unit: "%",
        provenance: value.provenance,
        sourceId: finding.sourceIds[0],
      });
    }
  }

  for (const item of result.notEnoughInformation) {
    facts.push({
      id: `${item.ruleId}.not_enough_information`,
      label: `Not enough information for rule: ${item.ruleId}`,
      value: true,
      provenance: "calculated",
    });
  }

  return facts;
}
