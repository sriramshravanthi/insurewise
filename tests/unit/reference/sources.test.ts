import { describe, expect, it } from "vitest";
import { SOURCES, getSource } from "@/reference/sources";
import { SourceSchema } from "@/schemas/source";

describe("SOURCES (docs/RESEARCH-SOURCES.md §3)", () => {
  it("every source validates against SourceSchema", () => {
    for (const source of SOURCES) {
      expect(SourceSchema.safeParse(source).success).toBe(true);
    }
  });

  it("has no duplicate ids", () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes S-001 through S-009, matching the registry's current count", () => {
    expect(SOURCES).toHaveLength(9);
  });

  it("getSource resolves a known id and returns null for an unknown one", () => {
    expect(getSource("S-001")?.title).toMatch(/Bulletin 2023-1/);
    expect(getSource("S-999")).toBeNull();
  });
});
