import { describe, expect, it } from "vitest";
import { annualizePremium } from "@/engine/annualize-premium";

// Golden examples and edge cases from docs/CALCULATIONS.md §2 (C1).
describe("annualizePremium (C1)", () => {
  it("annualizes a six-month term premium: $900 → $1,800/yr", () => {
    const result = annualizePremium({
      amountCents: 90_000,
      amountBasis: "per_term",
      termMonths: 6,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.annualPremium.amount).toBe(180_000);
    expect(result.value.annualPremium.provenance).toBe("calculated");
    expect(result.trace.formulaId).toBe("C1");
  });

  it("annualizes a monthly installment premium: $150/mo → $1,800/yr", () => {
    const result = annualizePremium({
      amountCents: 15_000,
      amountBasis: "per_installment",
      installmentsPerYear: 12,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.annualPremium.amount).toBe(180_000);
  });

  it("returns insufficient_data when the term is missing for a per_term premium", () => {
    const result = annualizePremium({
      amountCents: 90_000,
      amountBasis: "per_term",
      provenance: "entered",
    });

    expect(result).toEqual({
      status: "insufficient_data",
      missing: ["termMonths"],
    });
  });

  it("returns invalid when the term does not divide 12", () => {
    const result = annualizePremium({
      amountCents: 90_000,
      amountBasis: "per_term",
      termMonths: 5,
      provenance: "entered",
    });

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.errors[0].field).toBe("termMonths");
    expect(result.errors[0].code).toBe("not_divisor_of_12");
  });

  it("returns ok with a note for a zero premium", () => {
    const result = annualizePremium({
      amountCents: 0,
      amountBasis: "per_term",
      termMonths: 12,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.annualPremium.amount).toBe(0);
    expect(result.trace.notes).toContain("Entered premium is $0.00.");
  });

  it("annualizes a recurring per-term fee and excludes a one-time fee by default", () => {
    const result = annualizePremium({
      amountCents: 90_000,
      amountBasis: "per_term",
      termMonths: 6,
      fees: [
        { amountCents: 1_000, recurrence: "per_term" },
        { amountCents: 2_500, recurrence: "one_time" },
      ],
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    // 90,000 * 2 + 1,000 * 2 = 182,000; the 2,500 one-time fee is excluded.
    expect(result.value.annualPremium.amount).toBe(182_000);
    expect(result.value.oneTimeFeesCents).toBe(2_500);
  });

  it("includes one-time fees when opted in", () => {
    const result = annualizePremium({
      amountCents: 90_000,
      amountBasis: "per_term",
      termMonths: 6,
      fees: [{ amountCents: 2_500, recurrence: "one_time" }],
      includeOneTimeFees: true,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.annualPremium.amount).toBe(182_500);
  });

  it("labels the output Illustrative when the input is Illustrative", () => {
    const result = annualizePremium({
      amountCents: 90_000,
      amountBasis: "per_term",
      termMonths: 6,
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.annualPremium.provenance).toBe("illustrative");
  });

  it("rejects negative money as invalid", () => {
    const result = annualizePremium({
      amountCents: -100,
      amountBasis: "per_term",
      termMonths: 12,
      provenance: "entered",
    });

    expect(result.status).toBe("invalid");
  });
});
