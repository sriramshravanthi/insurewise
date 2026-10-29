import { z } from "zod";

// docs/DATA-MODEL.md §3: "coverage_definitions | code, line, name,
// plain_language, example, common_limitations (JSONB), source_ids |
// Canonical catalog." PRD CAR-2/HOM-2: plain-language definitions linked
// from the coverage breakdown. sourceIds is required (min 1) so a
// definition structurally cannot exist without a citation (CLAUDE.md
// quality gate: "New Reference record -> source ID... CI fails otherwise").
export const CoverageDefinitionSchema = z.object({
  code: z.string().min(1),
  line: z.enum(["auto", "home"]),
  name: z.string().min(1),
  plainLanguage: z.string().min(1),
  example: z.string().optional(),
  commonLimitations: z.array(z.string()).optional(),
  sourceIds: z.array(z.string()).min(1),
});
export type CoverageDefinition = z.infer<typeof CoverageDefinitionSchema>;
