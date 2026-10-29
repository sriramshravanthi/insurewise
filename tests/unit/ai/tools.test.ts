import { describe, expect, it } from "vitest";
import { createFactLookupTool, LOOKUP_FACT_TOOL_NAME } from "@/ai/tools";
import { buildFactPacket } from "@/ai/fact-packet";

describe("createFactLookupTool (docs/PRD.md AI-2: read-only lookup tools)", () => {
  const packet = buildFactPacket([
    { id: "fact-1", label: "Fact 1", value: 42, provenance: "calculated" },
  ]);
  const tool = createFactLookupTool(packet);

  it("is named lookup_fact and describes itself as read-only", () => {
    expect(tool.definition.name).toBe(LOOKUP_FACT_TOOL_NAME);
    expect(tool.definition.description).toMatch(/read-only/i);
  });

  it("returns the fact when the id is present in the packet", () => {
    expect(tool.execute({ factId: "fact-1" })).toEqual({
      found: true,
      data: { id: "fact-1", label: "Fact 1", value: 42, provenance: "calculated" },
    });
  });

  it("reports not found for an id outside the packet — it can't reach outside data", () => {
    expect(tool.execute({ factId: "something-else" })).toEqual({ found: false });
  });

  it("reports not found for malformed input rather than throwing", () => {
    expect(tool.execute({})).toEqual({ found: false });
    expect(tool.execute(null)).toEqual({ found: false });
    expect(tool.execute({ factId: 123 })).toEqual({ found: false });
  });
});
