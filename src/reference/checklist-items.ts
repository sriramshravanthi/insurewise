import { ChecklistItemSchema, type ChecklistItem } from "@/schemas/checklist-item";

// PRD HOM-4: sourced risk-checklist items ("why it matters" plus a
// citation) — distinct from the structural, unsourced profile-completeness
// checklist already in src/features/home (buildChecklist). Empty for the
// same reason as the other catalogs: no checklist item has a V2 source
// yet (docs/RESEARCH-SOURCES.md §7's home backlog — FAIR Plan scope,
// wildfire non-renewal rules, etc. — is still Phase 0).
const RAW_CHECKLIST_ITEMS: ChecklistItem[] = [];

export const CHECKLIST_ITEMS: ChecklistItem[] = RAW_CHECKLIST_ITEMS.map((item) =>
  ChecklistItemSchema.parse(item),
);

export function getChecklistItems(
  line: ChecklistItem["line"],
  items: ChecklistItem[] = CHECKLIST_ITEMS,
): ChecklistItem[] {
  return items.filter((item) => item.line === line);
}
