import type { FactPacket } from "@/schemas/fact";

// PRD AI-2: "Uses only fact packets and read-only lookup tools; cites fact
// IDs." Every tool here is read-only and scoped to data that already
// passed through docs/ARCHITECTURE.md §3's path ("the model can only read
// verified, structured facts" — Architectural Goal 3) — lookup_fact is
// scoped to the fact packet handed in for this question; reference-backed
// tools (src/ai/reference-tools.ts) are scoped to whatever has actually
// cleared docs/RESEARCH-SOURCES.md V2 (currently nothing, so they return
// not-found until real content ships).

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema object, passed to the provider's tool-use API as-is. */
  inputSchema: Record<string, unknown>;
}

export type ToolExecutionResult = { found: true; data: unknown } | { found: false };

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
      return fact ? { found: true, data: fact } : { found: false };
    },
  };
}
