import { z } from "zod";
import { safeFreeTextSchema } from "./safe-free-text";

// docs/DATA-MODEL.md "households" table (§3) — the root of the
// households 1-* vehicles|drivers|properties|policies|scenarios
// relationships (§5).
export const HouseholdSchema = z.object({
  id: z.string().uuid(),
  label: safeFreeTextSchema("Label").pipe(z.string().min(1).max(60)).optional(),
  /** Two-letter state code. */
  state: z.string().length(2),
  zip5: z
    .string()
    .regex(/^\d{5}$/, "zip5 must be exactly 5 digits.")
    .optional(),
  isSample: z.boolean(),
  // Server-side link to auth.users (docs/DATA-MODEL.md §3), set once a
  // guest household is migrated to a signed-in account
  // (docs/DATA-MODEL.md §10). Absent for guest-local households.
  ownerId: z.string().uuid().optional(),
});
export type Household = z.infer<typeof HouseholdSchema>;
