import { describe, expect, it } from "vitest";
import { RatingFactorSchema, type RatingFactor } from "@/schemas/rating-factor";
import { RATING_FACTORS, getRatingFactors } from "@/reference/rating-factors";

const VERIFIED: RatingFactor = {
  id: "RATE-TEST-1",
  line: "auto",
  category: "test_category",
  factor: "test_factor",
  howCommonlyConsidered: "Commonly considered, for tests only.",
  status: "verified",
  sourceIds: ["S-TEST-1"],
};

const WATCHED: RatingFactor = { ...VERIFIED, id: "RATE-TEST-2", status: "watch" };

describe("RatingFactorSchema (docs/DATA-MODEL.md §3; PRD CAR-3)", () => {
  it("requires at least one source id", () => {
    expect(RatingFactorSchema.safeParse({ ...VERIFIED, sourceIds: [] }).success).toBe(false);
  });
});

describe('getRatingFactors ("Only verified, sourced entries render")', () => {
  it("ships with no factors yet — nothing has reached docs/RESEARCH-SOURCES.md V2", () => {
    expect(RATING_FACTORS).toEqual([]);
    expect(getRatingFactors("auto")).toEqual([]);
  });

  it("excludes a watch-status factor even when verified factors for the same line exist", () => {
    expect(getRatingFactors("auto", [VERIFIED, WATCHED])).toEqual([VERIFIED]);
  });

  it("filters by line", () => {
    expect(getRatingFactors("home", [VERIFIED])).toEqual([]);
  });
});
