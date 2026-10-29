import { z } from "zod";
import { MoneyCentsSchema } from "./money";

// The minimal policy shape the §3 comparability checks need
// (docs/CALCULATIONS.md §3) — not the full intake-wizard policy schema from
// docs/DATA-MODEL.md (no premiums, endorsements, or notes).
export const PolicyTypeSchema = z.enum(["car", "home"]);
export type PolicyType = z.infer<typeof PolicyTypeSchema>;

// Opaque label: no specific valuation-basis values are documented/verified
// anywhere, so this is compared for equality only, never interpreted.
export const ComparableCoverageSchema = z.object({
  code: z.string().min(1),
  included: z.boolean(),
  limitPrimaryCents: MoneyCentsSchema.optional(),
  limitSecondaryCents: MoneyCentsSchema.optional(),
  deductibleCents: MoneyCentsSchema.optional(),
  valuationBasis: z.string().min(1).optional(),
});
export type ComparableCoverage = z.infer<typeof ComparableCoverageSchema>;

export const ComparablePolicySchema = z
  .object({
    policyType: PolicyTypeSchema,
    termMonths: z.number().int().positive().optional(),
    coverages: z.array(ComparableCoverageSchema),
  })
  .refine(
    (policy) => {
      const codes = policy.coverages.map((c) => c.code);
      return new Set(codes).size === codes.length;
    },
    { message: "Coverage codes must be unique within a policy.", path: ["coverages"] },
  );
export type ComparablePolicy = z.infer<typeof ComparablePolicySchema>;
