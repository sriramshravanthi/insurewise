import { z } from "zod";

// The five labels every displayed number must carry (CLAUDE.md rule 3; PRD INT-1).
export const ProvenanceSchema = z.enum([
  "entered",
  "calculated",
  "reference",
  "illustrative",
  "sample",
]);

export type Provenance = z.infer<typeof ProvenanceSchema>;

export const PROVENANCE_LABELS: Record<Provenance, string> = {
  entered: "Entered",
  calculated: "Calculated",
  reference: "Reference",
  illustrative: "Illustrative",
  sample: "Sample",
};
