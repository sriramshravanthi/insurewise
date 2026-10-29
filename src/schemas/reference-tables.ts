/**
 * Zod schemas for reference tables (read-only to users).
 * Mirrors DATA-MODEL.md §4.
 */
import { z } from "zod";
import { UuidZ, CentsZ, DateStringZ, TimestampZ, ShortTextZ, NotesZ } from "./common";
import { SourceTierZ, FactLevelZ, FactLineZ, FactAppliesBasisZ, InsuranceLineZ, ReviewSeverityZ } from "./enums";

// ---------------------------------------------------------------------------
// sources
// ---------------------------------------------------------------------------

export const SourceRowZ = z.object({
  id: z.string().regex(/^S-\d{3,}$/),
  title: z.string().max(500),
  publisher: z.string().max(200),
  tier: SourceTierZ,
  url: z.string().url().optional().nullable(),
  retrieved_at: DateStringZ,
  section_or_page: z.string().max(200).optional().nullable(),
  notes: NotesZ,
});

// ---------------------------------------------------------------------------
// jurisdictions
// ---------------------------------------------------------------------------

export const JurisdictionRowZ = z.object({
  code: z.string().length(2).toUpperCase(),
  name: z.string().max(100),
  supported: z.boolean(),
  supported_since: DateStringZ.optional().nullable(),
});

// ---------------------------------------------------------------------------
// reference_facts
// ---------------------------------------------------------------------------

export const ReferenceFactValueZ = z.record(z.unknown()); // structured, varies by topic

export const ReferenceFactRowZ = z.object({
  id: z.string().regex(/^RF-/),
  jurisdiction: z.string().length(2).toUpperCase(),
  topic: z.string().max(100),
  line: FactLineZ,
  statement_template: z.string().max(2000),
  value: ReferenceFactValueZ,
  level: FactLevelZ,
  recheck_by: DateStringZ.optional().nullable(),
});

// ---------------------------------------------------------------------------
// reference_fact_versions
// ---------------------------------------------------------------------------

export const ReferenceFactVersionRowZ = z.object({
  id: UuidZ,
  fact_id: z.string().regex(/^RF-/),
  effective_from: DateStringZ,
  effective_to: DateStringZ.optional().nullable(),
  applies_basis: FactAppliesBasisZ,
  value: ReferenceFactValueZ,
  supersedes_id: UuidZ.optional().nullable(),
});

// ---------------------------------------------------------------------------
// reference_fact_schedule
// ---------------------------------------------------------------------------

export const ReferenceFactScheduleRowZ = z.object({
  id: UuidZ,
  fact_id: z.string().regex(/^RF-/),
  scheduled_effective_from: DateStringZ,
  value: ReferenceFactValueZ,
  source_id: z.string().regex(/^S-\d{3,}$/),
});

// ---------------------------------------------------------------------------
// fact_sources (join)
// ---------------------------------------------------------------------------

export const FactSourceRowZ = z.object({
  fact_id: z.string().regex(/^RF-/),
  source_id: z.string().regex(/^S-\d{3,}$/),
  section: z.string().max(200).optional().nullable(),
});

// ---------------------------------------------------------------------------
// coverage_definitions
// ---------------------------------------------------------------------------

export const CommonLimitationZ = z.object({
  text: z.string().max(1000),
  source_id: z.string().regex(/^S-\d{3,}$/).optional(),
});

export const CoverageDefinitionRowZ = z.object({
  code: z.string().max(50),
  line: InsuranceLineZ,
  name: z.string().max(200),
  plain_language: z.string().max(5000),
  example: z.string().max(2000).optional().nullable(),
  common_limitations: z.array(CommonLimitationZ).optional().nullable(),
  source_ids: z.array(z.string().regex(/^S-\d{3,}$/)),
});

// ---------------------------------------------------------------------------
// glossary_terms
// ---------------------------------------------------------------------------

export const GlossaryTermRowZ = z.object({
  slug: z.string().max(100).regex(/^[a-z0-9-]+$/),
  term: z.string().max(200),
  short_def: z.string().max(500),
  long_def: z.string().max(10000),
  related: z.array(z.string().max(100)).optional().nullable(),
  source_ids: z.array(z.string().regex(/^S-\d{3,}$/)),
});

// ---------------------------------------------------------------------------
// rating_factors
// ---------------------------------------------------------------------------

export const RatingFactorStatusZ = z.enum(["verified", "watch"]);

export const RatingFactorRowZ = z.object({
  id: UuidZ,
  line: InsuranceLineZ,
  category: ShortTextZ,
  factor: z.string().max(200),
  how_commonly_considered: z.string().max(500).optional().nullable(),
  jurisdiction_notes: z.record(z.string()).optional().nullable(),
  status: RatingFactorStatusZ,
  source_ids: z.array(z.string().regex(/^S-\d{3,}$/)),
});

// ---------------------------------------------------------------------------
// review_rules (reference data)
// ---------------------------------------------------------------------------

export const ReviewRuleParametersZ = z.object({
  schema_version: z.number().int().positive(),
  provenance: z.literal("Illustrative"),
}).passthrough();

export const ReviewRuleRowZ = z.object({
  id: z.string().max(50),
  line: InsuranceLineZ,
  applies_to: z.enum(["car", "home", "both"]),
  required_inputs: z.array(z.string()),
  condition: z.record(z.unknown()), // structured expression
  parameters: ReviewRuleParametersZ,
  severity: ReviewSeverityZ,
  message_template_id: z.string().max(50),
  question_template_id: z.string().max(50).optional().nullable(),
  source_ids: z.array(z.string().regex(/^S-\d{3,}$/)),
});

// ---------------------------------------------------------------------------
// message_templates
// ---------------------------------------------------------------------------

export const MessageTemplateRowZ = z.object({
  id: z.string().max(50),
  text: z.string().max(2000),
  locale: z.string().default("en"),
});

// ---------------------------------------------------------------------------
// claims_workflows / claims_steps
// ---------------------------------------------------------------------------

export const ClaimsWorkflowRowZ = z.object({
  id: UuidZ,
  workflow_type: z.string().max(100),
  label: z.string().max(200),
  disclaimer_id: z.string().max(50).optional().nullable(),
  source_ids: z.array(z.string().regex(/^S-\d{3,}$/)),
});

export const ClaimsStepRowZ = z.object({
  id: UuidZ,
  workflow_id: UuidZ,
  step_order: z.number().int().nonnegative(),
  branch_conditions: z.record(z.unknown()).optional().nullable(),
  text: z.string().max(5000),
  source_ids: z.array(z.string().regex(/^S-\d{3,}$/)),
});

// ---------------------------------------------------------------------------
// checklist_items
// ---------------------------------------------------------------------------

export const ChecklistItemRowZ = z.object({
  id: z.string().max(50),
  line: InsuranceLineZ,
  text: z.string().max(1000),
  why_it_matters: z.string().max(2000).optional().nullable(),
  source_ids: z.array(z.string().regex(/^S-\d{3,}$/)),
});

// ---------------------------------------------------------------------------
// sample_households / sample_documents
// ---------------------------------------------------------------------------

export const SampleHouseholdRowZ = z.object({
  id: UuidZ,
  fixture: z.record(z.unknown()),
  is_sample: z.literal(true),
  created_at: TimestampZ,
});

export const SampleDocumentRowZ = z.object({
  id: UuidZ,
  fixture: z.record(z.unknown()),
  is_sample: z.literal(true),
  created_at: TimestampZ,
});

// Inferred types
export type SourceRow = z.infer<typeof SourceRowZ>;
export type ReferenceFactRow = z.infer<typeof ReferenceFactRowZ>;
export type ReferenceFactVersionRow = z.infer<typeof ReferenceFactVersionRowZ>;
export type CoverageDefinitionRow = z.infer<typeof CoverageDefinitionRowZ>;
export type GlossaryTermRow = z.infer<typeof GlossaryTermRowZ>;
export type ReviewRuleRow = z.infer<typeof ReviewRuleRowZ>;
export type MessageTemplateRow = z.infer<typeof MessageTemplateRowZ>;
export type ChecklistItemRow = z.infer<typeof ChecklistItemRowZ>;
