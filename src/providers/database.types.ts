/**
 * Hand-authored Supabase database types.
 * In production these would be generated via `supabase gen types typescript`.
 * Kept in sync with supabase/migrations/*.sql and src/schemas/*.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ---------------------------------------------------------------------------
// Enum mirrors (Postgres → TypeScript)
// ---------------------------------------------------------------------------

export type OwnershipType = "owned" | "financed" | "leased";
export type VehicleUseType = "commute" | "pleasure" | "business" | "rideshare";
export type VehicleParkingType = "garage" | "driveway" | "street" | "lot";
export type MileageBand = "under_5k" | "5k_to_10k" | "10k_to_15k" | "15k_to_20k" | "over_20k";
export type AgeBand = "16_to_19" | "20_to_24" | "25_to_29" | "30_to_39" | "40_to_49" | "50_to_59" | "60_to_69" | "70_plus";
export type YearsLicensedBand = "0_to_1" | "2_to_3" | "4_to_5" | "6_to_9" | "10_plus";
export type PropertyType = "single_family" | "townhome" | "condo";
export type ConstructionType = "frame" | "masonry" | "fire_resistive" | "manufactured";
export type FoundationType = "slab" | "raised" | "basement";
export type RoofMaterial = "composition" | "tile" | "metal" | "wood_shake" | "flat";
export type RoofAgeBand = "0_to_5" | "6_to_10" | "11_to_15" | "16_to_20" | "over_20";
export type PolicyType = "car" | "home";
export type PolicyRole = "current" | "hypothetical" | "sample";
export type PolicySource = "entered" | "sample" | "provider";
export type AmountBasis = "per_term" | "per_installment" | "per_year";
export type ValuationBasis = "ACV" | "RCV";
export type DeductiblePctBasis = "dwelling" | "insured_value";
export type ScenarioKind = "deductible" | "comparison" | "bundle";
export type ReviewStatus = "finding" | "not_enough_information" | "none";
export type ReviewSeverity = "Info" | "Warning";
export type ChecklistState = "todo" | "reviewed" | "not_applicable";
export type AssistantRole = "user" | "assistant";
export type LimitationOrigin = "entered" | "generic_reference";

// ---------------------------------------------------------------------------
// Row types per table
// ---------------------------------------------------------------------------

export type HouseholdRow = {
  id: string;
  owner_id: string;
  label: string;
  state: string;
  zip5: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export type VehicleRow = {
  id: string;
  household_id: string;
  year: number;
  make: string;
  model: string;
  ownership: OwnershipType;
  value_cents: number | null;
  loan_balance_cents: number | null;
  mileage_band: MileageBand | null;
  use: VehicleUseType | null;
  parking: VehicleParkingType | null;
  created_at: string;
  updated_at: string;
}

export type DriverRow = {
  id: string;
  household_id: string;
  age_band: AgeBand;
  years_licensed_band: YearsLicensedBand;
  incidents_3y: Json | null;
  primary_vehicle_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyRow = {
  id: string;
  household_id: string;
  type: PropertyType;
  year_built: number;
  sqft: number;
  stories: number;
  construction: ConstructionType;
  foundation: FoundationType | null;
  roof_material: RoofMaterial | null;
  roof_age_band: RoofAgeBand | null;
  systems: Json | null;
  protective_devices: Json | null;
  liability_features: Json | null;
  hazard_flags: Json | null;
  market_value_cents: number | null;
  rebuild_estimate_cents: number | null;
  cost_per_sqft_cents: number | null;
  contents_value_cents: number | null;
  valuables: Json | null;
  created_at: string;
  updated_at: string;
}

export type PolicyRow = {
  id: string;
  household_id: string;
  policy_type: PolicyType;
  role: PolicyRole;
  label: string;
  insurer_label: string | null;
  term_months: 1 | 3 | 6 | 12;
  amount_cents: number;
  amount_basis: AmountBasis;
  installments_per_year: number | null;
  fees: Json | null;
  effective_period: Json | null;
  source: PolicySource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PolicyCoverageRow = {
  id: string;
  policy_id: string;
  coverage_code: string;
  included: boolean | null;
  limit_primary_cents: number | null;
  limit_secondary_cents: number | null;
  limit_split_raw: string | null;
  deductible_cents: number | null;
  deductible_pct: number | null;
  deductible_pct_basis: DeductiblePctBasis | null;
  valuation_basis: ValuationBasis | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PolicyEndorsementRow = {
  id: string;
  policy_id: string;
  code: string | null;
  label: string;
  notes: string | null;
  created_at: string;
}

export type PolicyLimitationRow = {
  id: string;
  policy_id: string;
  text: string;
  origin: LimitationOrigin;
  source_id: string | null;
  created_at: string;
}

export type ScenarioRow = {
  id: string;
  household_id: string;
  kind: ScenarioKind;
  name: string;
  config: Json;
  results_snapshot: Json | null;
  engine_version: string;
  reference_version: string | null;
  created_at: string;
  updated_at: string;
}

export type ScenarioPolicyRow = {
  scenario_id: string;
  policy_id: string;
  position: number;
}

export type ReviewFindingRow = {
  id: string;
  household_id: string;
  rule_id: string;
  status: ReviewStatus;
  inputs_used: Json | null;
  message_template_id: string | null;
  severity: ReviewSeverity | null;
  created_at: string;
}

export type ChecklistProgressRow = {
  id: string;
  household_id: string;
  item_id: string;
  state: ChecklistState;
  created_at: string;
  updated_at: string;
}

export type AssistantConversationRow = {
  id: string;
  user_id: string;
  scenario_id: string | null;
  created_at: string;
}

export type AssistantMessageRow = {
  id: string;
  conversation_id: string;
  role: AssistantRole;
  content: string;
  cited_fact_ids: string[] | null;
  validation: Json | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Database shape (passed to createClient<Database>)
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      households: {
        Row: HouseholdRow;
        Insert: Omit<HouseholdRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<HouseholdRow, "id" | "owner_id" | "created_at">>;
        Relationships: [];
      };
      vehicles: {
        Row: VehicleRow;
        Insert: Omit<VehicleRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<VehicleRow, "id" | "household_id" | "created_at">>;
        Relationships: [];
      };
      drivers: {
        Row: DriverRow;
        Insert: Omit<DriverRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<DriverRow, "id" | "household_id" | "created_at">>;
        Relationships: [];
      };
      properties: {
        Row: PropertyRow;
        Insert: Omit<PropertyRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<PropertyRow, "id" | "household_id" | "created_at">>;
        Relationships: [];
      };
      policies: {
        Row: PolicyRow;
        Insert: Omit<PolicyRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<PolicyRow, "id" | "household_id" | "created_at">>;
        Relationships: [];
      };
      policy_coverages: {
        Row: PolicyCoverageRow;
        Insert: Omit<PolicyCoverageRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<PolicyCoverageRow, "id" | "policy_id" | "created_at">>;
        Relationships: [];
      };
      policy_endorsements: {
        Row: PolicyEndorsementRow;
        Insert: Omit<PolicyEndorsementRow, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<PolicyEndorsementRow, "id" | "policy_id" | "created_at">>;
        Relationships: [];
      };
      policy_limitations: {
        Row: PolicyLimitationRow;
        Insert: Omit<PolicyLimitationRow, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<PolicyLimitationRow, "id" | "policy_id" | "created_at">>;
        Relationships: [];
      };
      scenarios: {
        Row: ScenarioRow;
        Insert: Omit<ScenarioRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<ScenarioRow, "id" | "household_id" | "created_at">>;
        Relationships: [];
      };
      scenario_policies: {
        Row: ScenarioPolicyRow;
        Insert: ScenarioPolicyRow;
        Update: Pick<ScenarioPolicyRow, "position">;
        Relationships: [];
      };
      review_findings: {
        Row: ReviewFindingRow;
        Insert: Omit<ReviewFindingRow, "id" | "created_at"> & { id?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      checklist_progress: {
        Row: ChecklistProgressRow;
        Insert: Omit<ChecklistProgressRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Pick<ChecklistProgressRow, "state">;
        Relationships: [];
      };
      assistant_conversations: {
        Row: AssistantConversationRow;
        Insert: Omit<AssistantConversationRow, "id" | "created_at"> & { id?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      assistant_messages: {
        Row: AssistantMessageRow;
        Insert: Omit<AssistantMessageRow, "id" | "created_at"> & { id?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      ownership_type: OwnershipType;
      vehicle_use_type: VehicleUseType;
      policy_type: PolicyType;
      policy_role: PolicyRole;
      scenario_kind: ScenarioKind;
      review_severity: ReviewSeverity;
      checklist_state: ChecklistState;
      assistant_role: AssistantRole;
    };
  };
}
