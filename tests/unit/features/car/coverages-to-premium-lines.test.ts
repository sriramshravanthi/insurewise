import { describe, expect, it } from "vitest";
import { coveragesToPremiumLines } from "@/features/car/car-profile";

describe("coveragesToPremiumLines", () => {
  it("includes only included coverages with a line premium entered", () => {
    const lines = coveragesToPremiumLines([
      { code: "liability", included: true, linePremiumDollars: 600 },
      { code: "collision", included: true }, // no premium entered
      { code: "comprehensive", included: false, linePremiumDollars: 150 }, // not included
      { code: "um", included: true, linePremiumDollars: 100 },
    ]);

    expect(lines).toEqual([
      { key: "liability", label: "liability", amountCents: 60_000 },
      { key: "um", label: "um", amountCents: 10_000 },
    ]);
  });
});
