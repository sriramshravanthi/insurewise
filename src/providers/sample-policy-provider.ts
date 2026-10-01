import type { ProviderPolicy } from "@/schemas/provider-policy";
import { ok, type Result } from "@/schemas/result";
import type { Trace } from "@/schemas/value";
import type { PolicyProvider } from "./policy-provider";
import { PROVIDER_VERSION } from "./provider-version";

// CLAUDE.md rule 8: "Synthetic households and documents use fictional
// names and a visible Sample badge." Fixed, clearly fictional data; round
// numbers only, never asserted as real-world figures.
const SAMPLE_POLICY: ProviderPolicy = {
  id: "sample-car-1",
  role: "sample",
  source: "sample",
  label: "Sample Car Policy",
  policy: {
    policyType: "car",
    termMonths: 12,
    provenance: "sample",
    annualPremiumCents: 120_000,
    coverages: [
      {
        code: "liability",
        included: true,
        limitPrimaryCents: 10_000_000,
        limitSecondaryCents: 30_000_000,
        deductibleCents: 0,
      },
      { code: "collision", included: true, deductibleCents: 50_000 },
      { code: "comprehensive", included: true, deductibleCents: 50_000 },
    ],
    endorsements: [],
    limitations: [
      { text: "Sample data for demonstration only; not a real policy." },
    ],
  },
};

/** Returns fixed, clearly fictional sample policy data (PRD DEMO-1). */
export class SamplePolicyProvider implements PolicyProvider {
  listPolicies(): Result<ProviderPolicy[]> {
    const policies = [SAMPLE_POLICY];

    const trace: Trace = {
      formulaId: "PROVIDER-SAMPLE",
      engineVersion: PROVIDER_VERSION,
      inputs: [],
      steps: [
        {
          label: "Sample policies returned",
          expression: "count(fixed sample policies)",
          result: policies.length,
        },
      ],
      output: { policyCount: policies.length },
      notes: ["All data from this provider is fictional and labeled Sample."],
    };

    return ok(policies, trace);
  }
}
