import { z } from "zod";
import { ComparableCoverageSchema } from "./comparable-policy";
import { MoneyCentsSchema } from "./money";
import { ProvenanceSchema } from "./provenance";

// The minimal policy shape PRD CMP-2's row-by-row diff needs. Reuses
// Feature 20's coverage shape rather than duplicating it.
export const EndorsementSchema = z.object({
  code: z.string().min(1).optional(),
  label: z.string().min(1),
});
export type Endorsement = z.infer<typeof EndorsementSchema>;

export const LimitationSchema = z.object({
  text: z.string().min(1),
});
export type Limitation = z.infer<typeof LimitationSchema>;

export const DiffablePolicySchema = z
  .object({
    /** Provenance of every entered money value on this policy. */
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
export type DiffablePolicy = z.infer<typeof DiffablePolicySchema>;
