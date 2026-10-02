import { CoverageDefinitionSchema, type CoverageDefinition } from "@/schemas/coverage-definition";

// PRD CAR-2/HOM-2: plain-language coverage definitions, "linked to the
// coverage catalog." Empty for the same reason as reference-facts.ts: no
// coverage definition has a docs/RESEARCH-SOURCES.md V2 record yet
// (nothing in the §7 backlog's "Coverages A-F from a regulator or NAIC
// source" has been captured). CAR-2/HOM-2 already require "missing = 'Not
// entered,' never 'Not covered'" for the coverage itself; the UI applies
// that same not-yet-available posture to the definition text.
const RAW_COVERAGE_DEFINITIONS: CoverageDefinition[] = [];

export const COVERAGE_DEFINITIONS: CoverageDefinition[] = RAW_COVERAGE_DEFINITIONS.map(
  (definition) => CoverageDefinitionSchema.parse(definition),
);

export function getCoverageDefinition(
  code: string,
  line: CoverageDefinition["line"],
  definitions: CoverageDefinition[] = COVERAGE_DEFINITIONS,
): CoverageDefinition | null {
  return definitions.find((d) => d.code === code && d.line === line) ?? null;
}
