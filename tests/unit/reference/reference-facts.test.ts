import { describe, expect, it } from "vitest";
import { ReferenceFactSchema, type ReferenceFact } from "@/schemas/reference-fact";
import { REFERENCE_FACTS, getVerifiedFact } from "@/reference/reference-facts";

// Synthetic fixtures only — not real candidate facts from
// docs/RESEARCH-SOURCES.md §4. The real registry has nothing at V2 yet
// (see src/reference/reference-facts.ts), so these ids are deliberately
// outside the RF-CA-* namespace to avoid any confusion with real content.
const V1_CANDIDATE: ReferenceFact = {
  id: "RF-ZZ-TEST-001",
  jurisdiction: "CA",
  topic: "test_topic",
  line: "auto",
  statementTemplate: "A test statement.",
  level: "v1",
  sourceIds: ["S-TEST-1"],
};

const V2_VERIFIED: ReferenceFact = {
  ...V1_CANDIDATE,
  id: "RF-ZZ-TEST-002",
  level: "v2",
  verifiedAt: "2026-01-01",
  effectiveFrom: "2026-01-01",
};

describe("ReferenceFactSchema (docs/RESEARCH-SOURCES.md §2)", () => {
  it("accepts a v1 candidate without verifiedAt/effectiveFrom", () => {
    expect(ReferenceFactSchema.safeParse(V1_CANDIDATE).success).toBe(true);
  });

  it("accepts a v2 fact only when verifiedAt and effectiveFrom are both present", () => {
    expect(ReferenceFactSchema.safeParse(V2_VERIFIED).success).toBe(true);
    expect(
      ReferenceFactSchema.safeParse({ ...V2_VERIFIED, verifiedAt: undefined }).success,
    ).toBe(false);
    expect(
      ReferenceFactSchema.safeParse({ ...V2_VERIFIED, effectiveFrom: undefined }).success,
    ).toBe(false);
  });

  it("rejects a reference fact with no source", () => {
    expect(
      ReferenceFactSchema.safeParse({ ...V1_CANDIDATE, sourceIds: [] }).success,
    ).toBe(false);
  });
});

describe('getVerifiedFact (docs/DATA-MODEL.md §3: "Only level V2 is exposed to the app")', () => {
  it("finds nothing against the real (currently empty) REFERENCE_FACTS", () => {
    expect(getVerifiedFact("CA", "test_topic")).toBeNull();
  });

  it("never exposes the v1 candidate even when a v2 fact for the same jurisdiction/topic exists", () => {
    const mixed = [V1_CANDIDATE, V2_VERIFIED];
    expect(getVerifiedFact("CA", "test_topic", mixed)).toEqual(V2_VERIFIED);
  });

  it("returns null when only a v1/WATCH candidate exists for that jurisdiction/topic", () => {
    expect(getVerifiedFact("CA", "test_topic", [V1_CANDIDATE])).toBeNull();
  });

  it("REFERENCE_FACTS ships empty — docs/RESEARCH-SOURCES.md has no V2 fact yet", () => {
    expect(REFERENCE_FACTS).toEqual([]);
  });
});
