import { describe, expect, it } from "vitest";
import { createGlossaryLookupTool, LOOKUP_GLOSSARY_TERM_TOOL_NAME } from "@/ai/reference-tools";
import type { GlossaryTerm } from "@/schemas/glossary-term";

const SYNTHETIC_TERM: GlossaryTerm = {
  slug: "test-term",
  term: "Test Term",
  shortDef: "A short definition for tests only.",
  longDef: "A longer definition for tests only.",
  sourceIds: ["S-TEST-1"],
};

describe("createGlossaryLookupTool (docs/PRD.md AI-2, EDU-1)", () => {
  it("is named lookup_glossary_term and describes itself as read-only", () => {
    const tool = createGlossaryLookupTool([]);
    expect(tool.definition.name).toBe(LOOKUP_GLOSSARY_TERM_TOOL_NAME);
    expect(tool.definition.description).toMatch(/read-only/i);
  });

  it("reports not found against the real (currently empty) glossary — no content has reached V2 yet", () => {
    const tool = createGlossaryLookupTool();
    expect(tool.execute({ slug: "anything" })).toEqual({ found: false });
  });

  it("returns a term when injected data contains it (proves the wiring, independent of real content)", () => {
    const tool = createGlossaryLookupTool([SYNTHETIC_TERM]);
    expect(tool.execute({ slug: "test-term" })).toEqual({ found: true, data: SYNTHETIC_TERM });
  });

  it("reports not found for malformed input rather than throwing", () => {
    const tool = createGlossaryLookupTool([SYNTHETIC_TERM]);
    expect(tool.execute({})).toEqual({ found: false });
    expect(tool.execute(null)).toEqual({ found: false });
  });
});
