import { z } from "zod";

// Feeds C13 (coverage-to-value ratio) to produce a real computed input for
// the review-rule evaluator (GAP-1/GAP-2).
export const ReviewFindingsFormSchema = z.object({
  vehicleValueDollars: z.number().nonnegative(),
  collisionPremiumDollars: z.number().nonnegative(),
  comprehensivePremiumDollars: z.number().nonnegative(),
});
export type ReviewFindingsForm = z.infer<typeof ReviewFindingsFormSchema>;
