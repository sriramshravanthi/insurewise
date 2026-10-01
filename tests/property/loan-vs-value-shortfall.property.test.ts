import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { loanVsValueShortfall } from "@/engine/loan-vs-value-shortfall";

describe("loanVsValueShortfall (C14) properties", () => {
  it("matches max(0, loanBalance - vehicleValue) exactly, and is never NaN/Infinity/negative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.boolean(),
        (loanBalanceCents, vehicleValueCents, gapCoverageEntered) => {
          const result = loanVsValueShortfall({
            loanBalanceCents,
            vehicleValueCents,
            gapCoverageEntered,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          const shortfall = result.value.shortfallCents.amount;

          expect(Number.isFinite(shortfall)).toBe(true);
          expect(shortfall).toBeGreaterThanOrEqual(0);
          expect(shortfall).toBe(
            Math.max(0, loanBalanceCents - vehicleValueCents),
          );
        },
      ),
    );
  });

  it("gapCoverageEntered always round-trips unchanged with Entered provenance", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.boolean(),
        (loanBalanceCents, vehicleValueCents, gapCoverageEntered) => {
          const result = loanVsValueShortfall({
            loanBalanceCents,
            vehicleValueCents,
            gapCoverageEntered,
            provenance: "entered",
          });

          expect(result.status).toBe("ok");
          if (result.status !== "ok") return;
          expect(result.value.gapCoverageEntered.amount).toBe(
            gapCoverageEntered,
          );
          expect(result.value.gapCoverageEntered.provenance).toBe("entered");
        },
      ),
    );
  });

  it("increasing the loan balance never decreases the shortfall, and increasing vehicle value never increases it", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (loanBalanceCents, vehicleValueCents, delta) => {
          const base = loanVsValueShortfall({
            loanBalanceCents,
            vehicleValueCents,
            gapCoverageEntered: false,
            provenance: "entered",
          });
          const moreLoan = loanVsValueShortfall({
            loanBalanceCents: loanBalanceCents + delta,
            vehicleValueCents,
            gapCoverageEntered: false,
            provenance: "entered",
          });
          const moreValue = loanVsValueShortfall({
            loanBalanceCents,
            vehicleValueCents: vehicleValueCents + delta,
            gapCoverageEntered: false,
            provenance: "entered",
          });

          if (
            base.status !== "ok" ||
            moreLoan.status !== "ok" ||
            moreValue.status !== "ok"
          ) {
            return;
          }
          expect(moreLoan.value.shortfallCents.amount).toBeGreaterThanOrEqual(
            base.value.shortfallCents.amount,
          );
          expect(moreValue.value.shortfallCents.amount).toBeLessThanOrEqual(
            base.value.shortfallCents.amount,
          );
        },
      ),
    );
  });
});
