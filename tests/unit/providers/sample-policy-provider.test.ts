import { describe, expect, it } from "vitest";
import { SamplePolicyProvider } from "@/providers/sample-policy-provider";

describe("SamplePolicyProvider (PRD CMP-6 / DEMO-1)", () => {
  it("returns at least one policy, all consistently labeled Sample (CLAUDE.md rule 8)", () => {
    const result = new SamplePolicyProvider().listPolicies();

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.length).toBeGreaterThan(0);
    for (const providerPolicy of result.value) {
      expect(providerPolicy.role).toBe("sample");
      expect(providerPolicy.source).toBe("sample");
      expect(providerPolicy.policy.provenance).toBe("sample");
    }
  });

  it("returns data that validates against ProviderPolicySchema (internal consistency)", async () => {
    const { ProviderPolicySchema } = await import("@/schemas/provider-policy");
    const result = new SamplePolicyProvider().listPolicies();

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    for (const providerPolicy of result.value) {
      expect(ProviderPolicySchema.safeParse(providerPolicy).success).toBe(true);
    }
  });

  it("is deterministic: calling listPolicies twice returns equal data", () => {
    const provider = new SamplePolicyProvider();
    const first = provider.listPolicies();
    const second = provider.listPolicies();

    expect(first).toEqual(second);
  });

  it("trace: notes that the data is fictional", () => {
    const result = new SamplePolicyProvider().listPolicies();

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.trace.formulaId).toBe("PROVIDER-SAMPLE");
    expect(result.trace.notes[0]).toMatch(/fictional/i);
  });
});
