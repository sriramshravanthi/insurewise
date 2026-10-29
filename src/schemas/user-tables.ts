/**
 * Zod schemas for all user-owned tables.
 * Mirrors DATA-MODEL.md §3.
 */
import { z } from "zod";
import {
  UuidZ, CentsZ, OptCentsZ, StateCodeZ, Zip5Z, TimestampZ,
  ShortTextZ, LabelZ, NotesZ, SchemaVersionZ, PctZ,
} from "./common";
import {
  OwnershipZ, VehicleUseZ, VehicleParkingZ, MileageBandZ,
  AgeBandZ, YearsLicensedBandZ, PropertyTypeZ, ConstructionTypeZ,
  FoundationTypeZ, RoofMaterialZ, RoofAgeBandZ, PolicyTypeZ,
  PolicyRoleZ, PolicySourceZ, AmountBasisZ, ValuationBasisZ,
  DeductiblePctBasisZ, ScenarioKindZ, ReviewStatusZ, ReviewSeverityZ,
  ChecklistStateZ, AssistantRoleZ, LimitationOriginZ,
} from "./enums";

// ---------------------------------------------------------------------------
// households
// ---------------------------------------------------------------------------

export const HouseholdInsertZ = z.object({
  id: UuidZ.optional(),
  owner_id: UuidZ,
  label: LabelZ,
  state: StateCodeZ,
  zip5: Zip5Z,
  is_sample: z.boolean().default(false),
});

export const HouseholdRowZ = HouseholdInsertZ.required({ id: true }).extend({
  created_at: TimestampZ,
  updated_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// vehicles — banded values only (no VIN, no license plate)
// ---------------------------------------------------------------------------

export const VehicleInsertZ = z.object({
  id: UuidZ.optional(),
  household_id: UuidZ,
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  make: ShortTextZ,
  model: ShortTextZ,
  ownership: OwnershipZ,
  value_cents: OptCentsZ,
  loan_balance_cents: OptCentsZ,
  mileage_band: MileageBandZ.optional().nullable(),
  use: VehicleUseZ.optional().nullable(),
  parking: VehicleParkingZ.optional().nullable(),
});

export const VehicleRowZ = VehicleInsertZ.required({ id: true }).extend({
  created_at: TimestampZ,
  updated_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// drivers — banded values, no names, no DOBs
// ---------------------------------------------------------------------------

export const IncidentCountsZ = z.object({
  schema_version: SchemaVersionZ,
  accidents: z.number().int().nonnegative(),
  violations: z.number().int().nonnegative(),
});

export const DriverInsertZ = z.object({
  id: UuidZ.optional(),
  household_id: UuidZ,
  age_band: AgeBandZ,
  years_licensed_band: YearsLicensedBandZ,
  incidents_3y: IncidentCountsZ.optional().nullable(),
  primary_vehicle_id: UuidZ.optional().nullable(),
});

export const DriverRowZ = DriverInsertZ.required({ id: true }).extend({
  created_at: TimestampZ,
  updated_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// properties
// ---------------------------------------------------------------------------

export const SystemsBandZ = z.object({
  schema_version: SchemaVersionZ,
  electrical_age_band: RoofAgeBandZ.optional().nullable(),
  plumbing_age_band: RoofAgeBandZ.optional().nullable(),
  hvac_age_band: RoofAgeBandZ.optional().nullable(),
  water_heater_age_band: RoofAgeBandZ.optional().nullable(),
}).optional().nullable();

export const ProtectiveDevicesZ = z.object({
  schema_version: SchemaVersionZ,
  smoke_detectors: z.boolean().optional(),
  sprinklers: z.boolean().optional(),
  burglar_alarm_monitored: z.boolean().optional(),
  fire_alarm_monitored: z.boolean().optional(),
  deadbolts: z.boolean().optional(),
}).optional().nullable();

export const LiabilityFeaturesZ = z.object({
  schema_version: SchemaVersionZ,
  trampoline: z.boolean().optional(),
  pool: z.boolean().optional(),
  pool_fenced: z.boolean().optional(),
  dog: z.boolean().optional(),
  home_business: z.boolean().optional(),
}).optional().nullable();

export const HazardFlagsZ = z.object({
  schema_version: SchemaVersionZ,
  near_wildfire_zone: z.boolean().optional(),
  in_flood_zone: z.boolean().optional(),
  earthquake_risk: z.boolean().optional(),
}).optional().nullable();

export const ValuableItemZ = z.object({
  category: ShortTextZ,
  value_cents: CentsZ,
});

export const PropertyInsertZ = z.object({
  id: UuidZ.optional(),
  household_id: UuidZ,
  type: PropertyTypeZ,
  year_built: z.number().int().min(1600).max(new Date().getFullYear() + 5),
  sqft: z.number().int().positive().max(50000),
  stories: z.number().int().min(1).max(10),
  construction: ConstructionTypeZ,
  foundation: FoundationTypeZ.optional().nullable(),
  roof_material: RoofMaterialZ.optional().nullable(),
  roof_age_band: RoofAgeBandZ.optional().nullable(),
  systems: SystemsBandZ,
  protective_devices: ProtectiveDevicesZ,
  liability_features: LiabilityFeaturesZ,
  hazard_flags: HazardFlagsZ,
  market_value_cents: OptCentsZ,
  rebuild_estimate_cents: OptCentsZ,
  cost_per_sqft_cents: OptCentsZ, // Illustrative
  contents_value_cents: OptCentsZ,
  valuables: z.array(ValuableItemZ).optional().nullable(),
});

export const PropertyRowZ = PropertyInsertZ.required({ id: true }).extend({
  created_at: TimestampZ,
  updated_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// policies
// ---------------------------------------------------------------------------

export const FeeLineZ = z.object({ label: z.string().max(100), cents: CentsZ });
export const FeesZ = z.object({
  schema_version: SchemaVersionZ,
  lines: z.array(FeeLineZ),
}).optional().nullable();

export const PolicyInsertZ = z.object({
  id: UuidZ.optional(),
  household_id: UuidZ,
  policy_type: PolicyTypeZ,
  role: PolicyRoleZ.default("hypothetical"),
  label: LabelZ,
  insurer_label: ShortTextZ.optional().nullable(),
  term_months: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
  amount_cents: CentsZ,
  amount_basis: AmountBasisZ,
  installments_per_year: z.number().int().min(1).max(12).optional().nullable(),
  fees: FeesZ,
  effective_period: z.object({ from_band: z.string(), to_band: z.string() }).optional().nullable(),
  source: PolicySourceZ.default("entered"),
  notes: NotesZ,
});

export const PolicyRowZ = PolicyInsertZ.required({ id: true }).extend({
  created_at: TimestampZ,
  updated_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// policy_coverages
// ---------------------------------------------------------------------------

const PolicyCoverageBaseZ = z.object({
  id: UuidZ.optional(),
  policy_id: UuidZ,
  coverage_code: z.string().max(50),
  included: z.boolean().nullable(), // null = not_entered
  limit_primary_cents: OptCentsZ,
  limit_secondary_cents: OptCentsZ,
  limit_split_raw: z.string().max(50).optional().nullable(),
  deductible_cents: OptCentsZ,
  deductible_pct: PctZ.optional().nullable(),
  deductible_pct_basis: DeductiblePctBasisZ.optional().nullable(),
  valuation_basis: ValuationBasisZ.optional().nullable(),
  notes: NotesZ,
});

export const PolicyCoverageInsertZ = PolicyCoverageBaseZ.refine(
  (d) => !(d.deductible_cents != null && d.deductible_pct != null) || d.deductible_pct_basis != null,
  { message: "deductible_pct_basis required when both deductible_cents and deductible_pct are set" }
);

export const PolicyCoverageRowZ = PolicyCoverageBaseZ.extend({
  id: UuidZ,
  created_at: TimestampZ,
  updated_at: TimestampZ,
}).refine(
  (d) => !(d.deductible_cents != null && d.deductible_pct != null) || d.deductible_pct_basis != null,
  { message: "deductible_pct_basis required when both deductible_cents and deductible_pct are set" }
);

// ---------------------------------------------------------------------------
// policy_endorsements
// ---------------------------------------------------------------------------

export const PolicyEndorsementInsertZ = z.object({
  id: UuidZ.optional(),
  policy_id: UuidZ,
  code: z.string().max(50).optional().nullable(),
  label: LabelZ,
  notes: NotesZ,
});

export const PolicyEndorsementRowZ = PolicyEndorsementInsertZ.extend({
  id: UuidZ,
  created_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// policy_limitations
// ---------------------------------------------------------------------------

export const PolicyLimitationInsertZ = z.object({
  id: UuidZ.optional(),
  policy_id: UuidZ,
  text: z.string().max(2000),
  origin: LimitationOriginZ,
  source_id: z.string().max(20).optional().nullable(),
});

export const PolicyLimitationRowZ = PolicyLimitationInsertZ.extend({
  id: UuidZ,
  created_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// scenarios
// ---------------------------------------------------------------------------

export const ScenarioConfigZ = z.object({
  schema_version: SchemaVersionZ,
}).passthrough(); // config shape varies by kind

export const ResultsSnapshotZ = z.object({
  schema_version: SchemaVersionZ,
  computed_at: TimestampZ,
}).passthrough();

export const ScenarioInsertZ = z.object({
  id: UuidZ.optional(),
  household_id: UuidZ,
  kind: ScenarioKindZ,
  name: LabelZ,
  config: ScenarioConfigZ,
  results_snapshot: ResultsSnapshotZ.optional().nullable(),
  engine_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  reference_version: z.string().regex(/^\d+\.\d+\.\d+$/).optional().nullable(),
});

export const ScenarioRowZ = ScenarioInsertZ.required({ id: true }).extend({
  created_at: TimestampZ,
  updated_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// scenario_policies (join table)
// ---------------------------------------------------------------------------

export const ScenarioPolicyZ = z.object({
  scenario_id: UuidZ,
  policy_id: UuidZ,
  position: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// review_findings
// ---------------------------------------------------------------------------

export const ReviewFindingInsertZ = z.object({
  id: UuidZ.optional(),
  household_id: UuidZ,
  rule_id: z.string().max(50),
  status: ReviewStatusZ,
  inputs_used: z.record(z.unknown()).optional().nullable(),
  message_template_id: z.string().max(50).optional().nullable(),
  severity: ReviewSeverityZ.optional().nullable(),
});

export const ReviewFindingRowZ = ReviewFindingInsertZ.extend({
  id: UuidZ,
  created_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// checklist_progress
// ---------------------------------------------------------------------------

export const ChecklistProgressInsertZ = z.object({
  id: UuidZ.optional(),
  household_id: UuidZ,
  item_id: z.string().max(50),
  state: ChecklistStateZ.default("todo"),
});

export const ChecklistProgressRowZ = ChecklistProgressInsertZ.extend({
  id: UuidZ,
  created_at: TimestampZ,
  updated_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// assistant_conversations
// ---------------------------------------------------------------------------

export const AssistantConversationInsertZ = z.object({
  id: UuidZ.optional(),
  user_id: UuidZ,
  scenario_id: UuidZ.optional().nullable(),
});

export const AssistantConversationRowZ = AssistantConversationInsertZ.extend({
  id: UuidZ,
  created_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// assistant_messages
// ---------------------------------------------------------------------------

export const MessageValidationZ = z.object({
  schema_version: SchemaVersionZ,
  passed: z.boolean(),
  flags: z.array(z.string()).optional(),
}).optional().nullable();

export const AssistantMessageInsertZ = z.object({
  id: UuidZ.optional(),
  conversation_id: UuidZ,
  role: AssistantRoleZ,
  content: z.string().max(100_000), // stored redacted server-side
  cited_fact_ids: z.array(z.string()).optional().nullable(),
  validation: MessageValidationZ,
});

export const AssistantMessageRowZ = AssistantMessageInsertZ.extend({
  id: UuidZ,
  created_at: TimestampZ,
});

// ---------------------------------------------------------------------------
// audit_events
// ---------------------------------------------------------------------------

export const AuditEventInsertZ = z.object({
  id: UuidZ.optional(),
  user_id: UuidZ,
  action: z.string().max(100),
  entity: z.string().max(50),
  entity_id: UuidZ,
});

export const AuditEventRowZ = AuditEventInsertZ.extend({
  id: UuidZ,
  at: TimestampZ,
});

// Inferred types
export type HouseholdInsert = z.infer<typeof HouseholdInsertZ>;
export type HouseholdRow = z.infer<typeof HouseholdRowZ>;
export type VehicleInsert = z.infer<typeof VehicleInsertZ>;
export type VehicleRow = z.infer<typeof VehicleRowZ>;
export type DriverInsert = z.infer<typeof DriverInsertZ>;
export type DriverRow = z.infer<typeof DriverRowZ>;
export type PropertyInsert = z.infer<typeof PropertyInsertZ>;
export type PropertyRow = z.infer<typeof PropertyRowZ>;
export type PolicyInsert = z.infer<typeof PolicyInsertZ>;
export type PolicyRow = z.infer<typeof PolicyRowZ>;
export type PolicyCoverageInsert = z.infer<typeof PolicyCoverageInsertZ>;
export type PolicyCoverageRow = z.infer<typeof PolicyCoverageRowZ>;
export type ScenarioInsert = z.infer<typeof ScenarioInsertZ>;
export type ScenarioRow = z.infer<typeof ScenarioRowZ>;
