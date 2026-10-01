import { describe, expect, it } from "vitest";
import {
  DeductibleSimulatorFormSchema,
  dollarsToCents,
} from "@/schemas/deductible-simulator-form";

describe("DeductibleSimulatorFormSchema", () => {
  it("accepts the PRD SCN-1 worked example", () => {
    const result = DeductibleSimulatorFormSchema.safeParse({
      lossDollars: 8_000,
      options: [
        { deductibleDollars: 500, annualPremiumDollars: 1_400 },
        { deductibleDollars: 1_000, annualPremiumDollars: 1_250 },
      ],
      n: 5,
    });
    expect(result.success).toBe(true);
  });

  it("requires at least 2 options", () => {
    const result = DeductibleSimulatorFormSchema.safeParse({
      lossDollars: 8_000,
      options: [{ deductibleDollars: 500, annualPremiumDollars: 1_400 }],
      n: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 4 options", () => {
    const result = DeductibleSimulatorFormSchema.safeParse({
      lossDollars: 8_000,
      options: Array.from({ length: 5 }, (_, i) => ({
        deductibleDollars: 100 * (i + 1),
        annualPremiumDollars: 1_000,
      })),
      n: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative dollar amounts", () => {
    const result = DeductibleSimulatorFormSchema.safeParse({
      lossDollars: -1,
      options: [
        { deductibleDollars: 500, annualPremiumDollars: 1_400 },
        { deductibleDollars: 1_000, annualPremiumDollars: 1_250 },
      ],
      n: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer n", () => {
    const result = DeductibleSimulatorFormSchema.safeParse({
      lossDollars: 8_000,
      options: [
        { deductibleDollars: 500, annualPremiumDollars: 1_400 },
        { deductibleDollars: 1_000, annualPremiumDollars: 1_250 },
      ],
      n: 2.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("dollarsToCents", () => {
  it("converts whole dollars exactly", () => {
    expect(dollarsToCents(1_400)).toBe(140_000);
  });

  it("rounds to the nearest cent", () => {
    expect(dollarsToCents(1.004)).toBe(100);
    expect(dollarsToCents(1.006)).toBe(101);
  });
});
