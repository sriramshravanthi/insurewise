import { describe, expect, it } from "vitest";
import { PropertySchema } from "@/schemas/property";

describe("PropertySchema", () => {
  it("accepts a fully-entered single-family property", () => {
    const result = PropertySchema.safeParse({
      type: "single_family",
      yearBuilt: 1998,
      sqft: 2_000,
      stories: 2,
      construction: "Wood frame",
      foundation: "Slab",
      roofMaterial: "Composition shingle",
      roofAgeBand: "0-5 years",
      protectiveDevices: ["Smoke detectors", "Deadbolt locks"],
      hazardFlags: ["Near a wooded area"],
      marketValueCents: 60_000_000,
      rebuildEstimateCents: 70_000_000,
      costPerSqftCents: 35_000,
      contentsValueCents: 30_000_000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a minimal property with every optional field omitted (partial data, PRD INK-2)", () => {
    expect(PropertySchema.safeParse({ type: "condo" }).success).toBe(true);
  });

  it("accepts all four documented property types, including manufactured/mobile", () => {
    for (const type of ["single_family", "townhome", "condo", "manufactured_mobile"]) {
      expect(PropertySchema.safeParse({ type }).success).toBe(true);
    }
  });

  it("rejects an invalid property type", () => {
    expect(PropertySchema.safeParse({ type: "houseboat" }).success).toBe(false);
  });

  it("rejects negative money fields", () => {
    expect(
      PropertySchema.safeParse({ type: "condo", marketValueCents: -1 }).success,
    ).toBe(false);
  });

  it("rejects an SSN-like pattern in free-text fields (PRD INK-4)", () => {
    expect(
      PropertySchema.safeParse({
        type: "single_family",
        construction: "123-45-6789",
      }).success,
    ).toBe(false);
  });

  it("accepts any non-empty roofAgeBand label (opaque placeholder pending INK-5)", () => {
    expect(
      PropertySchema.safeParse({
        type: "single_family",
        roofAgeBand: "whatever label a future spec picks",
      }).success,
    ).toBe(true);
  });
});
