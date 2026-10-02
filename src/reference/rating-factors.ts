import { RatingFactorSchema, type RatingFactor } from "@/schemas/rating-factor";

// PRD CAR-3: "sourced factor cards mapped to entered attributes."
// docs/RESEARCH-SOURCES.md has RF-CA-AUTO-004 (Prop 103's three mandatory
// factors) at V1 and RF-CA-AUTO-005 (status of optional factors) at V0 —
// neither is V2 yet, so no factor card ships. Status "watch" is kept as a
// distinct value from "verified" (docs/DATA-MODEL.md §3: "Only verified,
// sourced entries render") for the day a factor clears verification but
// is still monitored for change.
const RAW_RATING_FACTORS: RatingFactor[] = [];

export const RATING_FACTORS: RatingFactor[] = RAW_RATING_FACTORS.map((factor) =>
  RatingFactorSchema.parse(factor),
);

export function getRatingFactors(
  line: RatingFactor["line"],
  factors: RatingFactor[] = RATING_FACTORS,
): RatingFactor[] {
  return factors.filter((factor) => factor.line === line && factor.status === "verified");
}
