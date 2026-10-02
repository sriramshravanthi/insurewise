import { describe, expect, it } from "vitest";
import { ChecklistItemSchema, type ChecklistItem } from "@/schemas/checklist-item";
import { CHECKLIST_ITEMS, getChecklistItems } from "@/reference/checklist-items";

const SYNTHETIC: ChecklistItem = {
  id: "CHK-TEST-1",
  line: "home",
  text: "A test checklist item.",
  whyItMatters: "It matters, for tests only.",
  sourceIds: ["S-TEST-1"],
};

describe("ChecklistItemSchema (docs/DATA-MODEL.md §3; PRD HOM-4)", () => {
  it("requires at least one source id", () => {
    expect(ChecklistItemSchema.safeParse({ ...SYNTHETIC, sourceIds: [] }).success).toBe(false);
  });
});

describe("getChecklistItems", () => {
  it("ships with no items yet — nothing has reached docs/RESEARCH-SOURCES.md V2", () => {
    expect(CHECKLIST_ITEMS).toEqual([]);
    expect(getChecklistItems("home")).toEqual([]);
  });

  it("filters by line against injected data", () => {
    expect(getChecklistItems("home", [SYNTHETIC])).toEqual([SYNTHETIC]);
    expect(getChecklistItems("auto", [SYNTHETIC])).toEqual([]);
  });
});
