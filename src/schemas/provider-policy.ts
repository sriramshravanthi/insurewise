import { z } from "zod";
import { PolicyForComparisonSchema } from "./policy-for-comparison";

// docs/ARCHITECTURE.md §5.5: "All policy data, whether typed, sample, or in
// future from an insurer, is mapped into one normalized model with
// per-field provenance." This wraps Feature 24's PolicyForComparison (the
// normalized model) with provider-level metadata.
export const PolicyRoleSchema = z.enum(["current", "hypothetical", "sample"]);
export type PolicyRole = z.infer<typeof PolicyRoleSchema>;

export const PolicySourceSchema = z.enum(["entered", "sample"]);
export type PolicySource = z.infer<typeof PolicySourceSchema>;

export const ProviderPolicySchema = z
  .object({
    id: z.string().min(1),
    role: PolicyRoleSchema,
    source: PolicySourceSchema,
    label: z.string().min(1),
    policy: PolicyForComparisonSchema,
  })
  .refine(
    (p) => p.source !== "sample" || p.policy.provenance === "sample",
    {
      message: "A sample-sourced policy must carry Sample provenance.",
      path: ["policy", "provenance"],
    },
  )
  .refine(
    (p) => p.source === "sample" || p.policy.provenance !== "sample",
    {
      message: "Only a sample-sourced policy may carry Sample provenance.",
      path: ["policy", "provenance"],
    },
  );
export type ProviderPolicy = z.infer<typeof ProviderPolicySchema>;
