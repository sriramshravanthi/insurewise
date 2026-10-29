import { describe, expect, it } from "vitest";
import { buildFactPacket, reviewFindingsToFacts } from "@/ai/fact-packet";
import type { ReviewFindingsResult } from "@/engine/review-findings-compiler";

describe("buildFactPacket", () => {
  it("marks insufficientData when there are no facts", () => {
    expect(buildFactPacket([])).toEqual({ facts: [], insufficientData: true });
  });

  it("carries facts through unchanged, with insufficientData false", () => {
    const facts = [
      { id: "a", label: "A", value: 1, provenance: "entered" as const },
    ];
    expect(buildFactPacket(facts)).toEqual({ facts, insufficientData: false });
  });
});

describe("reviewFindingsToFacts (docs/PRD.md AI-1: explains review results)", () => {
  it("converts a triggered finding's parameters into facts, with provenance and source preserved", () => {
    const result: ReviewFindingsResult = {
      findings: [
        {
          ruleId: "high-coverage-to-value-ratio",
          finding: {
            triggered: true,
            inputsUsed: ["coverageToValueRatioPct"],
            severity: "notice",
            messageTemplateId: "msg.high-coverage-to-value-ratio",
            sourceIds: ["S-DEMO-1"],
            parameters: {
              thresholdPct: { amount: 10, provenance: "illustrative" },
            },
          },
        },
      ],
      notEnoughInformation: [],
    };

    const facts = reviewFindingsToFacts(result);

    expect(facts).toContainEqual({
      id: "high-coverage-to-value-ratio.triggered",
      label: "Review item triggered: high-coverage-to-value-ratio",
      value: true,
      provenance: "calculated",
    });
    expect(facts).toContainEqual({
      id: "high-coverage-to-value-ratio.thresholdPct",
      label: "high-coverage-to-value-ratio parameter: thresholdPct",
      value: 10,
      unit: "%",
      provenance: "illustrative",
      sourceId: "S-DEMO-1",
    });
  });

  it('converts "not enough information" items into facts, never dropping them silently', () => {
    const result: ReviewFindingsResult = {
      findings: [],
      notEnoughInformation: [{ ruleId: "high-coverage-to-value-ratio", missing: ["coverageToValueRatioPct"] }],
    };

    expect(reviewFindingsToFacts(result)).toEqual([
      {
        id: "high-coverage-to-value-ratio.not_enough_information",
        label: "Not enough information for rule: high-coverage-to-value-ratio",
        value: true,
        provenance: "calculated",
      },
    ]);
  });
});
