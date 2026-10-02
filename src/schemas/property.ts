import { z } from "zod";
import { MoneyCentsSchema } from "./money";
import { safeFreeTextSchema } from "./safe-free-text";

// docs/DATA-MODEL.md "properties" table. roofAgeBand is a free-text
// placeholder, not an enum — same INK-5 note as vehicle.ts's mileageBand:
// no boundaries were ever decided, and the user chose not to invent them.
export const PropertyTypeSchema = z.enum([
  "single_family",
  "townhome",
  "condo",
  "manufactured_mobile",
]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

function freeText(label: string, maxLength: number) {
  return safeFreeTextSchema(label).pipe(z.string().max(maxLength));
}

export const PropertySchema = z.object({
  type: PropertyTypeSchema,
  yearBuilt: z.number().int().min(1700).max(2100).optional(),
  sqft: z.number().int().positive().optional(),
  stories: z.number().int().positive().optional(),
  construction: freeText("Construction", 60).optional(),
  foundation: freeText("Foundation", 60).optional(),
  roofMaterial: freeText("Roof material", 60).optional(),
  /** Opaque band label — see the file-level note on INK-5. */
  roofAgeBand: z.string().min(1).max(40).optional(),
  protectiveDevices: z.array(freeText("Protective device", 60)).optional(),
  /** Self-reported. */
  hazardFlags: z.array(freeText("Hazard flag", 60)).optional(),
  marketValueCents: MoneyCentsSchema.optional(),
  rebuildEstimateCents: MoneyCentsSchema.optional(),
  /** Illustrative when entered — see C11, docs/CALCULATIONS.md §2. */
  costPerSqftCents: MoneyCentsSchema.optional(),
  contentsValueCents: MoneyCentsSchema.optional(),
});
export type Property = z.infer<typeof PropertySchema>;
