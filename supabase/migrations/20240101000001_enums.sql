-- Migration: Postgres enum types
-- Mirrors src/schemas/enums.ts

CREATE TYPE ownership_type AS ENUM ('owned', 'financed', 'leased');
CREATE TYPE vehicle_use_type AS ENUM ('commute', 'pleasure', 'business', 'rideshare');
CREATE TYPE vehicle_parking_type AS ENUM ('garage', 'driveway', 'street', 'lot');

CREATE TYPE mileage_band AS ENUM ('under_5k', '5k_to_10k', '10k_to_15k', '15k_to_20k', 'over_20k');
CREATE TYPE age_band AS ENUM ('16_to_19', '20_to_24', '25_to_29', '30_to_39', '40_to_49', '50_to_59', '60_to_69', '70_plus');
CREATE TYPE years_licensed_band AS ENUM ('0_to_1', '2_to_3', '4_to_5', '6_to_9', '10_plus');

CREATE TYPE property_type AS ENUM ('single_family', 'townhome', 'condo');
CREATE TYPE construction_type AS ENUM ('frame', 'masonry', 'fire_resistive', 'manufactured');
CREATE TYPE foundation_type AS ENUM ('slab', 'raised', 'basement');
CREATE TYPE roof_material AS ENUM ('composition', 'tile', 'metal', 'wood_shake', 'flat');
CREATE TYPE roof_age_band AS ENUM ('0_to_5', '6_to_10', '11_to_15', '16_to_20', 'over_20');

CREATE TYPE policy_type AS ENUM ('car', 'home');
CREATE TYPE policy_role AS ENUM ('current', 'hypothetical', 'sample');
CREATE TYPE policy_source AS ENUM ('entered', 'sample', 'provider');
CREATE TYPE amount_basis AS ENUM ('per_term', 'per_installment', 'per_year');
CREATE TYPE term_months AS ENUM ('1', '3', '6', '12');

CREATE TYPE valuation_basis AS ENUM ('ACV', 'RCV');
CREATE TYPE deductible_pct_basis AS ENUM ('dwelling', 'insured_value');

CREATE TYPE scenario_kind AS ENUM ('deductible', 'comparison', 'bundle');

CREATE TYPE review_status AS ENUM ('finding', 'not_enough_information', 'none');
CREATE TYPE review_severity AS ENUM ('Info', 'Warning');

CREATE TYPE checklist_state AS ENUM ('todo', 'reviewed', 'not_applicable');

CREATE TYPE assistant_role AS ENUM ('user', 'assistant');

CREATE TYPE limitation_origin AS ENUM ('entered', 'generic_reference');

CREATE TYPE source_tier AS ENUM ('statute', 'regulation', 'agency_guidance', 'trade_body', 'academic', 'insurer_doc', 'other');
CREATE TYPE fact_level AS ENUM ('V0', 'V1', 'V2', 'WATCH');
CREATE TYPE fact_line AS ENUM ('auto', 'home', 'both');
CREATE TYPE fact_applies_basis AS ENUM ('issued_or_renewed_on_or_after', 'loss_date', 'always');

CREATE TYPE rating_factor_status AS ENUM ('verified', 'watch');
