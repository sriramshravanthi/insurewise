import { z } from "zod";

// docs/DATA-MODEL.md §3: "checklist_items | id, line, text, why_it_matters,
// source_ids." PRD HOM-4: "Home risk checklist with progress." This is the
// *sourced* checklist content — distinct from the structural, unsourced
// profile-completeness checklist already built in src/features/home
// (buildChecklist), which stays as-is.
export const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  line: z.enum(["auto", "home"]),
  text: z.string().min(1),
  whyItMatters: z.string().min(1),
  sourceIds: z.array(z.string()).min(1),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
