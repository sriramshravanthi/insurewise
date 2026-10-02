import { describe, expect, it } from "vitest";
import { DriverSchema } from "@/schemas/driver";

describe("DriverSchema", () => {
  it("accepts a fully-entered driver", () => {
    const result = DriverSchema.safeParse({
      ageBand: "25-34",
      yearsLicensedBand: "5-10",
      incidents3y: { accidents: 0, violations: 1 },
      primaryVehicleId: "vehicle-1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a driver with every field omitted (partial data, PRD INK-2)", () => {
    expect(DriverSchema.safeParse({}).success).toBe(true);
  });

  it("rejects negative incident counts", () => {
    expect(
      DriverSchema.safeParse({
        incidents3y: { accidents: -1, violations: 0 },
      }).success,
    ).toBe(false);
  });

  it("rejects a non-integer incident count", () => {
    expect(
      DriverSchema.safeParse({
        incidents3y: { accidents: 1.5, violations: 0 },
      }).success,
    ).toBe(false);
  });

  it("accepts any non-empty band labels (opaque placeholders pending INK-5)", () => {
    expect(
      DriverSchema.safeParse({
        ageBand: "whatever label a future spec picks",
        yearsLicensedBand: "whatever label a future spec picks",
      }).success,
    ).toBe(true);
  });
});
