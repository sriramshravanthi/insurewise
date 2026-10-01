import { describe, expect, it } from "vitest";
import { ReviewFindingsFormSchema } from "@/schemas/review-findings-form";

describe("ReviewFindingsFormSchema", () => {
  it("accepts non-negative dollar amounts", () => {
    const result = ReviewFindingsFormSchema.safeParse({
      vehicleValueDollars: 6_000,
      collisionPremiumDollars: 400,
      comprehensivePremiumDollars: 400,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a zero vehicle value (the 'not entered' case)", () => {
    const result = ReviewFindingsFormSchema.safeParse({
      vehicleValueDollars: 0,
      collisionPremiumDollars: 400,
      comprehensivePremiumDollars: 400,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative amounts", () => {
    const result = ReviewFindingsFormSchema.safeParse({
      vehicleValueDollars: -1,
      collisionPremiumDollars: 400,
      comprehensivePremiumDollars: 400,
    });
    expect(result.success).toBe(false);
  });
});
