import { z } from "zod";
import { safeFreeTextSchema } from "./safe-free-text";

// docs/DATA-MODEL.md "households" table (§3) — the root of the
// households 1-* vehicles|drivers|properties|policies|scenarios
// relationships (§5). `owner_id` is a server-side (auth.users) concern and
// is deliberately omitted here: this schema describes the client/guest
// shape (docs/DATA-MODEL.md §10); the Authentication group adds the
// server-side link later.
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
});
export type Household = z.infer<typeof HouseholdSchema>;
