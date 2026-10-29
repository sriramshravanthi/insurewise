# HOME-INSURANCE-SPEC.md: InsureWise

**Version:** 0.1 · **Status:** Draft · **Depends on:** PRD.md, CALCULATIONS.md, DATA-MODEL.md, UI-UX-SPEC.md
**Jurisdiction:** California (first verified state)

---

## 1. Overview

The home insurance feature lets a user enter their current homeowners (or condo/renters) policy, see a plain-language breakdown of Coverages A–F plus endorsements, explore deductible scenarios, understand what is and is not typically covered, and get sourced review items — all without submitting a name or address.

**What this feature is not:** a quote engine, a rating tool, a property valuation service, or a recommendation system.

---

## 2. Home Wizard (J2: `/home/new`)

Six steps. Same UX patterns as the car wizard (auto-save, back navigation, "I don't know" on optional fields).

---

### Step 1: Property

**Purpose:** capture the property type and physical characteristics that drive coverage recommendations and review rules.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Property type | Select: Single-family home / Townhome / Condo / Other | Yes | Condo → branch at step 3; Other → "unsupported in MVP" notice |
| Year built | Select: bands (Pre-1940 / 1940–1969 / 1970–1989 / 1990–2009 / 2010+) | Yes | Band, not exact year |
| Square footage | Number input | No | Used for C11 rebuild estimate |
| Stories | Select: 1 / 2 / 3+ | No | |
| Construction type | Select: Wood frame / Masonry / Steel frame / Not sure | No | |
| Foundation type | Select: Slab / Crawl space / Raised / Basement / Not sure | No | |
| Roof material | Select: Asphalt shingles / Tile / Metal / Wood shake / Flat / Not sure | No | |
| Roof age band | Segmented: Under 5 yrs / 5–10 / 11–20 / Over 20 / Not sure | No | Review item if over 20 |
| Manufactured / mobile home? | Checkbox | No | If checked → "Manufactured and mobile homes are not supported in MVP" notice; wizard stops |

**Validation:**
- Square footage ≥ 0 if entered
- Year bands are mutually exclusive selects — no free entry

---

### Step 2: Property Values

**Purpose:** enter the financial figures needed for coverage ratio calculations (C10, C11).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Estimated market value | Money | No | "I don't know" allowed; used for education only (not Coverage A) |
| Dwelling coverage limit (Coverage A) | Money | No | Entered by user — this is what their policy says |
| Cost per square foot to rebuild | Money (per sqft) | No | Illustrative; user enters; drives C11 |
| Rebuild estimate (C11 output) | Calculated display | — | Shown if sqft and cost/sqft both entered; Illustrative badge; "Show the math" |
| Personal property / contents value | Money | No | Drives Coverage C display and C10 ratio |
| High-value items | Repeating list: {category (Jewelry / Art / Electronics / Other), estimated value} | No | Drives review item about scheduled personal property |
| Additional living expenses limit (Coverage D) | Money | No | Entered from policy; C10 ratio vs Coverage A |

**Copy on rebuild estimate:**
> "This is a rough illustration using your entered cost-per-square-foot figure. Actual rebuild costs vary by location, materials and labor. A licensed appraiser or your insurer can give you a verified estimate. (Illustrative)"

**Review items from this step:**
- C10: Coverage A / rebuild estimate ratio < 80% → "Dwelling limit may be below estimated rebuild cost — worth reviewing"
- C10: Contents / Coverage A ratio — shown as informational, no threshold (reference needed before any threshold)
- High-value items entered with no scheduled endorsement noted → review item

---

### Step 3: Property Details (Systems and Risk Factors)

**Purpose:** protective devices and self-reported hazard flags that affect coverage and review items.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Smoke detectors | Yes / No / Not sure | No | |
| Fire sprinklers | Yes / No / Not sure | No | |
| Security system (monitored) | Yes / No / Not sure | No | |
| Deadbolt locks | Yes / No / Not sure | No | |
| Near a fire hydrant (within 1,000 ft) | Yes / No / Not sure | No | |
| Near a fire station (within 5 miles) | Yes / No / Not sure | No | |
| In a designated wildfire hazard zone | Yes / No / Not sure | No | Drives review item |
| In a FEMA flood zone | Yes / No / Not sure | No | Drives review item (RF-CA-HOME-003) |
| Pool or trampoline on property | Yes / No | No | Drives liability review item |

**Condo branch (if property type = Condo):**
- Additional fields: HOA master policy type (All-in / Bare walls / Not sure), unit floor number (band: Ground / 2–5 / 6+)
- Review item: "Condo coverage depends on your association's master policy — worth confirming what it covers before setting Coverage A"

---

### Step 4: Coverage

**Purpose:** enter the coverages, limits and deductibles from the policy.

#### Standard Coverages (A–F)

| Coverage | Plain-language name | Limit field | Deductible field | Notes |
|----------|--------------------|----|----|----|
| A | Dwelling | Money | All-perils deductible (money or % of A) | Core coverage |
| B | Other structures | Money | Shared with A deductible typically | |
| C | Personal property / Contents | Money | Shared or separate | ACV vs replacement cost selection |
| D | Additional living expenses / Loss of use | Money or % of A | — | |
| E | Personal liability | Money | — | Per-occurrence |
| F | Medical payments to others | Money | — | Per-person |

**Deductible types:**
- Flat dollar: money input
- Percentage of Coverage A: percent input + basis noted
- Wind / hail separate deductible: shown if state/zone applicable
- Earthquake and flood deductibles: separate section (see below)

**Valuation basis (Coverages A and C):**
- Select: Replacement Cost Value (RCV) / Actual Cash Value (ACV) / Not sure
- Drives C12 illustration; if ACV selected, educational note shown

#### Additional Coverages / Endorsements

| Endorsement | Included? | Limit | Notes |
|-------------|-----------|-------|-------|
| Earthquake coverage | Yes / No / Not sure | Money | Educational note: standard policies exclude earthquake (RF-CA-HOME-002 pending V2) |
| Flood coverage | Yes / No / Not sure | Money | Note: standard policies exclude flood; NFIP or private (RF-CA-HOME-003) |
| Scheduled personal property | Yes / No | Itemized list | Prompted if high-value items entered in step 2 |
| Water backup / sewer | Yes / No | Money | |
| Home business | Yes / No | Money | |
| Identity theft | Yes / No | Money | |
| Umbrella (noted, not modeled) | Yes / No | — | Informational only; umbrella is a separate policy |

**"Not covered" vs "Not entered" rule** (same as car):
- No toggle = "Not entered" (unknown)
- Toggle No = "Not included" (user stated absent)

---

### Step 5: Premium

Same structure as car wizard Step 4.

| Field | Type | Required |
|-------|------|----------|
| Total premium | Money | Yes |
| Payment basis | Select (6-month / 12-month / monthly / per installment) | Yes |
| Line-level breakdown | Optional | No |
| Fees | Optional repeating | No |
| Insurer label | Free text | No |
| Policy label | Free text | No |

---

### Step 6: Review

Same pattern as car wizard Step 5 — summary of all entered data, click to edit any section, "Save" button.

---

## 3. Home Policy Dashboard (`/home/[id]`)

### 3.1 Header
- Policy label, insurer label, Sample banner if applicable
- "Edit" and "Archive" actions

### 3.2 Premium Section
- Annual premium (C1), Calculated badge, "Show the math"
- Line-level composition chart (C7) if entered
- Fees listed separately

### 3.3 Coverage Breakdown (A–F + Endorsements)

One card per coverage, ordered A → B → C → D → E → F → Endorsements.

Each card:
- Coverage letter and plain-language name
- Status: Entered / Not entered / Not included
- Limit with provenance badge
- Deductible with provenance badge (and basis if percentage)
- Valuation basis (A and C)
- "What this covers" — sourced plain-language definition
- "Not typically covered" — sourced exclusions (RF-CA-HOME-002: earthquake, flood, mold, earth movement, wear and tear)

**Flood and earthquake notices (Reference, shown only when V2):**
> "Standard California homeowners policies typically do not cover flood damage. Flood coverage is usually purchased separately, often through the NFIP (federally administered; not regulated by CDI). (Source: CDI, verified [date].)"

> "Standard California homeowners policies typically do not cover earthquake damage. The California Earthquake Authority (CEA) offers earthquake insurance. (Source: CDI, verified [date].)"

**Coverage ratios panel (C10):**
- Dwelling vs rebuild estimate: [A] ÷ [rebuild estimate] = [ratio] (Illustrative if rebuild estimate from C11)
- Contents vs dwelling: [C] ÷ [A] = [ratio]
- Loss of use vs dwelling: [D] ÷ [A] = [ratio]
- Each ratio labeled with what it represents, not a judgment of whether it is "good"

### 3.4 Condo / Townhome Section
Shown if property type = Condo or Townhome.
- Educational pointer to master policy / HO-6 interplay
- Sourced from CDI guide (S-006) when V2
- Review item: "Confirm what your association's master policy covers before setting Coverage A"

### 3.5 FAIR Plan Notice
Shown if wildfire hazard zone = Yes or if user notes they were non-renewed.
> "The California FAIR Plan is the insurer of last resort for fire coverage. If you have FAIR Plan coverage, consider whether you need a 'difference in conditions' policy for other perils. (Source: CDI, verified [date].)" (RF-CA-HOME-004, RF-CA-HOME-005 — show only when V2)

### 3.6 Review Items (Gap Findings)

**Home-specific rules:**

| Rule ID | Condition | Severity | Template |
|---------|-----------|----------|----------|
| R-HOM-001 | No Coverage E (liability) entered | Info | "Personal liability coverage not entered — worth reviewing" |
| R-HOM-002 | Flood zone = Yes, no flood coverage entered | Warning | "Property is in a flood zone — flood coverage is not included in standard policies; worth reviewing NFIP or private options" |
| R-HOM-003 | Wildfire hazard zone = Yes, no noted endorsement | Info | "Property is in a wildfire hazard zone — worth reviewing coverage for fire and smoke damage" |
| R-HOM-004 | C10 dwelling/rebuild ratio < 80% (Illustrative threshold) | Warning | "Dwelling limit may be below estimated rebuild cost — worth reviewing with your insurer" |
| R-HOM-005 | High-value items entered, no scheduled endorsement | Info | "High-value items may have per-category limits under standard Coverage C — ask about scheduling them" |
| R-HOM-006 | Roof age > 20 years | Info | "Older roofs may be covered at ACV rather than replacement cost — worth asking your insurer" |
| R-HOM-007 | ACV basis selected for Coverage C | Info | "Contents at actual cash value means payouts reflect depreciation — worth reviewing if replacement cost applies" |
| R-HOM-008 | Pool or trampoline, Coverage E limit < [Illustrative threshold] | Info | "Pools and trampolines increase liability exposure — worth reviewing your liability limit" |
| R-HOM-009 | Earthquake coverage not entered in earthquake-prone area | Info | "Standard policies don't cover earthquake damage — the CEA offers earthquake insurance" |
| R-HOM-010 | C15: deductible shortfall | Info | "Entered deductible may exceed stated emergency savings" |

All rules with Illustrative thresholds: labeled as such, rationale in the rule's `parameters` field.

### 3.7 Risk Checklist (HOM-4)

Checklist items sourced from CDI and IBHS (where V2). Each item has:
- Text of the action
- Why it matters (one sentence, sourced)
- State: Todo / Reviewed / Not applicable (user-set)
- Source badge

Example items (to be authored with V2 sources):
- Review your dwelling limit against a current rebuild estimate
- Check whether your insurer covers your roof at ACV or replacement cost
- Confirm flood coverage status if in or near a flood zone
- Schedule high-value jewelry, art or electronics
- Review Coverage E liability limit
- Confirm condo master policy type (if applicable)
- Prepare a home inventory for Contents (Coverage C) claims

Progress bar: X of Y items reviewed. Shown on combined dashboard.

### 3.8 Scenarios and Compare Shortcuts
- "Explore deductible scenarios" → `/home/[id]/scenarios`
- "Compare this policy" → `/home/[id]/compare`

---

## 4. Deductible Simulator (`/home/[id]/scenarios`)

Same structure as car simulator. Applies C1, C3, C4, C5, C6 to the home policy.

**Home-specific notes:**
- Percentage deductibles: user enters the percentage; simulator computes dollar amount from Coverage A entered limit, shows `D = pct × A` in the trace
- Wind deductibles: if entered separately, simulator shows them as a second deductible option row
- "Claim every N years" view labeled Illustrative

---

## 5. Policy Comparison (`/home/[id]/compare`)

Same structure as car comparison. Rows:

1. Annual premium (C1)
2. Coverage A — Dwelling limit + deductible
3. Coverage B — Other structures limit
4. Coverage C — Contents limit + valuation basis
5. Coverage D — Loss of use limit
6. Coverage E — Liability limit
7. Coverage F — Medical payments limit
8. Earthquake coverage (Yes / No / Not entered)
9. Flood coverage (Yes / No / Not entered)
10. Scheduled personal property (Yes / No)
11. Water backup (Yes / No)
12. Endorsements (one row per unique endorsement)
13. Fees
14. Policy term
15. Insurer label

Comparability warnings: same engine as car, applied to home fields.

---

## 6. Education Content (Home)

### 6.1 Glossary Terms (home-specific)
Coverage A–F · dwelling · other structures · personal property · actual cash value · replacement cost value · loss of use · liability · medical payments · deductible · endorsement · exclusion · FAIR Plan · NFIP · earthquake coverage · flood coverage · umbrella policy · scheduled personal property · home inventory

### 6.2 "Why Prices Differ" (home section)
Sourced factors (CDI sources only, V2 required):
- Location and fire protection class
- Construction type and age
- Roof age and material
- Claims history
- Coverage limits and deductibles
- Protective devices

### 6.3 Claims Guide (home scenarios, EDU-3)

Seven claim scenarios for home. Each: typical steps, questions to ask, disclaimers. Sourced from CDI.

1. Fire or smoke damage
2. Water damage (burst pipe — not flood)
3. Theft / burglary
4. Wind or hail damage
5. Liability claim (visitor injured)
6. Additional living expenses claim (forced to leave home)
7. Earthquake or flood (typically excluded — what to do)

Global disclaimer:
> "Claims processes vary by policy and insurer. This guide is educational and based on general information from the California Department of Insurance. Read your policy and contact your insurer for steps specific to your situation."

---

## 7. Data Collected (Home Feature)

Stored in: `properties`, `policies`, `policy_coverages`, `policy_endorsements`, `scenarios`, `review_findings`, `checklist_progress`.

**Never collected:** street address, parcel number, exact year built (bands only), name of insured.

**Banded:** year built band, roof age band, floor band (condo).

---

## 8. Requirement Cross-Reference

| Requirement | Where implemented |
|-------------|-------------------|
| HOM-1 | Step 6 (Review) + Dashboard §3.1 |
| HOM-2 | Dashboard §3.3 (Coverage Breakdown + ratios) |
| HOM-3 | Condo branch §3.4; manufactured homes §2 Step 1 |
| HOM-4 | Risk Checklist §3.7 |
| INK-1 | Wizard §2 (six steps) |
| INK-2 | "I don't know" on all optional fields |
| INK-4 | No address, parcel number or personal IDs |
| SCN-1 | Deductible Simulator §4 |
| CMP-1–6 | Comparison §5 |
| GAP-1–4 | Review Items §3.6 |
| INT-1–6 | Provenance badges throughout |

---

## 9. Open Items

1. RF-CA-HOME-002, RF-CA-HOME-003, RF-CA-HOME-004: currently V1 — no content until V2
2. California Earthquake Authority description (RF-CA-HOME pending): needs Tier 1 source
3. FAIR Plan current coverage scope (RF-CA-HOME-005): WATCH status — re-verify before use
4. NFIP waiting period (RF-CA-HOME-007): V0 — needs FEMA primary source
5. Whether to model renters insurance as a variant of the home wizard (Phase 2)
6. Home inventory helper (nice-to-have for Coverage C — deferred to future phase)
7. Wildfire non-renewal consumer protections: CDI source needed before any content on this topic
