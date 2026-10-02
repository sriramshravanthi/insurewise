import { z } from "zod";

// docs/DATA-MODEL.md §3: "glossary_terms | slug, term, short_def, long_def,
// related, source_ids". PRD EDU-1: "Searchable glossary with sourced
// definitions and inline accessible tooltips."
export const GlossaryTermSchema = z.object({
  slug: z.string().min(1),
  term: z.string().min(1),
  shortDef: z.string().min(1),
  longDef: z.string().min(1),
  related: z.array(z.string()).optional(),
  sourceIds: z.array(z.string()).min(1),
});
export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;
