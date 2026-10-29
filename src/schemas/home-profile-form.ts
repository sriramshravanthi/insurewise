import { z } from "zod";
import { PropertyTypeSchema } from "./property";

// HOM-1/2: the PRD's own "A-F plus endorsements" wording (docs/PRD.md
// HOM-2), mapped onto C10's dwelling/contents/loss-of-use parameters
// (docs/CALCULATIONS.md §2). Not an invented coverage list — these are the
// PRD requirement's own labels.
export const HOME_COVERAGE_CODES = [
  "dwelling",
  "other_structures",
  "personal_property",
  "loss_of_use",
  "personal_liability",
  "medical_payments",
] as const;
export type HomeCoverageCode = (typeof HOME_COVERAGE_CODES)[number];

const homeCoverageFormSchema = z.object({
  code: z.enum(HOME_COVERAGE_CODES),
  included: z.boolean(),
  limitDollars: z.number().nonnegative().optional(),
  /** Feeds C7 (premiumComposition) when entered; optional. */
  linePremiumDollars: z.number().nonnegative().optional(),
});
export type HomeCoverageForm = z.infer<typeof homeCoverageFormSchema>;

export const HomeProfileFormSchema = z.object({
  property: z.object({
    type: PropertyTypeSchema,
    yearBuilt: z.number().int().min(1700).max(2100).optional(),
    sqft: z.number().int().positive().optional(),
    stories: z.number().int().positive().optional(),
    /** Opaque band label — see src/schemas/property.ts's note on INK-5. */
    roofAgeBand: z.string().max(40).optional(),
    marketValueDollars: z.number().nonnegative().optional(),
    rebuildEstimateDollars: z.number().nonnegative().optional(),
    /** Illustrative when entered (C11). */
    costPerSqftDollars: z.number().nonnegative().optional(),
    contentsValueDollars: z.number().nonnegative().optional(),
  }),
  coverages: z.array(homeCoverageFormSchema).length(HOME_COVERAGE_CODES.length),
  /** A single policy-level deductible, unlike car's per-coverage deductibles. */
  deductibleDollars: z.number().nonnegative().optional(),
  annualPremiumDollars: z.number().nonnegative().optional(),
  /** One endorsement label per line. */
  endorsementsText: z.string(),
});
export type HomeProfileForm = z.infer<typeof HomeProfileFormSchema>;

export function emptyHomeProfileForm(): HomeProfileForm {
  return {
    property: { type: "single_family" },
    coverages: HOME_COVERAGE_CODES.map((code) => ({
      code,
      included: false,
    })),
    endorsementsText: "",
  };
}
