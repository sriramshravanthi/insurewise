import { z } from "zod";
import { ComparableCoverageSchema, PolicyTypeSchema } from "./comparable-policy";
import { EndorsementSchema, LimitationSchema } from "./diffable-policy";
import { MoneyCentsSchema } from "./money";
import { ProvenanceSchema } from "./provenance";

// PRD CMP-1: one policy shape that feeds both the comparability-check
// engine (Feature 20) and the policy-diff engine (Feature 23).
export const PolicyForComparisonSchema = z
  .object({
    policyType: PolicyTypeSchema,
    termMonths: z.number().int().positive().optional(),
    provenance: ProvenanceSchema,
    annualPremiumCents: MoneyCentsSchema.optional(),
    coverages: z.array(ComparableCoverageSchema),
    endorsements: z.array(EndorsementSchema),
    limitations: z.array(LimitationSchema),
  })
  .refine(
    (policy) => {
      const codes = policy.coverages.map((c) => c.code);
      return new Set(codes).size === codes.length;
    },
    { message: "Coverage codes must be unique within a policy.", path: ["coverages"] },
  );
export type PolicyForComparison = z.infer<typeof PolicyForComparisonSchema>;
