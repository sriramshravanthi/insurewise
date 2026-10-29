import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { annualizePremium } from "@/engine/annualize-premium";

const divisorsOf12 = [1, 2, 3, 4, 6, 12];

describe("annualizePremium (C1) properties", () => {
  it("never returns NaN, Infinity, or negative money for valid inputs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.constantFrom(...divisorsOf12),
        (amountCents, termMonths) => {
          const result = annualizePremium({
            amountCents,
            amountBasis: "per_term",
            termMonths,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const amount = result.value.annualPremium.amount;
          expect(Number.isFinite(amount)).toBe(true);
          expect(Number.isNaN(amount)).toBe(false);
          expect(amount).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it("round-trips: a per-installment monthly premium times 12 equals the equivalent 12-month per-term premium", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), (monthlyCents) => {
        const perInstallment = annualizePremium({
          amountCents: monthlyCents,
          amountBasis: "per_installment",
          installmentsPerYear: 12,
          provenance: "entered",
        });
        const perTerm = annualizePremium({
          amountCents: monthlyCents,
          amountBasis: "per_term",
          termMonths: 1,
          provenance: "entered",
        });

        expect(perInstallment.status).toBe("ok");
        expect(perTerm.status).toBe("ok");
        if (perInstallment.status !== "ok" || perTerm.status !== "ok") return;
        expect(perInstallment.value.annualPremium.amount).toBe(
          perTerm.value.annualPremium.amount,
        );
      }),
    );
  });
});
