import { z } from "zod";

// Mirrors docs/RESEARCH-SOURCES.md §1 (tiers) and §3 (registry) — this is
// the *only* place a citation can come from; src/reference/sources.ts
// transcribes the registry verbatim, never adds a source that isn't there.
export const SourceTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const SourceSchema = z.object({
  /** e.g. "S-001", matching docs/RESEARCH-SOURCES.md §3. */
  id: z.string().regex(/^S-\d{3,}$/),
  title: z.string().min(1),
  publisher: z.string().min(1),
  tier: SourceTierSchema,
  url: z.string().url(),
  /** ISO date the document was retrieved/captured. */
  retrievedAt: z.string().optional(),
  sectionOrPage: z.string().optional(),
  notes: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;
