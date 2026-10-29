import { describe, expect, it } from "vitest";
import { compileReviewFindings } from "@/engine/review-findings-compiler";
import type { ReviewRule } from "@/schemas/review-rule";

function rule(id: string, inputKey: string, threshold: number): ReviewRule {
  return {
    id,
    appliesTo: "both",
    requiredInputs: [inputKey],
    condition: { kind: "comparison", inputKey, operator: "gt", value: threshold },
    severity: "notice",
    messageTemplateId: `msg.${id}`,
    sourceIds: ["S-DEMO-1"],
    parameters: {},
  };
}

describe("compileReviewFindings (PRD GAP-1/GAP-2)", () => {
  it("returns an empty, valid result for an empty rule set, with the 'does not imply adequacy' note", () => {
    const result = compileReviewFindings([], {});

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.findings).toEqual([]);
    expect(result.value.notEnoughInformation).toEqual([]);
    expect(result.trace.notes[0]).toMatch(/does not imply/i);
  });

  it("sorts rules into findings, not-enough-information, and silently-dropped buckets", () => {
    const rules = [
      rule("triggered-rule", "a", 0), // a=5 > 0 -> triggers
      rule("not-triggered-rule", "b", 100), // b=5, not > 100 -> dropped
      rule("missing-input-rule", "c", 0), // c not provided -> not enough information
    ];
    const result = compileReviewFindings(rules, { a: 5, b: 5 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.findings).toHaveLength(1);
    expect(result.value.findings[0].ruleId).toBe("triggered-rule");
    expect(result.value.findings[0].finding.triggered).toBe(true);
    expect(result.value.notEnoughInformation).toEqual([
      { ruleId: "missing-input-rule", missing: ["c"] },
    ]);
  });

  it("omits the 'does not imply adequacy' note once at least one finding triggers", () => {
    const rules = [rule("triggered-rule", "a", 0)];
    const result = compileReviewFindings(rules, { a: 5 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.notes).toEqual([]);
  });

  it("keeps the note even when some rules are skipped for missing data, as long as nothing triggered", () => {
    const rules = [rule("missing-input-rule", "c", 0)];
    const result = compileReviewFindings(rules, {});

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.findings).toEqual([]);
    expect(result.value.notEnoughInformation).toHaveLength(1);
    expect(result.trace.notes[0]).toMatch(/does not imply/i);
  });

  it("propagates a malformed rule as invalid for the whole batch, not a per-item skip", () => {
    const rules = [
      rule("ok-rule", "a", 0),
      { ...rule("bad-rule", "a", 0), sourceIds: [] }, // no sources: malformed
    ];
    const result = compileReviewFindings(rules, { a: 5 });

    expect(result.status).toBe("invalid");
  });

  it("each finding carries its own rule's severity, message template, and sources", () => {
    const rules = [rule("triggered-rule", "a", 0)];
    const result = compileReviewFindings(rules, { a: 5 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const [{ finding }] = result.value.findings;
    expect(finding.severity).toBe("notice");
    expect(finding.messageTemplateId).toBe("msg.triggered-rule");
    expect(finding.sourceIds).toEqual(["S-DEMO-1"]);
    expect(finding.inputsUsed).toEqual(["a"]);
  });

  it("trace: records the number of rules evaluated and the count in each bucket", () => {
    const rules = [
      rule("triggered-rule", "a", 0),
      rule("missing-input-rule", "c", 0),
    ];
    const result = compileReviewFindings(rules, { a: 5 });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("REVIEW-FINDINGS-COMPILER");
    expect(result.trace.steps[0].result).toBe(2);
    expect(result.trace.steps[1].result).toBe(result.value.findings.length);
    expect(result.trace.steps[2].result).toBe(
      result.value.notEnoughInformation.length,
    );
  });
});
