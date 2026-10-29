import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  collectMissingFields,
  isUnknown,
  resolveUnknowable,
  UNKNOWN,
  unknowableSchema,
} from "@/schemas/unknowable";

describe("isUnknown", () => {
  it("is true only for the UNKNOWN sentinel", () => {
    expect(isUnknown(UNKNOWN)).toBe(true);
    expect(isUnknown(42)).toBe(false);
    expect(isUnknown(undefined)).toBe(false);
  });
});

describe("resolveUnknowable", () => {
  it("passes through a known value", () => {
    expect(resolveUnknowable(42)).toBe(42);
  });

  it("treats both 'I don't know' and not-yet-answered as no value", () => {
    expect(resolveUnknowable(UNKNOWN)).toBeUndefined();
    expect(resolveUnknowable(undefined)).toBeUndefined();
  });
});

describe("unknowableSchema", () => {
  it("accepts a valid value or the UNKNOWN sentinel, rejects anything else", () => {
    const schema = unknowableSchema(z.number().int().nonnegative());

    expect(schema.safeParse(100).success).toBe(true);
    expect(schema.safeParse(UNKNOWN).success).toBe(true);
    expect(schema.safeParse("not a number").success).toBe(false);
  });
});

describe("collectMissingFields", () => {
  it("lists fields that are unanswered or explicitly unknown, keeps known fields out", () => {
    const missing = collectMissingFields({
      vehicleValueCents: 1_800_000,
      mileageBand: UNKNOWN,
      yearsLicensedBand: undefined,
    });

    expect(missing.sort()).toEqual(["mileageBand", "yearsLicensedBand"]);
  });

  it("returns an empty list when every field is known", () => {
    expect(collectMissingFields({ a: 1, b: "entered" })).toEqual([]);
  });
});
