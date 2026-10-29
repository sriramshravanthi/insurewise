import { describe, expect, it, vi } from "vitest";
import { explain } from "@/ai/explain";
import { EVAL_FIXTURES } from "@/ai/eval-fixtures";
import type { AIProvider, ProviderTurn } from "@/ai/provider";

// PRD AI-6: "Evaluation harness with 100+ prompts including adversarial
// cases, run in CI." This is a seed of that harness (src/ai/eval-fixtures.ts
// has the full rationale for why it's a handful of cases, not 100+, in this
// phase) — it proves the harness shape and that the guardrails actually
// hold against a model that tries to misbehave, using a fake provider so
// no live Anthropic account is needed.

// A deliberately adversarial fake: it always tries to answer in a way that
// breaks the rules (ranking language), on every attempt — the validator
// and retry/fallback logic (PRD AI-4) are what must catch it.
function adversarialProvider(): AIProvider {
  return {
    complete: vi.fn().mockImplementation(async (): Promise<ProviderTurn> => ({
      type: "text",
      text: JSON.stringify({
        answer: "This is the best, cheapest option, the clear winner.",
        citedFactIds: [],
      }),
    })),
  };
}

describe("assistant eval fixtures (docs/PRD.md AI-6 seed)", () => {
  for (const fixture of EVAL_FIXTURES) {
    it(`${fixture.name}: never surfaces banned phrasing even against an adversarial model`, async () => {
      const outcome = await explain(fixture.factPacket, fixture.question, adversarialProvider());

      expect(outcome.status).not.toBe("answered");
      const serialized = JSON.stringify(outcome).toLowerCase();
      for (const phrase of fixture.mustNotContain) {
        expect(serialized).not.toContain(phrase.toLowerCase());
      }
    });
  }

  it("a well-behaved provider still produces a cited, policy-clean answer for the ranking question", async () => {
    const fixture = EVAL_FIXTURES.find((f) => f.name === "refuses to rank insurers")!;
    const wellBehaved: AIProvider = {
      complete: vi.fn().mockResolvedValue({
        type: "text",
        text: JSON.stringify({
          answer:
            "InsureWise doesn't rank insurers. Based on your entries, the coverage-to-value threshold used here is 10%.",
          citedFactIds: ["high-coverage-to-value-ratio.thresholdPct"],
        }),
      } satisfies ProviderTurn),
    };

    const outcome = await explain(fixture.factPacket, fixture.question, wellBehaved);
    expect(outcome).toEqual({
      status: "answered",
      answer:
        "InsureWise doesn't rank insurers. Based on your entries, the coverage-to-value threshold used here is 10%.",
      citedFactIds: ["high-coverage-to-value-ratio.thresholdPct"],
    });
  });
});
