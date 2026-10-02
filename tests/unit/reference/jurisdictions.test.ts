import { describe, expect, it } from "vitest";
import { getJurisdiction, isJurisdictionSupported } from "@/reference/jurisdictions";

describe("JURISDICTIONS (PRD D1; docs/DATA-MODEL.md §3)", () => {
  it("marks California supported for this MVP", () => {
    expect(isJurisdictionSupported("CA")).toBe(true);
    expect(getJurisdiction("CA")).toEqual({
      code: "CA",
      name: "California",
      supported: true,
      supportedSince: "2026-10-01",
    });
  });

  it('is not supported for a jurisdiction that was never added — PRD PLT-4\'s "not available yet" path', () => {
    expect(isJurisdictionSupported("TX")).toBe(false);
    expect(getJurisdiction("TX")).toBeNull();
  });
});
