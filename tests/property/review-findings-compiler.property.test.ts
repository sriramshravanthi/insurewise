import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { compileReviewFindings } from "@/engine/review-findings-compiler";
import { evaluateReviewRule } from "@/engine/review-rule-evaluator";
import type { ReviewRule } from "@/schemas/review-rule";

function ruleForKey(key: string, threshold: number): ReviewRule {
  return {
    id: key,
    appliesTo: "both",
    requiredInputs: [key],
    condition: { kind: "comparison", inputKey: key, operator: "gt", value: threshold },
    severity: "notice",
    messageTemplateId: `msg.${key}`,
    sourceIds: ["S-DEMO-1"],
    parameters: {},
  };
}

describe("compileReviewFindings (PRD GAP-1/GAP-2) properties", () => {
  it("every rule's outcome matches evaluating it individually, and lands in exactly one bucket", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 5 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
            threshold: fc.integer({ min: -10, max: 10 }),
            provided: fc.boolean(),
            value: fc.integer({ min: -10, max: 10 }),
          }),
          { maxLength: 6 },
        ).map((entries) => {
          // de-duplicate keys so each rule has its own distinct input
          const seen = new Set<string>();
          return entries.filter((e) => {
            if (seen.has(e.key)) return false;
            seen.add(e.key);
            return true;
          });
        }),
        (entries) => {
          const rules = entries.map((e) => ruleForKey(e.key, e.threshold));
          const inputs = Object.fromEntries(
            entries.filter((e) => e.provided).map((e) => [e.key, e.value]),
          );

          const result = compileReviewFindings(rules, inputs);
          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;

          for (const entry of entries) {
            const individual = evaluateReviewRule(
              ruleForKey(entry.key, entry.threshold),
              inputs,
            );
            const inFindings = result.value.findings.some(
              (f) => f.ruleId === entry.key,
            );
            const inNotEnough = result.value.notEnoughInformation.some(
              (n) => n.ruleId === entry.key,
            );

            // Exactly one of: found in findings, found in notEnoughInformation,
            // or silently dropped (neither) — never both.
            expect(inFindings && inNotEnough).toBe(false);

            if (individual.status === "insufficient_data") {
              expect(inNotEnough).toBe(true);
              expect(inFindings).toBe(false);
            } else if (individual.status === "ok" && individual.value.triggered) {
              expect(inFindings).toBe(true);
              expect(inNotEnough).toBe(false);
            } else {
              expect(inFindings).toBe(false);
              expect(inNotEnough).toBe(false);
            }
          }
        },
      ),
    );
  });

  it("the 'does not imply adequacy' note is present if and only if findings is empty", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 5 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
            threshold: fc.integer({ min: -10, max: 10 }),
            value: fc.integer({ min: -10, max: 10 }),
          }),
          { maxLength: 6 },
        ).map((entries) => {
          const seen = new Set<string>();
          return entries.filter((e) => {
            if (seen.has(e.key)) return false;
            seen.add(e.key);
            return true;
          });
        }),
        (entries) => {
          const rules = entries.map((e) => ruleForKey(e.key, e.threshold));
          const inputs = Object.fromEntries(entries.map((e) => [e.key, e.value]));

          const result = compileReviewFindings(rules, inputs);
          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;

          const hasNote = result.trace.notes.length > 0;
          expect(hasNote).toBe(result.value.findings.length === 0);
        },
      ),
    );
  });
});
