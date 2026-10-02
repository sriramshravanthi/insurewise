import { describe, expect, it } from "vitest";
import { validateAssistantOutput } from "@/ai/output-validator";
import { buildFactPacket } from "@/ai/fact-packet";

const PACKET = buildFactPacket([
  { id: "fact-1", label: "Fact 1", value: 10, unit: "%", provenance: "illustrative" },
]);

describe("validateAssistantOutput (docs/PRD.md AI-4)", () => {
  it("accepts a cited, grounded, policy-clean answer", () => {
    const result = validateAssistantOutput(
      JSON.stringify({ answer: "This is based on a 10% threshold.", citedFactIds: ["fact-1"] }),
      PACKET,
    );
    expect(result).toEqual({
      status: "ok",
      output: { answer: "This is based on a 10% threshold.", citedFactIds: ["fact-1"] },
    });
  });

  it("rejects text that isn't JSON", () => {
    expect(validateAssistantOutput("not json at all", PACKET)).toEqual({
      status: "invalid",
      reason: "not_json",
    });
  });

  it("rejects JSON that doesn't match the output schema", () => {
    expect(validateAssistantOutput(JSON.stringify({ foo: "bar" }), PACKET)).toEqual({
      status: "invalid",
      reason: "schema",
    });
  });

  it("rejects an uncited claim when facts were available (PRD AI-2)", () => {
    const result = validateAssistantOutput(
      JSON.stringify({ answer: "The threshold is 10%.", citedFactIds: [] }),
      PACKET,
    );
    expect(result).toEqual({ status: "invalid", reason: "no_citation" });
  });

  it("accepts an empty citation list when the model explicitly flags insufficientData", () => {
    const result = validateAssistantOutput(
      JSON.stringify({
        answer: "Verified information isn't available for that.",
        citedFactIds: [],
        insufficientData: true,
      }),
      PACKET,
    );
    expect(result.status).toBe("ok");
  });

  it("rejects a citation that names a fact id outside the packet", () => {
    const result = validateAssistantOutput(
      JSON.stringify({ answer: "The threshold is 10%.", citedFactIds: ["not-a-real-fact"] }),
      PACKET,
    );
    expect(result).toEqual({ status: "invalid", reason: "unknown_fact_id" });
  });

  it("rejects a number in the answer that doesn't trace back to any fact (hallucinated figure)", () => {
    const result = validateAssistantOutput(
      JSON.stringify({ answer: "The threshold is 25%.", citedFactIds: ["fact-1"] }),
      PACKET,
    );
    expect(result).toEqual({ status: "invalid", reason: "ungrounded_number" });
  });

  it('rejects ranking language even when otherwise cited and grounded (PRD INT-6, CLAUDE.md rule 4)', () => {
    const result = validateAssistantOutput(
      JSON.stringify({ answer: "At 10%, this is the best option.", citedFactIds: ["fact-1"] }),
      PACKET,
    );
    expect(result).toEqual({ status: "invalid", reason: "language_policy" });
  });

  it("rejects a sign-flipped number as ungrounded rather than matching through a dropped minus sign", () => {
    const result = validateAssistantOutput(
      JSON.stringify({ answer: "The relevant figure is -10%.", citedFactIds: ["fact-1"] }),
      PACKET,
    );
    expect(result).toEqual({ status: "invalid", reason: "ungrounded_number" });
  });

  it("accepts a comma-grouped number that matches a fact value (e.g. \"1,000\")", () => {
    const packet = buildFactPacket([
      { id: "fact-2", label: "Fact 2", value: 1000, unit: "$", provenance: "entered" },
    ]);
    const result = validateAssistantOutput(
      JSON.stringify({ answer: "The entered value is $1,000.", citedFactIds: ["fact-2"] }),
      packet,
    );
    expect(result.status).toBe("ok");
  });
});
