import { describe, expect, it } from "vitest";
import { outOfPocketOnClaim } from "@/engine/out-of-pocket";

// Golden examples and edge cases from docs/CALCULATIONS.md §2 (C3).
describe("outOfPocketOnClaim (C3)", () => {
  it("L=$8,000, D=$1,000, no limit → insurer $7,000, user $1,000", () => {
    const result = outOfPocketOnClaim({
      lossCents: 800_000,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.insurerPaysCents.amount).toBe(700_000);
    expect(result.value.userPaysCents.amount).toBe(100_000);
    expect(result.value.insurerPaysCents.provenance).toBe("illustrative");
    expect(result.value.userPaysCents.provenance).toBe("illustrative");
  });

  it("L=$500, D=$1,000 → insurer $0, user $500 (loss below deductible)", () => {
    const result = outOfPocketOnClaim({
      lossCents: 50_000,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.insurerPaysCents.amount).toBe(0);
    expect(result.value.userPaysCents.amount).toBe(50_000);
  });

  it("L=$300,000, D=$2,000, M=$250,000, after_deductible → insurer $250,000, user $50,000", () => {
    const result = outOfPocketOnClaim({
      lossCents: 30_000_000,
      deductibleCents: 200_000,
      limitCents: 25_000_000,
      limitBasis: "after_deductible",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.insurerPaysCents.amount).toBe(25_000_000);
    expect(result.value.userPaysCents.amount).toBe(5_000_000);
  });

  it("L=$300,000, D=$2,000, M=$250,000, before_deductible → insurer $248,000, user $52,000", () => {
    const result = outOfPocketOnClaim({
      lossCents: 30_000_000,
      deductibleCents: 200_000,
      limitCents: 25_000_000,
      limitBasis: "before_deductible",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.insurerPaysCents.amount).toBe(24_800_000);
    expect(result.value.userPaysCents.amount).toBe(5_200_000);
  });

  it("a limit smaller than (loss − deductible) caps the insurer's payment at the limit", () => {
    const result = outOfPocketOnClaim({
      lossCents: 100_000,
      deductibleCents: 20_000,
      limitCents: 5_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.insurerPaysCents.amount).toBe(5_000);
    expect(result.value.userPaysCents.amount).toBe(95_000);
  });

  it("loss at or below the deductible: insurer pays $0 regardless of the limit", () => {
    const result = outOfPocketOnClaim({
      lossCents: 10_000,
      deductibleCents: 20_000,
      limitCents: 5_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.insurerPaysCents.amount).toBe(0);
    expect(result.value.userPaysCents.amount).toBe(10_000);
  });

  it("zero loss: both insurer and user pay $0", () => {
    const result = outOfPocketOnClaim({
      lossCents: 0,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.insurerPaysCents.amount).toBe(0);
    expect(result.value.userPaysCents.amount).toBe(0);
  });

  it("rejects negative money as invalid", () => {
    const result = outOfPocketOnClaim({
      lossCents: -100,
      deductibleCents: 100_000,
    });

    expect(result.status).toBe("invalid");
  });
});
