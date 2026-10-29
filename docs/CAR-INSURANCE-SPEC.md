# CAR-INSURANCE-SPEC.md: InsureWise

**Version:** 0.1 · **Status:** Draft · **Depends on:** PRD.md, CALCULATIONS.md, DATA-MODEL.md, UI-UX-SPEC.md
**Jurisdiction:** California (first verified state; architecture is multi-state)

---

## 1. Overview

The car insurance feature lets a user enter their current auto policy (or a hypothetical one), see a plain-language breakdown of their coverage, explore deductible scenarios, compare up to three policies, and get sourced review items — all without submitting personal identifying information.

**What this feature is not:** a quote engine, a rating tool, or a recommendation system.

---

## 2. Car Wizard (J1: `/car/new`)

Five steps. Each step auto-saves on "Save & Continue." User may go back to any completed step. Partial completion is fine — the dashboard shows "Not entered" for missing fields rather than blocking.

---

### Step 1: Vehicle

**Purpose:** capture enough about the vehicle to enable calculations (C13 coverage-to-value ratio, C14 loan shortfall, C15 deductible affordability) and sourced review items.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Year | Select (1990–current + 1) | Yes | |
| Make | Text (autocomplete optional) | Yes | |
| Model | Text | Yes | |
| Ownership | Segmented: Owned / Financed / Leased | Yes | Drives which review items appear (e.g., gap coverage) |
| Estimated current value | Money input | No | "I don't know" → skips C13, C14 |
| Loan / lease balance | Money input | No | Only shown if Financed or Leased |
| Primary use | Select: Commute / Pleasure / Business / Rideshare | Yes | Drives factor card on dashboard |
| Annual mileage band | Segmented: Under 7,500 / 7,500–15,000 / 15,000–25,000 / Over 25,000 | Yes | Band, not exact; Prop 103 factor |
| Parking | Select: Garage / Driveway / Street / Lot | No | |

**Validation:**
- Year must be 1990 or later (older vehicles flag a review item: stated value policies may differ)
- Value ≥ 0; loan balance ≥ 0
- Loan balance only collected if ownership = Financed or Leased

**Review items enabled by this step (evaluated later):**
- C14: if loan balance > vehicle value → "Loan may exceed vehicle value — ask about gap coverage"
- C13: if (collision + comprehensive premium) / vehicle value > threshold (Illustrative) → "Physical damage coverage cost vs vehicle value worth reviewing"

---

### Step 2: Drivers

**Purpose:** capture driving history factors relevant to Prop 103 mandatory rating factors (driving safety record, miles driven, years of experience). No names collected.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Number of drivers on policy | Select: 1 / 2 / 3 / 4+ | Yes | Drives how many driver rows to show |
| Per driver: age band | Select: Under 25 / 25–34 / 35–49 / 50–64 / 65+ | Yes | Band not exact age |
| Per driver: years licensed band | Select: Under 3 / 3–5 / 6–10 / Over 10 | Yes | Prop 103 factor |
| Per driver: incidents in last 3 years | Counts: accidents (0/1/2/3+), violations (0/1/2/3+) | No | "I don't know" allowed |

**Copy on this step:**
> "We use bands rather than exact ages and don't store names. This information is used only to show you which rating factors apply to your profile."

**Review items enabled:**
- Young driver (under 25) + no incidents noted → show factor card on dashboard
- Incidents entered → show factor card explaining driving record weighting

---

### Step 3: Coverage

**Purpose:** enter the coverages and limits on the current or hypothetical policy.

#### Coverage fields (one row per coverage type):

| Coverage | Included? | Limit entry | Deductible entry | Notes |
|----------|-----------|-------------|-----------------|-------|
| Bodily Injury Liability (BI) | Yes/No | Split (e.g., 100/300) or CSL | None | Mandatory in CA; parse split-limit (CAR-4) |
| Property Damage Liability (PD) | Yes/No | Single limit | None | Mandatory in CA |
| Uninsured Motorist BI (UMBI) | Yes/No | Split or CSL | None | Optional in CA (RF-CA-AUTO-006 pending V2) |
| Uninsured Motorist PD (UMPD) | Yes/No | Single limit | Deductible (cents) | Optional |
| Medical Payments (MedPay) | Yes/No | Per-person limit | None | Optional in CA (RF-CA-AUTO-006 pending V2) |
| Collision | Yes/No | None (ACV/replacement) | Deductible (cents) | |
| Comprehensive | Yes/No | None | Deductible (cents) | |
| Rental Reimbursement | Yes/No | Per-day / max | None | |
| Roadside Assistance | Yes/No | None | None | |
| Gap Coverage | Yes/No | None | None | Review item if absent and loan > value |

**Split-limit parsing (CAR-4):**
- User may type "100/300/50" or "100/300" — parser splits on `/`, converts to cents, stores `limit_primary_cents` and `limit_secondary_cents`
- CSL (combined single limit): single field, stored in `limit_primary_cents`, `limit_split_raw` stores original entry
- Display always shows original entry plus parsed breakdown

**"Not entered" vs "Not included":**
- If user leaves a coverage row without toggling Yes/No → status = `not_entered`; UI shows "Not entered" (never "Not covered")
- If user explicitly toggles No → status = `not_included`; UI shows "Not included"
- This distinction matters: "not entered" = unknown; "not included" = user stated it is absent

**Valuation basis:**
- Collision and comprehensive: select ACV / Replacement Cost / Not sure
- Drives C12 illustration on dashboard

---

### Step 4: Premium

**Purpose:** enter the premium the user is paying or considering. Provenance = Entered throughout.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Total premium amount | Money | Yes | |
| Payment basis | Select: Per 6-month term / Per 12-month term / Per month / Per installment | Yes | Drives C1 annualization |
| Installments per year | Select: 12 / 6 / 4 / 2 / 1 | Only if "per installment" | |
| Line-level breakdown | Optional: per coverage, money each | No | "I don't know" → C7 skipped; only total shown |
| Fees | Optional: one or more {label, amount, recurrence} | No | Recurring fees annualized; one-time listed separately |
| Policy effective date (bands) | Month + Year | No | Used for reference version resolution |
| Insurer label | Free text | No | Not validated; user's reference only |
| Policy label / nickname | Free text | No | E.g., "Current State Farm policy" |

**Copy on this step:**
> "The premium you enter is used only for your calculations. We don't validate it or generate a quote."

---

### Step 5: Review

**Purpose:** show a summary of all entered data before saving. User can click any section to edit.

- Vehicle summary card
- Drivers summary (count + bands)
- Coverage grid: all coverages with entered limits/deductibles or "Not entered"
- Premium summary: annual figure (C1), basis, line-level if entered
- "Looks good — save" button (saves to local storage for guests, server for signed-in)
- Option to label the policy before saving

---

## 3. Car Policy Dashboard (`/car/[id]`)

Loaded after wizard completion or from the household list.

### 3.1 Header
- Policy label (user's nickname or "Car Policy")
- Insurer label if entered
- Sample banner if sample data
- "Edit" button → returns to wizard at step 1
- "Archive" option (soft-delete)

### 3.2 Premium Section
- Annual premium (C1): large display, Calculated badge, "Show the math" → C1 trace
- If line-level entered: composition donut chart (C7), each segment labeled with coverage name and share
- If term premium only: "Line-level breakdown not entered" note
- Fees: listed separately if entered, labeled as included or excluded from annual total

### 3.3 Coverage Breakdown
One card per coverage, ordered: BI → PD → UMBI → UMPD → MedPay → Collision → Comprehensive → Endorsements.

Each card:
- Coverage name (plain language)
- Status chip: Included / Not entered / Not included
- Limit(s) with provenance badge
- Deductible with provenance badge
- Valuation basis if applicable
- "What this covers" — 2–3 sentence plain-language definition from coverage catalog (sourced)
- "Common limitations" from catalog (e.g., "Collision typically does not cover mechanical breakdown")

**California minimum limits notice (Reference, V2 required):**
> "California requires at least $30,000/$60,000 bodily injury and $15,000 property damage for policies issued or renewed on or after Jan 1, 2025. (Source: CDI Bulletin 2023-1, verified [date].)"
> Only shown when RF-CA-AUTO-001 reaches V2. Until then, not shown.

### 3.4 Rating Factors Section
Sourced factor cards (only factors with a Tier 1 source shipped):
- Driving safety record (Prop 103, mandatory #1)
- Annual miles driven (Prop 103, mandatory #2)
- Years of driving experience (Prop 103, mandatory #3)
- Optional factors shown if CDI has verified them with a source

Each card: factor name, why it matters (plain language), how the user's entered data maps to it, source badge.

### 3.5 Review Items (Gap Findings)
Rule-driven, sourced. Each shows:
- Severity: Warning or Info
- Title (message template, never LLM-written)
- Why it appears (inputs used)
- Questions to ask a professional
- "Not enough information" if required inputs missing — explains which field

**Car-specific rules (examples; all must have source_ids before shipping):**

| Rule ID | Condition | Severity | Template |
|---------|-----------|----------|----------|
| R-CAR-001 | BI limit < CA minimum (RF-CA-AUTO-001, when V2) | Warning | "Entered BI limits are below the California minimum effective Jan 1, 2025" |
| R-CAR-002 | Owned/financed vehicle, no collision entered | Info | "No collision coverage entered — worth reviewing if the vehicle has significant value" |
| R-CAR-003 | Financed/leased, no gap coverage entered | Info | "Lenders often require gap coverage on financed vehicles — worth asking your insurer" |
| R-CAR-004 | C14 shortfall > 0 (loan > value) | Warning | "Loan balance may exceed vehicle value by [amount] — gap coverage worth reviewing" |
| R-CAR-005 | Rideshare use, no rideshare endorsement | Warning | "Personal auto policies typically exclude rideshare driving — worth reviewing" |
| R-CAR-006 | C13 ratio > threshold (Illustrative) | Info | "Physical damage premiums are [X]% of vehicle value — some drivers drop coverage when this ratio is high" |
| R-CAR-007 | C15 deductible > emergency savings | Info | "Selected deductible may exceed stated emergency savings" |

Rules with `not_enough_information` (missing required input): shown greyed with "Enter [field] to evaluate this."

### 3.6 Scenarios Shortcut
- "Explore deductible scenarios" → `/car/[id]/scenarios`
- "Compare this policy" → `/car/[id]/compare`

### 3.7 Assistant Entry
- "Ask about this policy" → opens assistant with the car fact packet pre-loaded

---

## 4. Deductible Simulator (`/car/[id]/scenarios`)

Implements C1, C3, C4, C5, C6 for the car policy.

### 4.1 Layout
- "What are you exploring?" header
- Loss amount input (Entered, Illustrative if user guesses)
- 2–4 deductible option cards, each with:
  - Deductible amount (Entered)
  - Annual premium for that option (Entered)
  - Out-of-pocket on this loss (C3, Calculated)
  - Annual premium difference vs. baseline (C4, Calculated)
- Break-even panel: X claim-free years (C5, Calculated) — labeled "arithmetic on your entered numbers, not a prediction"
- "Claim every N years" toggle (C6, Illustrative) — N is editable, label says Illustrative

### 4.2 Provenance on Simulator
- Loss amount: Entered
- Deductibles: Entered
- Premiums: Entered
- All outputs: Calculated (if all inputs Entered) or Illustrative (if any input Illustrative)
- "Show the math" available on each output

### 4.3 Saving Scenarios
- "Save this scenario" → names it (e.g., "High vs low deductible — July 2025")
- Saved with `engine_version` and `reference_version` snapshot
- Listed in dashboard under Scenarios

---

## 5. Policy Comparison (`/car/[id]/compare`)

Implements CMP-1 through CMP-6.

### 5.1 Setup
- Baseline policy = the current `/car/[id]` policy (auto-loaded)
- Add up to 3 hypothetical policies using the same wizard flow (abbreviated — skips vehicle/driver steps if same vehicle)
- Alternatively: "Load sample policies" to see comparison with fictional examples

### 5.2 Comparison Table

Rows (fixed order):
1. Annual premium (C1 per policy)
2. BI limit
3. PD limit
4. UMBI limit
5. UMPD limit / deductible
6. MedPay limit
7. Collision deductible
8. Comprehensive deductible
9. Valuation basis (ACV / Replacement Cost)
10. Rental reimbursement
11. Roadside assistance
12. Gap coverage
13. Endorsements (one row per unique endorsement across all policies)
14. Fees (if entered)
15. Insurer label
16. Policy term

Difference highlighting:
- Row where all policies agree: no highlight
- Row where policies differ: amber background + delta shown (C8 for premium rows)
- Coverage present in some policies but not others: "Included" / "Not entered" / "Not included" chips

### 5.3 Comparability Warnings
Auto-generated and shown in a banner above the table:
- `DIFFERENT_TERM`: "Policies have different terms — annualized premiums are used for comparison"
- `DIFFERENT_DEDUCTIBLE`: "Deductibles differ for [coverage] — see rows below"
- `COVERAGE_ONLY_IN_ONE`: "Gap coverage appears in only one policy"
- `DIFFERENT_VALUATION_BASIS`: "Policies use different valuation bases (ACV vs Replacement Cost)"
- `FIELD_NOT_ENTERED`: "Some fields were not entered — those rows show 'Not entered'"

### 5.4 No Ranking
- No score row
- No "best value" label
- No highlighting of a "winner" column
- Sort is user-chosen: by premium / by BI limit / by deductible — labeled "You sorted by: [field]"
- Language lint fails build if ranking language appears in comparison UI strings

---

## 6. Education Content (Car)

Sourced education content for car insurance. All content must have a source_id at V2 before shipping.

### 6.1 Glossary Terms (car-specific, to be authored)
Bodily injury liability · property damage liability · uninsured motorist · underinsured motorist · medical payments · collision · comprehensive · deductible · limit · split limit · combined single limit · actual cash value · replacement cost · gap coverage · endorsement · named insured · premium · term

### 6.2 "Why Prices Differ" (car section)
Sourced factors (Prop 103, CDI sources):
1. Driving safety record (mandatory, weighted most)
2. Annual miles driven (mandatory)
3. Years of driving experience (mandatory)
4. Commissioner-approved optional factors (sourced list, labeled as such)
5. Factors that may NOT be used under Prop 103 (sourced)

Note: any factor whose status is V0 or V1 is not shown in this section.

### 6.3 Claims Guide (car scenarios, EDU-3)
Seven claim scenarios. Each has: what typically happens, steps to take, questions to ask, disclaimers. Sourced from CDI claims guidance.

1. Collision with another vehicle (your fault)
2. Collision with another vehicle (other driver's fault)
3. Uninsured motorist claim
4. Comprehensive claim (theft, weather, animal)
5. Windshield / glass claim
6. Medical payments claim
7. Rental car during repair

Global disclaimer on every tab:
> "Claims processes vary by policy and insurer. This guide is educational and based on general information from the California Department of Insurance. Read your policy and contact your insurer for steps specific to your situation."

---

## 7. Data Collected (Car Feature)

Stored in tables: `vehicles`, `drivers`, `policies`, `policy_coverages`, `policy_endorsements`, `scenarios`, `review_findings`.

**Never collected:** name, address, VIN, license number, policy number, SSN, date of birth, exact age.

**Banded:** age band, mileage band, years licensed band, incident counts.

---

## 8. Requirement Cross-Reference

| Requirement | Where implemented |
|-------------|-------------------|
| CAR-1 | Step 5 (Review) + Dashboard §3.1 |
| CAR-2 | Dashboard §3.3 (Coverage Breakdown) |
| CAR-3 | Dashboard §3.2 (Premium) + §3.4 (Factors) |
| CAR-4 | Step 3 (Coverage) split-limit parsing |
| INK-1 | Wizard §2 (five steps) |
| INK-2 | "I don't know" on all optional fields |
| INK-4 | No PII collected; free-text patterns rejected |
| SCN-1 | Deductible Simulator §4 |
| SCN-2 | "Claim every N years" toggle §4.1 |
| CMP-1–6 | Comparison §5 |
| GAP-1–4 | Review Items §3.5 |
| INT-1–6 | Provenance badges + "Show the math" throughout |

---

## 9. Open Items

1. Split-limit parser: handle edge cases (CSL, "100k/300k", single-limit PD only)
2. RF-CA-AUTO-006 (UM/UIM optional status): V0 currently — no content on optionality until V2
3. Rideshare rule (R-CAR-005): needs Tier 1 source before shipping
4. Whether to show the scheduled 2035 limit increase on the dashboard (as a "scheduled" notice, never current)
5. Abbreviated "add hypothetical policy" wizard for comparison flow
