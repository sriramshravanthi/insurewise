import { z } from "zod";

// docs/RESEARCH-SOURCES.md §2: "V0 | Claim noted, no source captured | No.
// V1 | ...excerpt...; full document not yet captured | No. V2 | Full
// primary document captured... claim confirmed... second-pass human check
// recorded | Yes. WATCH | Verified once but known to be changing... | Only
// with a visible 'as of' date." docs/DATA-MODEL.md §3: "Only level V2 is
// exposed to the app."
export const ReferenceFactLevelSchema = z.enum(["v0", "v1", "v2", "watch"]);
export type ReferenceFactLevel = z.infer<typeof ReferenceFactLevelSchema>;

export const ReferenceLineSchema = z.enum(["auto", "home", "both"]);

// docs/RESEARCH-SOURCES.md §2: "Every V2 record stores: source_id, url,
// retrieved_at, section_or_page, effective_from, effective_to (nullable),
// verified_by, verified_at, recheck_by." Enforced below: a record claiming
// level "v2" must actually carry verifiedAt and effectiveFrom (CLAUDE.md
// quality gate: "New Reference record -> source ID, effective date,
// verified_at (CI fails otherwise)").
export const ReferenceFactSchema = z
  .object({
    /** e.g. "RF-CA-AUTO-001", matching docs/RESEARCH-SOURCES.md §4. */
    id: z.string().regex(/^RF-[A-Z]{2}-[A-Z]+-\d{3,}$/),
    jurisdiction: z.string().length(2),
    topic: z.string().min(1),
    line: ReferenceLineSchema,
    statementTemplate: z.string().min(1),
    level: ReferenceFactLevelSchema,
    sourceIds: z.array(z.string()).min(1),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
    verifiedAt: z.string().optional(),
    recheckBy: z.string().optional(),
  })
  .refine(
    (fact) => fact.level !== "v2" || (fact.verifiedAt !== undefined && fact.effectiveFrom !== undefined),
    { message: 'A "v2" reference fact must carry verifiedAt and effectiveFrom.' },
  );
export type ReferenceFact = z.infer<typeof ReferenceFactSchema>;

// docs/DATA-MODEL.md §3: "reference_fact_schedule | ... Scheduled future
// changes (shown as 'scheduled,' never as current)." Kept as its own type
// so a schedule entry can never be read through the "current fact"
// accessor by mistake (docs/RESEARCH-SOURCES.md RF-CA-AUTO-003: "Model as
// a scheduled rule change; never display as current").
export const ReferenceFactScheduleSchema = z.object({
  id: z.string().min(1),
  factId: z.string().min(1),
  scheduledEffectiveFrom: z.string(),
  sourceIds: z.array(z.string()).min(1),
  note: z.string().min(1),
});
export type ReferenceFactSchedule = z.infer<typeof ReferenceFactScheduleSchema>;
