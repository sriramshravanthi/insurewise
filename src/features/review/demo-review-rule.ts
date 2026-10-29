import type { ReviewRule } from "@/schemas/review-rule";

// DEMO rule only — no real review rule exists yet; every rule needs a
// sourced threshold, and docs/RESEARCH-SOURCES.md has none at V2. PRD
// GAP-4 explicitly allows this: "Heuristic thresholds are labeled
// Illustrative with rationale, or omitted." This is the one kind of rule
// that may ship without full research, and it's the same example already
// used in Feature 21/25's own tests. Not a verified fact.
export const DEMO_REVIEW_RULE: ReviewRule = {
  id: "high-coverage-to-value-ratio",
  appliesTo: "car",
  requiredInputs: ["coverageToValueRatioPct"],
  condition: {
    kind: "comparison",
    inputKey: "coverageToValueRatioPct",
    operator: "gt",
    value: { parameterKey: "thresholdPct" },
  },
  severity: "notice",
  messageTemplateId: "msg.high-coverage-to-value-ratio",
  questionTemplateId: "q.high-coverage-to-value-ratio",
  sourceIds: ["S-DEMO-1"],
  parameters: {
    thresholdPct: {
      value: 10,
      provenance: "illustrative",
      rationale: "A round, clearly-labeled starting point pending research.",
    },
  },
};
