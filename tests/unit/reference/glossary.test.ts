import { describe, expect, it } from "vitest";
import { GlossaryTermSchema, type GlossaryTerm } from "@/schemas/glossary-term";
import { GLOSSARY_TERMS, getGlossaryTerm, searchGlossary } from "@/reference/glossary";

const SYNTHETIC: GlossaryTerm = {
  slug: "test-term",
  term: "Test Term",
  shortDef: "A short test definition.",
  longDef: "A longer test definition.",
  sourceIds: ["S-TEST-1"],
};

describe("GlossaryTermSchema (PRD EDU-1)", () => {
  it("requires at least one source id", () => {
    expect(GlossaryTermSchema.safeParse({ ...SYNTHETIC, sourceIds: [] }).success).toBe(false);
  });
});

describe("glossary accessors", () => {
  it("ships with no terms yet — nothing has reached docs/RESEARCH-SOURCES.md V2", () => {
    expect(GLOSSARY_TERMS).toEqual([]);
    expect(getGlossaryTerm("test-term")).toBeNull();
    expect(searchGlossary("test")).toEqual([]);
  });

  it("resolves and searches against injected data", () => {
    expect(getGlossaryTerm("test-term", [SYNTHETIC])).toEqual(SYNTHETIC);
    expect(searchGlossary("Test Term", [SYNTHETIC])).toEqual([SYNTHETIC]);
    expect(searchGlossary("nothing matches", [SYNTHETIC])).toEqual([]);
  });

  it("returns nothing for an empty query rather than the whole list", () => {
    expect(searchGlossary("", [SYNTHETIC])).toEqual([]);
  });
});
