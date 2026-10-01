import { describe, expect, it } from "vitest";
import { ReviewRuleSchema } from "@/schemas/review-rule";
import { DEMO_REVIEW_RULE } from "@/features/review/demo-review-rule";
import { evaluateReviewRule } from "@/engine/review-rule-evaluator";

describe("DEMO_REVIEW_RULE", () => {
  it("validates against ReviewRuleSchema", () => {
    expect(ReviewRuleSchema.safeParse(DEMO_REVIEW_RULE).success).toBe(true);
  });

  it("carries a rationale, since its threshold is Illustrative (PRD GAP-4)", () => {
    expect(DEMO_REVIEW_RULE.parameters.thresholdPct.provenance).toBe(
      "illustrative",
    );
    expect(DEMO_REVIEW_RULE.parameters.thresholdPct.rationale).toBeTruthy();
  });

  it("evaluates correctly above and below its threshold", () => {
    const above = evaluateReviewRule(DEMO_REVIEW_RULE, {
      coverageToValueRatioPct: 15,
    });
    const below = evaluateReviewRule(DEMO_REVIEW_RULE, {
      coverageToValueRatioPct: 5,
    });

    expect(above.status).toBe("ok");
    expect(below.status).toBe("ok");
    if (above.status !== "ok" || below.status !== "ok") return;
    expect(above.value.triggered).toBe(true);
    expect(below.value.triggered).toBe(false);
  });
});
