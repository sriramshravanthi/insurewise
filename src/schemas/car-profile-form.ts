import { z } from "zod";
import { COMPARISON_COVERAGE_CODES } from "./policy-comparison-form";
import { VehicleOwnershipSchema } from "./vehicle";

// CAR-1/2/3: reuses Cycle 1's Vehicle/Driver schemas and the same four
// generic coverage codes as the comparison UI (Cycle 2), plus a per-line
// premium so CAR-3 can feed C7 (premiumComposition, Feature 11).
const driverFormSchema = z.object({
  ageBand: z.string().max(40).optional(),
  yearsLicensedBand: z.string().max(40).optional(),
  accidents3y: z.number().int().nonnegative().optional(),
  violations3y: z.number().int().nonnegative().optional(),
});
export type DriverForm = z.infer<typeof driverFormSchema>;

const carCoverageFormSchema = z.object({
  code: z.enum(COMPARISON_COVERAGE_CODES),
  included: z.boolean(),
  limitPrimaryDollars: z.number().nonnegative().optional(),
  limitSecondaryDollars: z.number().nonnegative().optional(),
  deductibleDollars: z.number().nonnegative().optional(),
  /** Feeds C7 (premiumComposition) when entered; optional. */
  linePremiumDollars: z.number().nonnegative().optional(),
});
export type CarCoverageForm = z.infer<typeof carCoverageFormSchema>;

export const CarProfileFormSchema = z.object({
  vehicle: z.object({
    year: z.number().int().min(1900).max(2100),
    make: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    ownership: VehicleOwnershipSchema,
    valueDollars: z.number().nonnegative().optional(),
    loanBalanceDollars: z.number().nonnegative().optional(),
    mileageBand: z.string().max(40).optional(),
  }),
  drivers: z.array(driverFormSchema).min(1).max(5),
  coverages: z
    .array(carCoverageFormSchema)
    .length(COMPARISON_COVERAGE_CODES.length),
  /** The entered overall premium; feeds C7's totalCents when provided. */
  annualPremiumDollars: z.number().nonnegative().optional(),
});
export type CarProfileForm = z.infer<typeof CarProfileFormSchema>;

export function emptyCarProfileForm(): CarProfileForm {
  return {
    vehicle: {
      year: new Date().getFullYear(),
      make: "",
      model: "",
      ownership: "owned",
    },
    drivers: [{}],
    coverages: COMPARISON_COVERAGE_CODES.map((code) => ({
      code,
      included: false,
    })),
  };
}

export function driverFormToDriver(form: DriverForm) {
  const hasIncidents =
    form.accidents3y !== undefined || form.violations3y !== undefined;
  return {
    ageBand: form.ageBand || undefined,
    yearsLicensedBand: form.yearsLicensedBand || undefined,
    incidents3y: hasIncidents
      ? {
          accidents: form.accidents3y ?? 0,
          violations: form.violations3y ?? 0,
        }
      : undefined,
  };
}
