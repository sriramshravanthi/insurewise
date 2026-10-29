import { z } from "zod";

// docs/DATA-MODEL.md §3: "rating_factors | id, line, category, factor,
// how_commonly_considered, jurisdiction_notes (JSONB), status
// (verified/watch), source_ids | Only verified, sourced entries render."
// PRD CAR-3: "sourced factor cards mapped to entered attributes."
export const RatingFactorSchema = z.object({
  id: z.string().min(1),
  line: z.enum(["auto", "home"]),
  category: z.string().min(1),
  factor: z.string().min(1),
  howCommonlyConsidered: z.string().min(1),
  jurisdictionNotes: z.record(z.string(), z.string()).optional(),
  status: z.enum(["verified", "watch"]),
  sourceIds: z.array(z.string()).min(1),
});
export type RatingFactor = z.infer<typeof RatingFactorSchema>;
