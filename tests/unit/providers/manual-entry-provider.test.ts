import { describe, expect, it } from "vitest";
import { ManualEntryProvider } from "@/providers/manual-entry-provider";
import type { ProviderPolicy } from "@/schemas/provider-policy";

const validPolicy: ProviderPolicy = {
  id: "my-car-policy",
  role: "current",
  source: "entered",
  label: "My current car policy",
  policy: {
    policyType: "car",
    termMonths: 12,
    provenance: "entered",
    annualPremiumCents: 150_000,
    coverages: [{ code: "liability", included: true, deductibleCents: 0 }],
    endorsements: [],
    limitations: [],
  },
};

describe("ManualEntryProvider (PRD CMP-6)", () => {
  it("returns validated policies unchanged", () => {
    const provider = new ManualEntryProvider([validPolicy]);
    const result = provider.listPolicies();

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value).toEqual([validPolicy]);
  });

  it("returns an empty, valid result when given no policies", () => {
    const provider = new ManualEntryProvider([]);
    const result = provider.listPolicies();

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value).toEqual([]);
  });

  it("rejects a policy with mismatched source/provenance as invalid", () => {
    const malformed: ProviderPolicy = {
      ...structuredClone(validPolicy),
      source: "sample", // but policy.provenance is "entered"
    };
    const provider = new ManualEntryProvider([malformed]);
    const result = provider.listPolicies();

    expect(result.status).toBe("invalid");
  });

  it("rejects a policy with duplicate coverage codes as invalid", () => {
    const malformed: ProviderPolicy = {
      ...structuredClone(validPolicy),
      policy: {
        ...structuredClone(validPolicy.policy),
        coverages: [
          { code: "liability", included: true },
          { code: "liability", included: false },
        ],
      },
    };
    const provider = new ManualEntryProvider([malformed]);
    const result = provider.listPolicies();

    expect(result.status).toBe("invalid");
  });

  it("rejects negative money as invalid", () => {
    const malformed: ProviderPolicy = {
      ...structuredClone(validPolicy),
      policy: { ...structuredClone(validPolicy.policy), annualPremiumCents: -1 },
    };
    const provider = new ManualEntryProvider([malformed]);
    const result = provider.listPolicies();

    expect(result.status).toBe("invalid");
  });

  it("trace: records how many policies were validated", () => {
    const provider = new ManualEntryProvider([validPolicy]);
    const result = provider.listPolicies();

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("PROVIDER-MANUAL-ENTRY");
    expect(result.trace.steps[0].result).toBe(1);
  });
});
