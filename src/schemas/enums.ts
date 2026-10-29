/**
 * Shared Zod enum schemas mirroring Postgres enums / check constraints.
 */
import { z } from "zod";

export const OwnershipZ = z.enum(["owned", "financed", "leased"]);
export const VehicleUseZ = z.enum(["commute", "pleasure", "business", "rideshare"]);
export const VehicleParkingZ = z.enum(["garage", "driveway", "street", "lot"]);

export const MileageBandZ = z.enum(["under_5k", "5k_to_10k", "10k_to_15k", "15k_to_20k", "over_20k"]);
export const AgeBandZ = z.enum(["16_to_19", "20_to_24", "25_to_29", "30_to_39", "40_to_49", "50_to_59", "60_to_69", "70_plus"]);
export const YearsLicensedBandZ = z.enum(["0_to_1", "2_to_3", "4_to_5", "6_to_9", "10_plus"]);

export const PropertyTypeZ = z.enum(["single_family", "townhome", "condo"]);
export const ConstructionTypeZ = z.enum(["frame", "masonry", "fire_resistive", "manufactured"]);
export const FoundationTypeZ = z.enum(["slab", "raised", "basement"]);
export const RoofMaterialZ = z.enum(["composition", "tile", "metal", "wood_shake", "flat"]);
export const RoofAgeBandZ = z.enum(["0_to_5", "6_to_10", "11_to_15", "16_to_20", "over_20"]);

export const PolicyTypeZ = z.enum(["car", "home"]);
export const PolicyRoleZ = z.enum(["current", "hypothetical", "sample"]);
export const PolicySourceZ = z.enum(["entered", "sample", "provider"]);
export const AmountBasisZ = z.enum(["per_term", "per_installment", "per_year"]);

export const ValuationBasisZ = z.enum(["ACV", "RCV"]);
export const DeductiblePctBasisZ = z.enum(["dwelling", "insured_value"]);
export const LimitBasisZ = z.enum(["after_deductible", "before_deductible"]);

export const ScenarioKindZ = z.enum(["deductible", "comparison", "bundle"]);

export const ReviewStatusZ = z.enum(["finding", "not_enough_information", "none"]);
export const ReviewSeverityZ = z.enum(["Info", "Warning"]);

export const ChecklistStateZ = z.enum(["todo", "reviewed", "not_applicable"]);

export const AssistantRoleZ = z.enum(["user", "assistant"]);

export const LimitationOriginZ = z.enum(["entered", "generic_reference"]);

export const SourceTierZ = z.enum(["statute", "regulation", "agency_guidance", "trade_body", "academic", "insurer_doc", "other"]);
export const FactLevelZ = z.enum(["V0", "V1", "V2", "WATCH"]);
export const FactLineZ = z.enum(["auto", "home", "both"]);
export const FactAppliesBasisZ = z.enum(["issued_or_renewed_on_or_after", "loss_date", "always"]);

export const InsuranceLineZ = z.enum(["auto", "home", "both"]);

// Types
export type Ownership = z.infer<typeof OwnershipZ>;
export type VehicleUse = z.infer<typeof VehicleUseZ>;
export type PolicyType = z.infer<typeof PolicyTypeZ>;
export type PolicyRole = z.infer<typeof PolicyRoleZ>;
export type ScenarioKind = z.infer<typeof ScenarioKindZ>;
export type ReviewSeverity = z.infer<typeof ReviewSeverityZ>;
export type ValuationBasis = z.infer<typeof ValuationBasisZ>;
