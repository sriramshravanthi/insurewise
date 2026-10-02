import { describe, expect, it } from "vitest";
import { VehicleSchema } from "@/schemas/vehicle";

describe("VehicleSchema", () => {
  it("accepts a fully-entered vehicle", () => {
    const result = VehicleSchema.safeParse({
      year: 2020,
      make: "Honda",
      model: "Civic",
      ownership: "financed",
      valueCents: 1_800_000,
      loanBalanceCents: 1_200_000,
      mileageBand: "10,000-15,000",
      use: "Commute",
      parking: "Garage",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a minimal vehicle with every optional field omitted (partial data, PRD INK-2)", () => {
    const result = VehicleSchema.safeParse({
      year: 2020,
      make: "Honda",
      model: "Civic",
      ownership: "owned",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a year outside the plausible range", () => {
    expect(
      VehicleSchema.safeParse({
        year: 1800,
        make: "Honda",
        model: "Civic",
        ownership: "owned",
      }).success,
    ).toBe(false);
  });

  it("rejects negative money fields", () => {
    expect(
      VehicleSchema.safeParse({
        year: 2020,
        make: "Honda",
        model: "Civic",
        ownership: "owned",
        valueCents: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects an SSN-like pattern in make/model (PRD INK-4)", () => {
    expect(
      VehicleSchema.safeParse({
        year: 2020,
        make: "123-45-6789",
        model: "Civic",
        ownership: "owned",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid ownership value", () => {
    expect(
      VehicleSchema.safeParse({
        year: 2020,
        make: "Honda",
        model: "Civic",
        ownership: "rented",
      }).success,
    ).toBe(false);
  });

  it("accepts any non-empty mileageBand label (opaque placeholder pending INK-5)", () => {
    expect(
      VehicleSchema.safeParse({
        year: 2020,
        make: "Honda",
        model: "Civic",
        ownership: "owned",
        mileageBand: "whatever label a future spec picks",
      }).success,
    ).toBe(true);
  });
});
