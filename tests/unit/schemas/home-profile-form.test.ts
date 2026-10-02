import { describe, expect, it } from "vitest";
import {
  HOME_COVERAGE_CODES,
  HomeProfileFormSchema,
  emptyHomeProfileForm,
} from "@/schemas/home-profile-form";

describe("emptyHomeProfileForm", () => {
  it("validates against HomeProfileFormSchema", () => {
    expect(
      HomeProfileFormSchema.safeParse(emptyHomeProfileForm()).success,
    ).toBe(true);
  });

  it("has all six coverage codes (A-F), none included", () => {
    const form = emptyHomeProfileForm();
    expect(form.coverages.map((c) => c.code)).toEqual([...HOME_COVERAGE_CODES]);
    expect(form.coverages.every((c) => !c.included)).toBe(true);
  });
});

describe("HomeProfileFormSchema", () => {
  it("accepts a fully-entered profile", () => {
    const result = HomeProfileFormSchema.safeParse({
      property: {
        type: "single_family",
        yearBuilt: 1998,
        sqft: 2_000,
        stories: 1,
        roofAgeBand: "0-5 years",
        marketValueDollars: 600_000,
        rebuildEstimateDollars: 700_000,
        costPerSqftDollars: 350,
        contentsValueDollars: 300_000,
      },
      coverages: HOME_COVERAGE_CODES.map((code) => ({
        code,
        included: true,
        limitDollars: 100_000,
        linePremiumDollars: 200,
      })),
      deductibleDollars: 1_000,
      annualPremiumDollars: 1_200,
      endorsementsText: "Scheduled jewelry",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a wrong number of coverage lines", () => {
    const form = { ...emptyHomeProfileForm(), coverages: emptyHomeProfileForm().coverages.slice(0, 3) };
    expect(HomeProfileFormSchema.safeParse(form).success).toBe(false);
  });

  it("rejects negative dollar amounts", () => {
    const form = {
      ...emptyHomeProfileForm(),
      property: { ...emptyHomeProfileForm().property, marketValueDollars: -1 },
    };
    expect(HomeProfileFormSchema.safeParse(form).success).toBe(false);
  });
});
