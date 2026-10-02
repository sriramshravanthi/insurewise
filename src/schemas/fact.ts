import { z } from "zod";
import { ProvenanceSchema } from "./provenance";

// docs/ARCHITECTURE.md §3: "Engine (rules + calculations) -> Verified
// results with provenance + calculation traces -> ... AI fact packet ->
// explanation." A Fact is the AI-facing shape of one already-computed or
// already-entered value — never a place to introduce a new, unverified
// number (CLAUDE.md rule 1).
export const FactSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  /** e.g. "%" — same convention as NumericValue's `unit` prop. */
  unit: z.string().optional(),
  provenance: ProvenanceSchema,
  sourceId: z.string().optional(),
});
export type Fact = z.infer<typeof FactSchema>;

// docs/ARCHITECTURE.md §3: "Nothing flows to the AI that did not pass
// through this path." `insufficientData` mirrors the engine's own
// insufficient_data status (src/schemas/result.ts) for PRD AI-3: "says so
// when verified data is missing."
export const FactPacketSchema = z.object({
  facts: z.array(FactSchema),
  insufficientData: z.boolean(),
});
export type FactPacket = z.infer<typeof FactPacketSchema>;
