import {
  ProviderPolicySchema,
  type ProviderPolicy,
} from "@/schemas/provider-policy";
import { invalid, ok, type FieldError, type Result } from "@/schemas/result";
import type { Trace } from "@/schemas/value";
import type { PolicyProvider } from "./policy-provider";
import { PROVIDER_VERSION } from "./provider-version";

function zodErrorsToFieldErrors(
  index: number,
  issues: { path: PropertyKey[]; message: string }[],
): FieldError[] {
  return issues.map((issue) => ({
    field: `policies[${index}].${issue.path.map(String).join(".") || "(root)"}`,
    code: "invalid_policy",
    message: issue.message,
  }));
}

/** Wraps already-entered policy data; validates and returns it unchanged. */
export class ManualEntryProvider implements PolicyProvider {
  constructor(private readonly policies: ProviderPolicy[]) {}

  listPolicies(): Result<ProviderPolicy[]> {
    const validated: ProviderPolicy[] = [];
    for (const [index, policy] of this.policies.entries()) {
      const parsed = ProviderPolicySchema.safeParse(policy);
      if (!parsed.success) {
        return invalid(zodErrorsToFieldErrors(index, parsed.error.issues));
      }
      validated.push(parsed.data);
    }

    const trace: Trace = {
      formulaId: "PROVIDER-MANUAL-ENTRY",
      engineVersion: PROVIDER_VERSION,
      inputs: [
        {
          key: "policies.length",
          label: "Policies provided",
          value: this.policies.length,
          provenance: "entered",
        },
      ],
      steps: [
        {
          label: "Policies validated",
          expression: "count(policies)",
          result: validated.length,
        },
      ],
      output: { policyCount: validated.length },
      notes: [],
    };

    return ok(validated, trace);
  }
}
