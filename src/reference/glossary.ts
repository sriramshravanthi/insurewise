import { GlossaryTermSchema, type GlossaryTerm } from "@/schemas/glossary-term";

// PRD EDU-1: "Searchable glossary with sourced definitions." Empty for the
// same reason as the other catalogs here — no term has a V2 source yet.
const RAW_GLOSSARY_TERMS: GlossaryTerm[] = [];

export const GLOSSARY_TERMS: GlossaryTerm[] = RAW_GLOSSARY_TERMS.map((term) =>
  GlossaryTermSchema.parse(term),
);

export function getGlossaryTerm(
  slug: string,
  terms: GlossaryTerm[] = GLOSSARY_TERMS,
): GlossaryTerm | null {
  return terms.find((term) => term.slug === slug) ?? null;
}

export function searchGlossary(query: string, terms: GlossaryTerm[] = GLOSSARY_TERMS): GlossaryTerm[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return terms.filter(
    (term) =>
      term.term.toLowerCase().includes(needle) || term.shortDef.toLowerCase().includes(needle),
  );
}
