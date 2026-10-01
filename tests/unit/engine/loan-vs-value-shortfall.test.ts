import { describe, expect, it } from "vitest";
import { loanVsValueShortfall } from "@/engine/loan-vs-value-shortfall";

// Golden example from docs/CALCULATIONS.md §2 (C14).
describe("loanVsValueShortfall (C14)", () => {
  it("loan $22,000, vehicle value $18,500 -> shortfall $3,500", () => {
    const result = loanVsValueShortfall({
      loanBalanceCents: 2_200_000,
      vehicleValueCents: 1_850_000,
      gapCoverageEntered: false,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.shortfallCents.amount).toBe(350_000);
    expect(result.value.shortfallCents.provenance).toBe("calculated");
  });

  it("reports gapCoverageEntered back unchanged, always as Entered provenance", () => {
    const result = loanVsValueShortfall({
      loanBalanceCents: 2_200_000,
      vehicleValueCents: 1_850_000,
      gapCoverageEntered: true,
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.gapCoverageEntered.amount).toBe(true);
    expect(result.value.gapCoverageEntered.provenance).toBe("entered");
    // Unlike gapCoverageEntered, the shortfall does follow the input provenance.
    expect(result.value.shortfallCents.provenance).toBe("illustrative");
  });

  it("returns a $0 shortfall when the vehicle value meets or exceeds the loan balance", () => {
    const result = loanVsValueShortfall({
      loanBalanceCents: 1_000_000,
      vehicleValueCents: 1_200_000,
      gapCoverageEntered: false,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.shortfallCents.amount).toBe(0);
  });

  it("rejects negative money as invalid", () => {
    expect(
      loanVsValueShortfall({
        loanBalanceCents: -1,
        vehicleValueCents: 1_850_000,
        gapCoverageEntered: false,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
    expect(
      loanVsValueShortfall({
        loanBalanceCents: 2_200_000,
        vehicleValueCents: -1,
        gapCoverageEntered: false,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
  });

  it("rejects a non-boolean gapCoverageEntered as invalid", () => {
    const result = loanVsValueShortfall({
      loanBalanceCents: 2_200_000,
      vehicleValueCents: 1_850_000,
      // @ts-expect-error -- deliberately invalid for this test
      gapCoverageEntered: "yes",
      provenance: "entered",
    });

    expect(result.status).toBe("invalid");
  });

  it("trace: re-deriving the shortfall from its expression reproduces the output", () => {
    const result = loanVsValueShortfall({
      loanBalanceCents: 2_200_000,
      vehicleValueCents: 1_850_000,
      gapCoverageEntered: false,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C14");
    expect(result.trace.steps[0].result).toBe(result.value.shortfallCents.amount);
  });
});
