import { z } from "zod";

// docs/PRD.md AI-4: "Output validator: schema, citation presence, numeric
// grounding, language policy; regenerate once then safe fallback." This is
// the schema half of that check (src/ai/output-validator.ts does the rest).
// The model is instructed (src/ai/system-prompt.ts) to respond with exactly
// this shape.
export const AssistantOutputSchema = z.object({
  answer: z.string().min(1),
  /** Fact ids from the fact packet backing every claim in `answer` (PRD AI-2). */
  citedFactIds: z.array(z.string()),
  /** Set true instead of guessing when the fact packet doesn't cover the question (PRD AI-3). */
  insufficientData: z.boolean().optional(),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;
