import { describe, expect, it } from "vitest";
import { FactPacketSchema, FactSchema } from "@/schemas/fact";

describe("FactSchema", () => {
  it("accepts a fact with a string, number, or boolean value", () => {
    for (const value of ["text", 10, true]) {
      expect(
        FactSchema.safeParse({ id: "f1", label: "Fact", value, provenance: "calculated" })
          .success,
      ).toBe(true);
    }
  });

  it("rejects a missing provenance", () => {
    expect(FactSchema.safeParse({ id: "f1", label: "Fact", value: 1 }).success).toBe(false);
  });
});

describe("FactPacketSchema", () => {
  it("accepts an empty packet marked insufficientData", () => {
    expect(FactPacketSchema.safeParse({ facts: [], insufficientData: true }).success).toBe(true);
  });
});
