# RESEARCH-SOURCES.md

**Project:** InsureWise (Car & Home Insurance Decision Platform)
**Scope:** United States; California first (auto, then home)
**Registry started:** 2026-10-01 · **Status:** Phase 0, in progress

This registry is the only place Reference facts originate. A fact may not appear in the product, the AI fact packets or the education copy unless it has a record here that reaches verification level **V2**.

---

## 1. Source Tiers

| Tier | What qualifies | May support a Reference fact? |
|------|----------------|-------------------------------|
| **1** | Statutes, regulations, official bulletins and consumer guides from state insurance departments, state DMVs, federal agencies | Yes |
| **2** | Recognized non-profit or industry education (NAIC, Triple-I, IBHS, CEA, FAIR Plan Association) | Yes, if no Tier 1 source exists, and labeled as such |
| **3** | Insurer-published documents (sample forms, filings) | Format illustration only; re-created synthetically |
| **4** | Comparison/lead-gen sites, insurer marketing blogs, law-firm blogs, advocacy sites, news reprints, content mirrors | **No.** May be used as a *pointer* to a Tier 1 source, never as the basis |

**Why Tier 4 is excluded (observed in this research pass):** secondary sources disagreed with each other. For example, they gave different signing years for California's auto minimum-limit law, and one gave a 2035 effective date for what is a 2025 change. Tier 1 documents resolved each disagreement. That is the evidence behind this rule.

## 2. Verification Levels

| Level | Meaning | May ship? |
|-------|---------|-----------|
| **V0** | Claim noted, no source captured | No |
| **V1** | A Tier 1/2 source excerpt was seen via search; full document not yet captured | No |
| **V2** | Full primary document captured (URL, retrieval date, saved copy or exact section), claim confirmed against it, second-pass human check recorded | **Yes** |
| **WATCH** | Verified once but known to be changing; needs a re-check date | Only with a visible "as of" date |

Every V2 record stores: `source_id`, `url`, `retrieved_at`, `section_or_page`, `effective_from`, `effective_to` (nullable), `verified_by`, `verified_at`, `recheck_by`.

## 3. Source Registry (this pass)

| ID | Title | Publisher | Tier | URL | Supports |
|----|-------|-----------|------|-----|----------|
| S-001 | Bulletin 2023-1: Increase in Private Passenger Motor Vehicle Financial Responsibility Requirements (SB 1107), dated Jan 30, 2023 | California Dept. of Insurance | 1 | https://www.insurance.ca.gov/0250-insurers/0300-insurers/0200-bulletins/bulletin-notices-commiss-opinion/upload/bulletin-2023-1-re-sb-1107-final-003.pdf | CA minimum liability limits; effective date |
| S-002 | Consumer Alert: California's Low Cost Auto Insurance (July 23, 2024) | CDI | 1 | https://www.insurance.ca.gov/0400-news/0102-alerts/2024/California-s-Low-Cost-Auto-Insurance.cfm | SB 1107 raises mandatory limits from 2025; Low Cost Auto program limits unchanged |
| S-003 | Vehicle Code §16500 (text as mirrored) | California Legislature (mirror site) | 1 (mirror; capture leginfo original) | https://california.public.law/codes/vehicle_code_section_16500 | Limits, "issued or renewed on or after Jan 1, 2025," scheduled 2035 increase |
| S-004 | Impact Analysis of Weighting Auto Rating Factors: Executive Summary | CDI | 1 | https://www.insurance.ca.gov/0400-news/0200-studies-reports/0600-research-studies/auto-policy-studies/executive-summary.cfm | Prop 103 mandatory rating factors |
| S-005 | Summary of Proposition 103 (CDI Rate Regulation Division; archived copy, ~2003) | CDI (archived by another agency) | 1 (archived; replace with current CDI/leginfo text) | https://archive.legmt.gov/content/Committees/Administration/Legislative%20Council/2003-4/Subcommittees/Staff%20Reports/appendix_d.pdf | Order of mandatory factors; commissioner-approved optional factors |
| S-006 | Homeowners Insurance consumer guide (updated 12/19/24) | CDI | 1 | https://www.insurance.ca.gov/01-consumers/105-type/95-guides/upload/Homeowners-Insurance-Updated-121924.pdf | Not usually covered items; no state requirement; lender requirements; FAIR Plan pointer |
| S-007 | Flood Insurance Resources | CDI | 1 | https://www.insurance.ca.gov/01-consumers/140-catastrophes/FloodFacts.cfm | Flood exclusion; NFIP; CDI does not regulate NFIP |
| S-008 | Consumer Alerts: Hurricane Hilary (2023) and Preparing for Winter Storms (2023) | CDI | 1 (dated) | https://www.insurance.ca.gov/0400-news/0102-alerts/2023/Consumer-Alert-on-Hurricane-Hilary.cfm | FAIR Plan storm-damage statement; comprehensive auto and flood |
| S-009 | Homeowners and Renters one-pager (updated 09/12/23) | CDI | 1 | https://www.insurance.ca.gov/01-consumers/105-type/95-guides/03-res/upload/Residential-Insurance-Homeowners-and-Renters-One-Pager-Updated-091223.pdf | FAIR Plan description; NFIP origin |

## 4. Reference Fact Candidates

| Fact ID | Candidate fact (paraphrased) | Sources | Level | Notes |
|---------|------------------------------|---------|-------|-------|
| RF-CA-AUTO-001 | Minimum private-passenger liability limits of $30,000 per person / $60,000 per accident (bodily injury) and $15,000 (property damage), effective Jan 1, 2025 | S-001, S-003 | **V1** | Capture leginfo text of the operative Vehicle Code sections (the bulletin cites §16056; the mirrored text shown is §16500; confirm which subsections apply) |
| RF-CA-AUTO-002 | Applies to policies issued or renewed on or after Jan 1, 2025 | S-003 | **V1** | Insurers lobbied for renewal-based timing; confirm with CDI bulletin text |
| RF-CA-AUTO-003 | Statute schedules a further increase on Jan 1, 2035 (+$20,000 per person, +$40,000 per accident, +$10,000 property damage) | S-003 | **V1 / WATCH** | Model as a *scheduled rule change*; never display as current |
| RF-CA-AUTO-004 | Prop 103 requires auto rates to rest on three mandatory factors, in decreasing order of importance: driving safety record, annual miles driven, years of driving experience; the Commissioner may approve other factors | S-004, S-005 | **V1** | Capture Insurance Code §1861.05 from leginfo |
| RF-CA-AUTO-005 | Status of optional factors (e.g., marital status) is changing | Not yet from Tier 1 | **V0 / WATCH** | Found only in a news reprint of a CDI release. Obtain the CDI original and current regulation status before any factor-specific content |
| RF-CA-AUTO-006 | UM/UIM and MedPay are optional in California | Not yet from Tier 1 | **V0** | Found only on a law-firm site (Tier 4). Verify against Insurance Code and CDI guidance |
| RF-CA-HOME-001 | California does not require homeowners insurance; a mortgage lender may require coverage and flood insurance in high-risk flood zones | S-006 | **V1** | |
| RF-CA-HOME-002 | Earthquake, flood, mold, earth movement and "wear and tear" are usually not covered by a homeowners policy | S-006 | **V1** | Wording must stay "usually," never "never" |
| RF-CA-HOME-003 | Homeowners policies typically exclude flood, mudslide and debris flow; flood coverage is generally purchased separately, mostly through the NFIP (federal, FEMA-administered), which CDI does not regulate | S-007, S-008 | **V1** | Capture FEMA/FloodSmart primary for NFIP details |
| RF-CA-HOME-004 | The FAIR Plan is an association of property insurers licensed in California and the insurer of last resort for fire coverage | S-009 | **V1** | Capture FAIR Plan Association's own description |
| RF-CA-HOME-005 | CDI stated (2023) that the FAIR Plan did not cover storm-related damage unless the consumer bought a supplemental "difference in conditions" policy | S-008 | **V1 / WATCH** | Dated; re-verify before use |
| RF-CA-HOME-006 | Comprehensive auto coverage protects the vehicle against flood damage | S-008 | **V1** | Confirm with policy-form language |
| RF-CA-HOME-007 | NFIP policies have a waiting period before taking effect | Only a 2015 CDI memo | **V0** | Verify against current FEMA documentation |

## 5. Rejected as Basis (Tier 4, used only to locate Tier 1)
Insurer marketing blogs, rate-comparison and lead-generation sites, law-firm blogs, advocacy organizations, news and press-release aggregators, and content-mirror domains. Their numbers matched Tier 1 in some cases, but they are not used as evidence. Industry-trade figures such as FAIR Plan growth statistics were seen only on a Tier 4 site and are **not** used.

## 6. Positioning Check (verify in Phase 0)
CDI has offered its own consumer comparison tools in the past (mentioned in an older Commissioner memo). Confirm what CDI currently offers so the Methodology page describes InsureWise accurately as complementary and educational, and does not duplicate or contradict regulator tools.

## 7. Phase 0 Research Backlog

**California auto:** capture leginfo text for Vehicle Code financial-responsibility sections and Insurance Code §§1861.05 and 11580.1b; UM/UIM and MedPay rules; CDI auto consumer guide; claims-handling timelines and consumer rights (CDI); California Low Cost Auto program description; DMV financial-responsibility page.
**California home:** CDI homeowners and claims guides in full; FAIR Plan Association description and current coverage scope; California Earthquake Authority description; wildfire-related consumer protections (non-renewal rules) from CDI; standard coverage structure (Coverages A–F) from a regulator or NAIC source.
**Federal/national:** FEMA/NFIP (FloodSmart) basics and waiting period; NAIC consumer glossary and auto/home guides; Triple-I explainers for replacement cost vs actual cash value and deductibles; IBHS mitigation guidance (described, never promised as discounts).
**Claims guide:** CDI and NAIC claims guidance for each of the seven workflows.

## 8. Re-verification Cadence
Rules and limits: quarterly. Definitions and consumer guidance: annually. Anything marked WATCH: before every release. A Reference record older than 12 months shows a stale-data notice in the UI.

## 9. Verification Log

| Date | Fact IDs | Action | By |
|------|----------|--------|----|
| 2026-10-01 | RF-CA-AUTO-001…006, RF-CA-HOME-001…007 | Initial search pass; excerpts reviewed; levels assigned | Claude-assisted; human V2 review pending |
