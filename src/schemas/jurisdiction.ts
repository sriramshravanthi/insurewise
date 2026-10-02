import { z } from "zod";

// docs/DATA-MODEL.md §3: "jurisdictions | code, name, supported (bool),
// supported_since | MVP: CA supported for auto and home content." Whether
// a jurisdiction is "supported" is a product/engineering decision (PRD D1:
// "California-first... multi-state architecture"), not an insurance fact —
// it needs no RESEARCH-SOURCES.md citation.
export const JurisdictionSchema = z.object({
  code: z.string().length(2),
  name: z.string().min(1),
  supported: z.boolean(),
  supportedSince: z.string(),
});
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;
