import { describe, expect, it } from "vitest";
import { CoverageDefinitionSchema, type CoverageDefinition } from "@/schemas/coverage-definition";
import { COVERAGE_DEFINITIONS, getCoverageDefinition } from "@/reference/coverage-definitions";

const SYNTHETIC: CoverageDefinition = {
  code: "test_code",
  line: "auto",
  name: "Test Coverage",
  plainLanguage: "A plain-language definition for tests only.",
  sourceIds: ["S-TEST-1"],
};

describe("CoverageDefinitionSchema (docs/DATA-MODEL.md §3; PRD CAR-2/HOM-2)", () => {
  it("requires at least one source id", () => {
    expect(CoverageDefinitionSchema.safeParse({ ...SYNTHETIC, sourceIds: [] }).success).toBe(
      false,
    );
  });

  it("accepts a fully-formed definition", () => {
    expect(CoverageDefinitionSchema.safeParse(SYNTHETIC).success).toBe(true);
  });
});

describe("getCoverageDefinition", () => {
  it("ships with no definitions yet — nothing has reached docs/RESEARCH-SOURCES.md V2", () => {
    expect(COVERAGE_DEFINITIONS).toEqual([]);
    expect(getCoverageDefinition("liability", "auto")).toBeNull();
  });

  it("resolves a definition by code and line against injected data (proves the lookup itself)", () => {
    expect(getCoverageDefinition("test_code", "auto", [SYNTHETIC])).toEqual(SYNTHETIC);
    expect(getCoverageDefinition("test_code", "home", [SYNTHETIC])).toBeNull();
  });
});
