import { z } from "zod";

// Money is always an integer number of cents (docs/CALCULATIONS.md §1).
export const MoneyCentsSchema = z.number().int().nonnegative();

export type MoneyCents = z.infer<typeof MoneyCentsSchema>;
