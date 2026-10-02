import { describe, expect, it } from "vitest";
import { SOURCES } from "@/reference/sources";
import { REFERENCE_FACTS } from "@/reference/reference-facts";
import { COVERAGE_DEFINITIONS } from "@/reference/coverage-definitions";
import { GLOSSARY_TERMS } from "@/reference/glossary";
import { RATING_FACTORS } from "@/reference/rating-factors";
import { CHECKLIST_ITEMS } from "@/reference/checklist-items";

// CLAUDE.md quality gate: "New Reference record -> source ID, effective
// date, verified_at (CI fails otherwise)." Every content array's Zod
// schema already requires sourceIds to be non-empty; this test is the
// referential-integrity half — every id named must resolve to a real
// docs/RESEARCH-SOURCES.md entry. All five arrays ship empty today (see
// each module's own comment for why), so this currently passes vacuously —
// but it will start failing the moment a record cites a source id that
// doesn't exist, which is the whole point of having it in place now.
const SOURCE_IDS = new Set(SOURCES.map((s) => s.id));

function expectSourcesResolve(label: string, records: { sourceIds: string[] }[]) {
  for (const record of records) {
    for (const sourceId of record.sourceIds) {
      expect(SOURCE_IDS.has(sourceId), `${label} cites unknown source "${sourceId}"`).toBe(true);
    }
  }
}

describe("reference content cites only real sources", () => {
  it("reference facts", () => expectSourcesResolve("reference fact", REFERENCE_FACTS));
  it("coverage definitions", () => expectSourcesResolve("coverage definition", COVERAGE_DEFINITIONS));
  it("glossary terms", () => expectSourcesResolve("glossary term", GLOSSARY_TERMS));
  it("rating factors", () => expectSourcesResolve("rating factor", RATING_FACTORS));
  it("checklist items", () => expectSourcesResolve("checklist item", CHECKLIST_ITEMS));
});
