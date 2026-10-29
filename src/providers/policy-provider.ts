import type { ProviderPolicy } from "@/schemas/provider-policy";
import type { Result } from "@/schemas/result";

// PRD CMP-6 / docs/ARCHITECTURE.md §4, §5.5: "Adding a real provider later
// means writing an adapter plus a compliance review, not changing the
// engine or UI."
export interface PolicyProvider {
  listPolicies(): Result<ProviderPolicy[]>;
}
