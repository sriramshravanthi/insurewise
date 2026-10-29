import type { ToolDefinition } from "./tools";

// docs/ARCHITECTURE.md §5.6: "AI behind a thin adapter. One module calls
// the model... The rest of the app depends only on explain(factPacket,
// question)." AIProvider is that one seam — every orchestration function
// in this module (explain.ts) takes a provider as a parameter rather than
// reaching for a singleton, so it is testable with a fake provider and
// needs no live Anthropic account (same DI pattern as src/lib/auth.ts).

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; toolUseId: string; content: string };

export interface ProviderMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export type ProviderTurn =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown };

export interface ProviderRequest {
  system: string;
  messages: ProviderMessage[];
  tools: ToolDefinition[];
}

export interface AIProvider {
  complete(request: ProviderRequest): Promise<ProviderTurn>;
}
