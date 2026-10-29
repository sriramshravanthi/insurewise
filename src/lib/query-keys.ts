/**
 * TanStack Query key factories.
 * Centralised here so invalidation is consistent everywhere.
 *
 * Usage:
 *   useQuery({ queryKey: qk.household(id), queryFn: ... })
 *   queryClient.invalidateQueries({ queryKey: qk.policies.all(householdId) })
 */

export const qk = {
  // ── auth ──────────────────────────────────────────────────────────────────
  user: () => ["user"] as const,
  session: () => ["session"] as const,

  // ── household ─────────────────────────────────────────────────────────────
  household: (id: string) => ["household", id] as const,
  households: () => ["households"] as const,

  // ── vehicles ──────────────────────────────────────────────────────────────
  vehicles: {
    all: (householdId: string) => ["vehicles", householdId] as const,
    one: (id: string) => ["vehicle", id] as const,
  },

  // ── drivers ───────────────────────────────────────────────────────────────
  drivers: {
    all: (householdId: string) => ["drivers", householdId] as const,
  },

  // ── properties ────────────────────────────────────────────────────────────
  properties: {
    all: (householdId: string) => ["properties", householdId] as const,
    one: (id: string) => ["property", id] as const,
  },

  // ── policies ──────────────────────────────────────────────────────────────
  policies: {
    all: (householdId: string) => ["policies", householdId] as const,
    one: (id: string) => ["policy", id] as const,
    coverages: (policyId: string) => ["policy_coverages", policyId] as const,
    endorsements: (policyId: string) => ["policy_endorsements", policyId] as const,
    limitations: (policyId: string) => ["policy_limitations", policyId] as const,
  },

  // ── scenarios ─────────────────────────────────────────────────────────────
  scenarios: {
    all: (householdId: string) => ["scenarios", householdId] as const,
    one: (id: string) => ["scenario", id] as const,
  },

  // ── review findings ───────────────────────────────────────────────────────
  reviewFindings: {
    all: (householdId: string) => ["review_findings", householdId] as const,
  },

  // ── checklist ─────────────────────────────────────────────────────────────
  checklist: {
    progress: (householdId: string) => ["checklist_progress", householdId] as const,
    items: () => ["checklist_items"] as const,
  },

  // ── reference data (long-lived, CDN-cacheable) ────────────────────────────
  ref: {
    coverageDefinitions: () => ["ref", "coverage_definitions"] as const,
    glossaryTerm: (slug: string) => ["ref", "glossary", slug] as const,
    glossaryAll: () => ["ref", "glossary"] as const,
    jurisdictions: () => ["ref", "jurisdictions"] as const,
    reviewRules: (line?: "auto" | "home" | "both") =>
      line ? ["ref", "review_rules", line] : (["ref", "review_rules"] as const),
    factVersions: (factId: string) => ["ref", "fact_versions", factId] as const,
    ratingFactors: (line?: "auto" | "home" | "both") =>
      line ? ["ref", "rating_factors", line] : (["ref", "rating_factors"] as const),
    checklistItems: (line?: "auto" | "home" | "both") =>
      line ? ["ref", "checklist_items", line] : (["ref", "checklist_items"] as const),
    sources: () => ["ref", "sources"] as const,
    source: (id: string) => ["ref", "source", id] as const,
    claimsWorkflows: () => ["ref", "claims_workflows"] as const,
  },

  // ── assistant ─────────────────────────────────────────────────────────────
  assistant: {
    conversations: (userId: string) => ["assistant_conversations", userId] as const,
    messages: (conversationId: string) => ["assistant_messages", conversationId] as const,
  },
} as const;
