import type { Fact, FactPacket } from "@/schemas/fact";

// PRD AI-2: "Uses only fact packets and read-only lookup tools; cites fact
// IDs." Reference-content lookup tools (glossary, coverage catalog) wait on
// the Insurance Reference/Content group, which hasn't shipped any reference
// accessors yet (src/reference is still empty). The one tool available now
// is scoped strictly to the fact packet already handed to the model, so it
// can never read anything beyond what docs/ARCHITECTURE.md §3 already
// allowed through ("the model can only read verified, structured facts" —
// Architectural Goal 3).

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema object, passed to the provider's tool-use API as-is. */
  inputSchema: Record<string, unknown>;
}

export type ToolExecutionResult = { found: true; fact: Fact } | { found: false };

export interface Tool {
  definition: ToolDefinition;
  execute(input: unknown): ToolExecutionResult;
}

export const LOOKUP_FACT_TOOL_NAME = "lookup_fact";

export function createFactLookupTool(factPacket: FactPacket): Tool {
  return {
    definition: {
      name: LOOKUP_FACT_TOOL_NAME,
      description:
        "Look up one fact from the fact packet by its id. Read-only: it can only return a fact already included in the fact packet, never any other data.",
      inputSchema: {
        type: "object",
        properties: { factId: { type: "string" } },
        required: ["factId"],
      },
    },
    execute(input: unknown): ToolExecutionResult {
      const factId =
        typeof input === "object" && input !== null && "factId" in input
          ? (input as { factId: unknown }).factId
          : undefined;
      if (typeof factId !== "string") return { found: false };
      const fact = factPacket.facts.find((f) => f.id === factId);
      return fact ? { found: true, fact } : { found: false };
    },
  };
}
