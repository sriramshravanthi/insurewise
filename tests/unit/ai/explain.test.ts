import { describe, expect, it, vi } from "vitest";
import { explain } from "@/ai/explain";
import { buildFactPacket } from "@/ai/fact-packet";
import type { AIProvider, ProviderTurn } from "@/ai/provider";

const PACKET = buildFactPacket([
  { id: "fact-1", label: "Fact 1", value: 10, unit: "%", provenance: "illustrative", sourceId: "S-DEMO-1" },
]);

function scriptedProvider(turns: ProviderTurn[]): AIProvider & { complete: ReturnType<typeof vi.fn> } {
  let i = 0;
  const complete = vi.fn().mockImplementation(async () => {
    const turn = turns[Math.min(i, turns.length - 1)];
    i += 1;
    return turn;
  });
  return { complete };
}

function textTurn(output: object): ProviderTurn {
  return { type: "text", text: JSON.stringify(output) };
}

describe("explain (docs/ARCHITECTURE.md §5.6)", () => {
  it("never calls the provider when the fact packet is empty (PRD AI-3)", async () => {
    const provider = scriptedProvider([]);
    const outcome = await explain(buildFactPacket([]), "What's the minimum coverage?", provider);
    expect(outcome).toEqual({ status: "insufficient_data" });
    expect(provider.complete).not.toHaveBeenCalled();
  });

  it("returns a cited answer on a clean first response", async () => {
    const provider = scriptedProvider([
      textTurn({ answer: "It's 10%.", citedFactIds: ["fact-1"] }),
    ]);
    const outcome = await explain(PACKET, "What's the threshold?", provider);
    expect(outcome).toEqual({ status: "answered", answer: "It's 10%.", citedFactIds: ["fact-1"] });
    expect(provider.complete).toHaveBeenCalledTimes(1);
  });

  it("passes insufficientData through from a valid model response", async () => {
    const provider = scriptedProvider([
      textTurn({ answer: "I don't have that.", citedFactIds: [], insufficientData: true }),
    ]);
    const outcome = await explain(PACKET, "Unrelated question?", provider);
    expect(outcome).toEqual({ status: "insufficient_data" });
  });

  it("runs the lookup_fact tool round-trip, then accepts the follow-up text", async () => {
    const provider = scriptedProvider([
      { type: "tool_use", id: "t1", name: "lookup_fact", input: { factId: "fact-1" } },
      textTurn({ answer: "It's 10%.", citedFactIds: ["fact-1"] }),
    ]);
    const outcome = await explain(PACKET, "What's the threshold?", provider);
    expect(outcome).toEqual({ status: "answered", answer: "It's 10%.", citedFactIds: ["fact-1"] });
    expect(provider.complete).toHaveBeenCalledTimes(2);
  });

  it("retries once on an invalid response, then accepts a clean second attempt (PRD AI-4)", async () => {
    const provider = scriptedProvider([
      { type: "text", text: "not json" },
      textTurn({ answer: "It's 10%.", citedFactIds: ["fact-1"] }),
    ]);
    const outcome = await explain(PACKET, "What's the threshold?", provider);
    expect(outcome).toEqual({ status: "answered", answer: "It's 10%.", citedFactIds: ["fact-1"] });
    expect(provider.complete).toHaveBeenCalledTimes(2);
  });

  it("falls back safely after two invalid attempts (docs/ARCHITECTURE.md §8)", async () => {
    const provider = scriptedProvider([{ type: "text", text: "not json" }]);
    const outcome = await explain(PACKET, "What's the threshold?", provider);
    expect(outcome).toEqual({ status: "safe_fallback" });
    expect(provider.complete).toHaveBeenCalledTimes(2);
  });

  it("falls back when ranking language slips through validation twice (CLAUDE.md rule 4)", async () => {
    const provider = scriptedProvider([
      textTurn({ answer: "At 10%, this is the best option.", citedFactIds: ["fact-1"] }),
    ]);
    const outcome = await explain(PACKET, "What's the threshold?", provider);
    expect(outcome).toEqual({ status: "safe_fallback" });
  });
});
