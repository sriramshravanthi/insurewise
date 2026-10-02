import { describe, expect, it } from "vitest";
import { HouseholdSchema } from "@/schemas/household";

const VALID_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("HouseholdSchema", () => {
  it("accepts a fully-entered household", () => {
    const result = HouseholdSchema.safeParse({
      id: VALID_ID,
      label: "My household",
      state: "CA",
      zip5: "90210",
      isSample: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a minimal household with label/zip5 omitted (partial data, PRD INK-2)", () => {
    expect(
      HouseholdSchema.safeParse({ id: VALID_ID, state: "CA", isSample: false })
        .success,
    ).toBe(true);
  });

  it("rejects a non-UUID id", () => {
    expect(
      HouseholdSchema.safeParse({ id: "not-a-uuid", state: "CA", isSample: false })
        .success,
    ).toBe(false);
  });

  it("rejects a state code that is not exactly two letters", () => {
    expect(
      HouseholdSchema.safeParse({ id: VALID_ID, state: "California", isSample: false })
        .success,
    ).toBe(false);
  });

  it("rejects a zip5 that is not exactly five digits", () => {
    expect(
      HouseholdSchema.safeParse({
        id: VALID_ID,
        state: "CA",
        zip5: "9021",
        isSample: false,
      }).success,
    ).toBe(false);
  });

  it("rejects an SSN-like pattern in the label (PRD INK-4)", () => {
    expect(
      HouseholdSchema.safeParse({
        id: VALID_ID,
        state: "CA",
        label: "123-45-6789",
        isSample: false,
      }).success,
    ).toBe(false);
  });

  it("never stores a personal name field — only an opaque label (CLAUDE.md rule 7)", () => {
    expect(Object.keys(HouseholdSchema.shape)).not.toContain("name");
  });

  it("accepts an ownerId once a guest household is migrated to an account (docs/DATA-MODEL.md §3, §10)", () => {
    const result = HouseholdSchema.safeParse({
      id: VALID_ID,
      state: "CA",
      isSample: false,
      ownerId: "223e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID ownerId", () => {
    expect(
      HouseholdSchema.safeParse({
        id: VALID_ID,
        state: "CA",
        isSample: false,
        ownerId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});
