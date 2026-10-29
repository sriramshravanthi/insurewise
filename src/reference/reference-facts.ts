import { ReferenceFactSchema, type ReferenceFact } from "@/schemas/reference-fact";

// docs/RESEARCH-SOURCES.md line 7: "A fact may not appear in the product,
// the AI fact packets or the education copy unless it has a record here
// that reaches verification level V2." As of this registry's current
// state (docs/RESEARCH-SOURCES.md §9: "human V2 review pending" for every
// candidate — RF-CA-AUTO-001...006, RF-CA-HOME-001...007, all at V0/V1/
// WATCH), there is no V2 reference fact to ship. This stays empty, on
// purpose, until a fact actually clears V2 — it is never populated with a
// candidate's draft value just because the candidate exists in the
// registry (CLAUDE.md rule 1: never invent or prematurely surface a fact).
const RAW_REFERENCE_FACTS: ReferenceFact[] = [];

export const REFERENCE_FACTS: ReferenceFact[] = RAW_REFERENCE_FACTS.map((fact) =>
  ReferenceFactSchema.parse(fact),
);

/**
 * The only way the rest of the app may read a reference fact — filters to
 * level "v2" (docs/DATA-MODEL.md §3: "Only level V2 is exposed to the
 * app"), so a v0/v1/WATCH candidate can never reach the UI or the AI
 * fact packet even if one is added to REFERENCE_FACTS before it clears
 * verification.
 */
export function getVerifiedFact(
  jurisdiction: string,
  topic: string,
  facts: ReferenceFact[] = REFERENCE_FACTS,
): ReferenceFact | null {
  return (
    facts.find(
      (fact) => fact.jurisdiction === jurisdiction && fact.topic === topic && fact.level === "v2",
    ) ?? null
  );
}
