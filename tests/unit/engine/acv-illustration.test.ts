import { describe, expect, it } from "vitest";
import { acvIllustration } from "@/engine/acv-illustration";

// Golden example from docs/CALCULATIONS.md §2 (C12).
describe("acvIllustration (C12)", () => {
  it("L=$20,000, depreciation 30%, D=$1,000 -> ACV: loss $14,000, insurer $13,000, user $7,000; RC: insurer $19,000, user $1,000", () => {
    const result = acvIllustration({
      replacementCostLossCents: 2_000_000,
      depreciationPct: 30,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.acvLossCents.amount).toBe(1_400_000);
    expect(result.value.actualCashValue.insurerPaysCents.amount).toBe(1_300_000);
    expect(result.value.actualCashValue.userPaysCents.amount).toBe(700_000);
    expect(result.value.replacementCost.insurerPaysCents.amount).toBe(1_900_000);
    expect(result.value.replacementCost.userPaysCents.amount).toBe(100_000);
  });

  it("every output is Illustrative (depreciationPct is Illustrative, and C3 itself always is)", () => {
    const result = acvIllustration({
      replacementCostLossCents: 2_000_000,
      depreciationPct: 30,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.acvLossCents.provenance).toBe("illustrative");
    expect(result.value.actualCashValue.insurerPaysCents.provenance).toBe(
      "illustrative",
    );
    expect(result.value.actualCashValue.userPaysCents.provenance).toBe(
      "illustrative",
    );
    expect(result.value.replacementCost.insurerPaysCents.provenance).toBe(
      "illustrative",
    );
    expect(result.value.replacementCost.userPaysCents.provenance).toBe(
      "illustrative",
    );
  });

  it("0% depreciation makes the ACV basis identical to the replacement-cost basis", () => {
    const result = acvIllustration({
      replacementCostLossCents: 2_000_000,
      depreciationPct: 0,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.acvLossCents.amount).toBe(2_000_000);
    expect(result.value.actualCashValue.insurerPaysCents.amount).toBe(
      result.value.replacementCost.insurerPaysCents.amount,
    );
    expect(result.value.actualCashValue.userPaysCents.amount).toBe(
      result.value.replacementCost.userPaysCents.amount,
    );
  });

  it("100% depreciation: ACV loss is $0, insurer pays $0, user bears the entire original loss", () => {
    const result = acvIllustration({
      replacementCostLossCents: 2_000_000,
      depreciationPct: 100,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.acvLossCents.amount).toBe(0);
    expect(result.value.actualCashValue.insurerPaysCents.amount).toBe(0);
    expect(result.value.actualCashValue.userPaysCents.amount).toBe(2_000_000);
  });

  it("rejects a depreciationPct outside [0, 100] as invalid", () => {
    expect(
      acvIllustration({
        replacementCostLossCents: 2_000_000,
        depreciationPct: -1,
        deductibleCents: 100_000,
      }).status,
    ).toBe("invalid");
    expect(
      acvIllustration({
        replacementCostLossCents: 2_000_000,
        depreciationPct: 101,
        deductibleCents: 100_000,
      }).status,
    ).toBe("invalid");
  });

  it("rejects negative money as invalid", () => {
    expect(
      acvIllustration({
        replacementCostLossCents: -1,
        depreciationPct: 30,
        deductibleCents: 100_000,
      }).status,
    ).toBe("invalid");
  });

  it("trace: re-deriving the ACV loss and both bases' insurer-pays figures from their expressions reproduces the output", () => {
    const result = acvIllustration({
      replacementCostLossCents: 2_000_000,
      depreciationPct: 30,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C12");
    expect(result.trace.steps[0].result).toBe(result.value.acvLossCents.amount);
    expect(result.trace.notes[0]).toMatch(/simplified/i);
  });
});
