import { z } from "zod";
import { MoneyCentsSchema } from "./money";
import { safeFreeTextSchema } from "./safe-free-text";

// docs/DATA-MODEL.md "vehicles" table. mileageBand is a free-text
// placeholder, not an enum: INK-5's exact band boundaries were never
// decided, and the user chose (2026-10-01) not to invent them — real
// boundaries will replace this once that decision is made, without
// changing this schema's shape.
export const VehicleOwnershipSchema = z.enum(["owned", "financed", "leased"]);
export type VehicleOwnership = z.infer<typeof VehicleOwnershipSchema>;

export const VehicleSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  make: safeFreeTextSchema("Make").pipe(z.string().min(1).max(60)),
  model: safeFreeTextSchema("Model").pipe(z.string().min(1).max(60)),
  ownership: VehicleOwnershipSchema,
  valueCents: MoneyCentsSchema.optional(),
  loanBalanceCents: MoneyCentsSchema.optional(),
  /** Opaque band label — see the file-level note on INK-5. */
  mileageBand: z.string().min(1).max(40).optional(),
  use: safeFreeTextSchema("Use").pipe(z.string().max(60)).optional(),
  parking: safeFreeTextSchema("Parking").pipe(z.string().max(60)).optional(),
});
export type Vehicle = z.infer<typeof VehicleSchema>;
