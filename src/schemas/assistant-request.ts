import { z } from "zod";
import { FactSchema } from "./fact";

// docs/ARCHITECTURE.md §6: "Zod input/output validation" on every /api/v1
// route. Bounds (question length, fact count) double as a crude token
// budget (PRD AI-5) at the request boundary.
export const AssistantRequestSchema = z.object({
  question: z.string().min(1).max(500),
  facts: z.array(FactSchema).max(50),
});
export type AssistantRequest = z.infer<typeof AssistantRequestSchema>;
