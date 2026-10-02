import type { FactPacket } from "@/schemas/fact";
import { buildUserPrompt, SYSTEM_PROMPT } from "./system-prompt";
import { createFactLookupTool, type Tool } from "./tools";
import { createGlossaryLookupTool } from "./reference-tools";
import { validateAssistantOutput } from "./output-validator";
import type { AIProvider, ProviderMessage } from "./provider";

// docs/ARCHITECTURE.md §5.6: "The rest of the app depends only on
// explain(factPacket, question)." This is that function.

export type AssistantOutcome =
  | { status: "answered"; answer: string; citedFactIds: string[] }
  | { status: "insufficient_data" }
  | { status: "safe_fallback" };

// PRD AI-4: "regenerate once then safe fallback" -> one initial attempt
// plus one retry.
const MAX_ATTEMPTS = 2;

// A tool round-trip costs one provider call on top of the attempt's normal
// call. Bounded to one round-trip so a provider that keeps requesting
// tools can never loop indefinitely.
async function runAttempt(
  provider: AIProvider,
  tools: Tool[],
  system: string,
  messages: ProviderMessage[],
): Promise<string | null> {
  const toolDefinitions = tools.map((tool) => tool.definition);
  const first = await provider.complete({ system, messages, tools: toolDefinitions });
  if (first.type === "text") return first.text;

  const tool = tools.find((t) => t.definition.name === first.name);
  const result = tool?.execute(first.input) ?? { found: false as const };
  const toolResultText = result.found ? JSON.stringify(result.data) : "not_found";
  const followUpMessages: ProviderMessage[] = [
    ...messages,
    {
      role: "assistant",
      content: [{ type: "tool_use", id: first.id, name: first.name, input: first.input }],
    },
    {
      role: "user",
      content: [{ type: "tool_result", toolUseId: first.id, content: toolResultText }],
    },
  ];
  const second = await provider.complete({ system, messages: followUpMessages, tools: toolDefinitions });
  return second.type === "text" ? second.text : null;
}

export async function explain(
  factPacket: FactPacket,
  question: string,
  provider: AIProvider,
): Promise<AssistantOutcome> {
  // docs/ARCHITECTURE.md §3: nothing to ground an answer in -> say so
  // without ever calling the model (PRD AI-3).
  if (factPacket.insufficientData) {
    return { status: "insufficient_data" };
  }

  const tools: Tool[] = [createFactLookupTool(factPacket), createGlossaryLookupTool()];
  const system = SYSTEM_PROMPT;
  const messages: ProviderMessage[] = [
    { role: "user", content: buildUserPrompt(factPacket, question) },
  ];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const text = await runAttempt(provider, tools, system, messages);
    if (text === null) continue;

    const validated = validateAssistantOutput(text, factPacket);
    if (validated.status === "ok") {
      if (validated.output.insufficientData) {
        return { status: "insufficient_data" };
      }
      return {
        status: "answered",
        answer: validated.output.answer,
        citedFactIds: validated.output.citedFactIds,
      };
    }
  }

  // docs/ARCHITECTURE.md §8: "AI provider down or validation fails twice ->
  // Assistant shows a safe fallback... the rest of the app is unaffected."
  return { status: "safe_fallback" };
}
