# DATA-MODEL.md: InsureWise

**Version:** 0.1 · **Database:** PostgreSQL (Supabase) · **Guest storage:** IndexedDB with the same Zod schemas
This is a design document (tables, fields, rules), not DDL. Migrations are written in Phase 7.

## 1. Conventions
- Primary keys: UUID. Timestamps: `created_at`, `updated_at` (UTC).
- Money: integer cents (`*_cents`). Ratios are never stored; they are computed.
- Enumerations: Postgres enums or check constraints, mirrored by Zod enums in `src/schemas`.
- Flexible fields: JSONB only for versioned, Zod-validated structures (`schema_version` inside).
- Banded values: stored as enumerated bands (age, mileage, years licensed, roof age), never exact personal values.
- **Never stored:** names, street addresses, VINs, license numbers, policy numbers, SSNs, dates of birth, payment data.

## 2. Provenance Representation
Every stored numeric or factual field that can be displayed has a provenance, held in one of two ways:
- **Implicit by table:** fields in user tables are `Entered` unless the row says otherwise (`source` column on policies: `entered` | `sample`).
- **Explicit for derived/Reference values:** computed outputs and reference records carry `provenance` and, for Reference, `source_id`.
Calculated values are not persisted as truth. Saved scenarios store a **snapshot** with `engine_version` and `reference_version` so results remain explainable.

## 3. User-Owned Tables

| Table | Key columns | Notes |
|-------|-------------|-------|
| `households` | id, owner_id (auth.users), label, state (2-letter), zip5 (nullable), is_sample | One per user in MVP; schema allows many |
| `vehicles` | id, household_id, year, make, model, ownership (owned/financed/leased), value_cents (nullable), loan_balance_cents (nullable), mileage_band, use, parking | Free text limited and pattern-checked |
| `drivers` | id, household_id, age_band, years_licensed_band, incidents_3y (JSONB: accidents, violations as counts), primary_vehicle_id | No names |
| `properties` | id, household_id, type (single_family/townhome/condo), year_built, sqft, stories, construction, foundation, roof_material, roof_age_band, systems (JSONB bands), protective_devices (JSONB), liability_features (JSONB), hazard_flags (JSONB, self-reported), market_value_cents, rebuild_estimate_cents, cost_per_sqft_cents (Illustrative), contents_value_cents, valuables (JSONB list: category + amount) | Manufactured/mobile = unsupported flag |
| `policies` | id, household_id, policy_type (car/home), role (current/hypothetical/sample), label, insurer_label (free text, optional), term_months, amount_cents, amount_basis, installments_per_year, fees (JSONB), effective_period (optional bands), source (entered/sample/provider), notes | Premium is whatever the user entered |
| `policy_coverages` | id, policy_id, coverage_code (FK catalog), included, limit_primary_cents, limit_secondary_cents, limit_split_raw (original entry), deductible_cents, deductible_pct, deductible_pct_basis, valuation_basis, notes | One row per coverage |
| `policy_endorsements` | id, policy_id, code (nullable), label, notes | Free text allowed; catalog link optional |
| `policy_limitations` | id, policy_id, text, origin (entered/generic_reference), source_id (nullable) | Generic items must cite a source |
| `scenarios` | id, household_id, kind (deductible/comparison/bundle), name, config (JSONB), results_snapshot (JSONB), engine_version, reference_version, created_at | Snapshot, not live truth |
| `scenario_policies` | scenario_id, policy_id, position | Ordering is user's insertion order |
| `review_findings` | id, household_id, rule_id, status (finding/not_enough_information/none), inputs_used (JSONB), message_template_id, severity, created_at | Stored on save for history; recomputed live otherwise |
| `checklist_progress` | id, household_id, item_id, state (todo/reviewed/not_applicable) | |
| `assistant_conversations` | id, user_id, scenario_id (nullable), created_at | |
| `assistant_messages` | id, conversation_id, role, content (redacted), cited_fact_ids, validation (JSONB), created_at | User may delete |
| `audit_events` | id, user_id, action, entity, entity_id, at | No payloads |

## 4. Reference Tables (read-only to users)

| Table | Key columns | Notes |
|-------|-------------|-------|
| `sources` | id (S-###), title, publisher, tier, url, retrieved_at, section_or_page, notes | Mirrors `RESEARCH-SOURCES.md` |
| `jurisdictions` | code, name, supported (bool), supported_since | MVP: CA supported for auto and home content |
| `reference_facts` | id (RF-…), jurisdiction, topic, line (auto/home/both), statement_template, value (JSONB, structured), level (V0–V2/WATCH), recheck_by | Only level V2 is exposed to the app |
| `reference_fact_versions` | id, fact_id, effective_from, effective_to (nullable), applies_basis (e.g., `issued_or_renewed_on_or_after`, `loss_date`, `always`), value (JSONB), supersedes_id | Handles rule changes over time |
| `reference_fact_schedule` | id, fact_id, scheduled_effective_from, value (JSONB), source_id | **Scheduled future changes** (shown as "scheduled," never as current) |
| `fact_sources` | fact_id, source_id, section | Many-to-many |
| `coverage_definitions` | code, line, name, plain_language, example, common_limitations (JSONB), source_ids | Canonical catalog |
| `glossary_terms` | slug, term, short_def, long_def, related, source_ids | |
| `rating_factors` | id, line, category, factor, how_commonly_considered, jurisdiction_notes (JSONB), status (verified/watch), source_ids | Only verified, sourced entries render |
| `review_rules` | id, line, applies_to, required_inputs, condition (structured expression), parameters (JSONB with provenance), severity, message_template_id, question_template_id, source_ids | Rules are data |
| `message_templates` | id, text, locale | Used by rules and findings |
| `claims_workflows`, `claims_steps` | workflow type, step order, branch conditions, text, source_ids, disclaimer_id | Seven workflows |
| `checklist_items` | id, line, text, why_it_matters, source_ids | |
| `sample_households`, `sample_documents` | id, fixture (JSONB), is_sample = true | Fictional only |

### Example reference record (structure only; value pending V2)
| Field | Value |
|-------|-------|
| fact id | RF-CA-AUTO-001 |
| jurisdiction / topic | CA / minimum_liability_limits |
| version 1 | effective_from 2025-01-01, applies_basis `issued_or_renewed_on_or_after`, value `{bi_per_person: 3000000, bi_per_accident: 6000000, pd: 1500000}` (cents) |
| prior version (history) | effective_to 2024-12-31, value per verified source, to be captured |
| scheduled change | effective 2035-01-01, increments per the statute, to be captured and verified |
| sources | S-001, S-003 (plus the leginfo capture) |
| level | V1 → must reach V2 before shipping |

## 5. Relationships (summary)
`households 1—* vehicles | drivers | properties | policies`; `policies 1—* policy_coverages | policy_endorsements | policy_limitations`; `scenarios *—* policies` via `scenario_policies`; `households 1—* scenarios | review_findings | checklist_progress`; `reference_facts 1—* reference_fact_versions | reference_fact_schedule`; `reference_facts *—* sources` via `fact_sources`; `coverage_definitions` referenced by `policy_coverages.coverage_code`.

## 6. Row-Level Security Rules
- Every user-owned table is reachable only through a household whose `owner_id = auth.uid()`; policies are written once per table and covered by tests.
- `assistant_*` tables: `user_id = auth.uid()`.
- Reference tables: `SELECT` for anonymous and authenticated roles; no insert/update/delete for either; changes only via migrations/seeds run with a privileged role.
- Sample households are readable by everyone but not writable; "Try sample household" copies a sample into the user's own (or local) workspace.
- **Tests:** user A cannot select, update or delete user B's rows in any user table; anonymous cannot write anywhere; reference tables are immutable from the client.

## 7. Integrity Rules and Constraints
- Money ≥ 0 unless a column explicitly allows negatives (none in MVP).
- `deductible_pct` between 0 and 100; `deductible_cents` and `deductible_pct` not both set unless a `basis` is stated.
- `scenario_policies` entries must share one `policy_type` for comparisons; bundle scenarios hold exactly one car and one home entry.
- `reference_fact_versions` ranges for a fact and `applies_basis` must not overlap.
- Free-text fields: length limits and server-side rejection of SSN-like and card-like patterns.
- Deleting a policy used in a saved scenario: block with a message, or detach and mark the scenario "contains deleted policy"; never silently alter snapshots.

## 8. Indexes and Performance
Foreign keys; `(household_id, created_at)` on scenarios and findings; `(jurisdiction, topic)` on reference facts; `(fact_id, effective_from)` on versions; slug index on glossary. Reference reads are cacheable (ISR/CDN); user reads are small.

## 9. Reference-Data Pipeline
```
Verified workbook (one sheet per table; source and level columns mandatory)
 → export CSV/JSON
 → Zod validation in CI (fails if: no source, level < V2 for shipped rows, missing effective dates,
    overlapping version ranges, orphan source IDs, banned language in text)
 → seed/migration → app
```
The workbook is the researchers' source of truth; the repo's exports are the build input. A drift check compares workbook exports with seeded tables in CI.

## 10. Guest Storage
IndexedDB database `insurewise` with object stores mirroring user tables, each record carrying `schema_version`. On load, records are validated with current schemas; failing records are quarantined with a user-visible "couldn't restore this item" state. Sign-in migration: validate → upload in a transaction → confirm → clear local copies; on failure keep local data and show a retry.

## 11. Retention and Privacy
User data persists until the user deletes it. "Delete my data" removes all user-owned rows (cascade) and auth account. Data export returns JSON of all user-owned rows. Assistant messages are stored redacted and individually deletable. Audit events keep no content.

## 12. Migration and Evolution
Supabase CLI migrations in version control; additive changes preferred; JSONB structures versioned via `schema_version` with explicit upgraders; reference changes ship as data migrations with a changelog entry visible on `/sources`.

## 13. Test Requirements
Schema/constraint tests; RLS isolation tests; reference validation tests (source required, V2 only, no overlapping ranges); migration up/down tests; guest-to-account migration tests; export/delete verification tests; seed idempotency.
