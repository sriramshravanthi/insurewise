import { z } from "zod";

// SCN-1: "loss amount, 2-4 deductible options each with an entered premium."
// Form inputs are plain dollar amounts; dollarsToCents converts at the
// boundary before anything reaches the engine (docs/CALCULATIONS.md §1:
// money is integer cents). Inputs are read via React Hook Form's
// `valueAsNumber`, so this schema validates numbers directly rather than
// coercing strings (coercion would make the form's input/output types
// diverge and break useForm's generics).
const dollarsSchema = z
  .number({ message: "Enter a dollar amount." })
  .nonnegative("Must be zero or more.");

export const DeductibleOptionFormSchema = z.object({
  deductibleDollars: dollarsSchema,
  annualPremiumDollars: dollarsSchema,
});
export type DeductibleOptionForm = z.infer<typeof DeductibleOptionFormSchema>;

export const DeductibleSimulatorFormSchema = z.object({
  lossDollars: dollarsSchema,
  options: z.array(DeductibleOptionFormSchema).min(2).max(4),
  n: z
    .number({ message: "Enter a whole number of years." })
    .int("Must be a whole number.")
    .min(1, "Must be at least 1 year."),
});
export type DeductibleSimulatorForm = z.infer<
  typeof DeductibleSimulatorFormSchema
>;

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
