import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ContentBlock, ProviderMessage, ProviderRequest, ProviderTurn } from "./provider";

// docs/ARCHITECTURE.md §5.6: "model name, limits and timeouts come from
// config" — model comes from ANTHROPIC_MODEL (.env.example, Phase 1);
// max output tokens is an engineering budget (PRD AI-5), not an insurance
// fact, so it's a plain constant rather than something requiring a source.
const MAX_OUTPUT_TOKENS = 1024;

function toAnthropicContent(
  content: string | ContentBlock[],
): string | Anthropic.ContentBlockParam[] {
  if (typeof content === "string") return content;
  return content.map((block): Anthropic.ContentBlockParam => {
    switch (block.type) {
      case "text":
        return { type: "text", text: block.text, citations: null };
      case "tool_use":
        return { type: "tool_use", id: block.id, name: block.name, input: block.input };
      case "tool_result":
        return { type: "tool_result", tool_use_id: block.toolUseId, content: block.content };
    }
  });
}

function toAnthropicMessages(messages: ProviderMessage[]): Anthropic.MessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: toAnthropicContent(message.content),
  }));
}

/**
 * The real AIProvider, backed by the Anthropic API. Mirrors
 * src/lib/supabase-client.ts: returns null (not a throw) when unconfigured,
 * so the route handler can show a graceful "not configured" state — no
 * live Anthropic account exists in this environment (.env.example only has
 * placeholder keys).
 */
export function createAnthropicProvider(): AIProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;
  if (!apiKey || !model) {
    return null;
  }

  const client = new Anthropic({ apiKey });

  return {
    async complete(request: ProviderRequest): Promise<ProviderTurn> {
      const tools: Anthropic.Tool[] = request.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Anthropic.Tool["input_schema"],
      }));

      const response = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: request.system,
        messages: toAnthropicMessages(request.messages),
        tools,
      });

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );
      if (toolUse) {
        return { type: "tool_use", id: toolUse.id, name: toolUse.name, input: toolUse.input };
      }

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");
      return { type: "text", text };
    },
  };
}
