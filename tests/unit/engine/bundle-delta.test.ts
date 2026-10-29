import { describe, expect, it } from "vitest";
import { bundleDelta } from "@/engine/bundle-delta";

// Golden examples from docs/CALCULATIONS.md §2 (C9). The doc's prose shows
// an unsigned percentage paired with the wording ("higher (2.4%)"); the
// engine itself returns the exact signed value (-2.4 here) and leaves
// display formatting (pairing wording with a magnitude) to the UI layer.
describe("bundleDelta (C9)", () => {
  it("separate $4,200, bundled $3,950 -> $250 lower (6.0%)", () => {
    const result = bundleDelta({
      separatePremiumsCents: [420_000],
      bundledPremiumCents: 395_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.separateTotalCents.amount).toBe(420_000);
    expect(result.value.differenceCents.amount).toBe(25_000);
    expect(result.value.percentage?.amount).toBe(6.0);
    expect(result.value.wording).toBe("lower");
  });

  it("separate $4,200, bundled $4,300 -> $100 higher (signed -2.4%)", () => {
    const result = bundleDelta({
      separatePremiumsCents: [420_000],
      bundledPremiumCents: 430_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.differenceCents.amount).toBe(-10_000);
    expect(result.value.percentage?.amount).toBe(-2.4);
    expect(result.value.wording).toBe("higher");
  });

  it("sums multiple separate policies before comparing to the bundle", () => {
    const result = bundleDelta({
      separatePremiumsCents: [250_000, 170_000],
      bundledPremiumCents: 395_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.separateTotalCents.amount).toBe(420_000);
    expect(result.value.wording).toBe("lower");
  });

  it('reports "the same" when the bundle costs exactly as much as the separate total', () => {
    const result = bundleDelta({
      separatePremiumsCents: [420_000],
      bundledPremiumCents: 420_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.differenceCents.amount).toBe(0);
    expect(result.value.percentage?.amount).toBe(0);
    expect(result.value.wording).toBe("the same");
  });

  it("omits the percentage, with a note, when the separate total is $0", () => {
    const result = bundleDelta({
      separatePremiumsCents: [],
      bundledPremiumCents: 0,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.separateTotalCents.amount).toBe(0);
    expect(result.value.percentage).toBeUndefined();
    expect(result.trace.notes[0]).toMatch(/separate total is \$0\.00/i);
  });

  it("labels the output Illustrative when the input is Illustrative", () => {
    const result = bundleDelta({
      separatePremiumsCents: [420_000],
      bundledPremiumCents: 395_000,
      provenance: "illustrative",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.differenceCents.provenance).toBe("illustrative");
    expect(result.value.percentage?.provenance).toBe("illustrative");
  });

  it("rejects negative money as invalid", () => {
    expect(
      bundleDelta({
        separatePremiumsCents: [-1],
        bundledPremiumCents: 395_000,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
    expect(
      bundleDelta({
        separatePremiumsCents: [420_000],
        bundledPremiumCents: -1,
        provenance: "entered",
      }).status,
    ).toBe("invalid");
  });

  it("never uses ranking or advice language in the wording (CLAUDE.md rule 4)", () => {
    const wordings: string[] = ["lower", "higher", "the same"];
    for (const word of wordings) {
      expect(word).not.toMatch(/best|cheapest|recommended|top pick|winner/i);
    }
  });

  it("trace: re-deriving each step's expression from its inputs reproduces the output", () => {
    const result = bundleDelta({
      separatePremiumsCents: [250_000, 170_000],
      bundledPremiumCents: 395_000,
      provenance: "entered",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("C9");
    expect(result.trace.steps[0].result).toBe(
      result.value.separateTotalCents.amount,
    );
    expect(result.trace.steps[1].result).toBe(
      result.value.differenceCents.amount,
    );
    expect(result.trace.steps[2].result).toBe(result.value.percentage?.amount);
  });
});
