import { GLOSSARY_TERMS, getGlossaryTerm } from "@/reference/glossary";
import type { GlossaryTerm } from "@/schemas/glossary-term";
import type { Tool, ToolDefinition, ToolExecutionResult } from "./tools";

// PRD AI-2's "read-only lookup tools," backed by the reference layer
// (src/reference) built in this group, rather than the fact packet. Since
// no glossary term has cleared docs/RESEARCH-SOURCES.md V2 yet
// (GLOSSARY_TERMS is empty — src/reference/glossary.ts), this always
// reports not-found today; it starts returning real terms the moment
// verified content ships, with no code change needed here.

export const LOOKUP_GLOSSARY_TERM_TOOL_NAME = "lookup_glossary_term";

export function createGlossaryLookupTool(terms: GlossaryTerm[] = GLOSSARY_TERMS): Tool {
  const definition: ToolDefinition = {
    name: LOOKUP_GLOSSARY_TERM_TOOL_NAME,
    description:
      "Look up a sourced glossary definition by its slug. Read-only: it can only return a definition already verified at docs/RESEARCH-SOURCES.md level V2, never an invented or unverified one.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  };

  return {
    definition,
    execute(input: unknown): ToolExecutionResult {
      const slug =
        typeof input === "object" && input !== null && "slug" in input
          ? (input as { slug: unknown }).slug
          : undefined;
      if (typeof slug !== "string") return { found: false };
      const term = getGlossaryTerm(slug, terms);
      return term ? { found: true, data: term } : { found: false };
    },
  };
}
