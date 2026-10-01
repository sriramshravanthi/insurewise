# PRD.md: InsureWise Product Requirements

**Version:** 0.1 · **Status:** Draft for review · **Approved decisions:** (D1) California-first verified content, multi-state architecture; (D2) user-entered or Illustrative premiums only, no rating/quote algorithm; (D3) guest-first, sign-in only to save across devices; (D4) "InsureWise" as working brand.

## 1. Purpose
Help U.S. households understand car and home insurance, explore what-if scenarios with transparent math, compare hypothetical policies by their differences, and prepare questions for a licensed professional. Also serve as an employer-facing demonstration of product, UX, engineering, data, AI, testing and deployment skill.

## 2. Goals and Non-Goals

**Goals**
- G1: A first-time user completes a car or home profile and sees a coverage breakdown in under 10 minutes using partial data.
- G2: Every number is traceable (provenance label plus "Show the math" for Calculated values).
- G3: Comparisons reveal differences without ranking.
- G4: The AI assistant is helpful and structurally unable to invent facts.
- G5: A reviewer can run the full demo journey in under 10 minutes with no sign-up.

**Non-goals (MVP):** real quotes or insurer integrations; premium prediction; recommendations; real document upload; lead generation; binding or payments; more than one verified state; native apps.

## 3. Users
Everyday policyholders, shoppers around life events, first-time buyers, and portfolio reviewers. Personas are in the blueprint; the reviewer persona drives demo requirements (R-DEMO).

## 4. Requirements

IDs are stable. Priority: **M** = MVP must, **S** = MVP should, **F** = future.

### 4.1 Integrity and disclosure (INT)
| ID | Requirement | Pri |
|----|-------------|-----|
| INT-1 | Every displayed number carries one provenance label (Entered/Calculated/Reference/Illustrative/Sample) | M |
| INT-2 | Calculated values expose a "Show the math" view: formula ID, inputs with labels, rounding note | M |
| INT-3 | Reference values display source, effective date and verification date; stale (>12 months) shows a notice | M |
| INT-4 | Persistent disclosure: educational tool, not an insurer, agent or broker; scenario premiums are not quotes | M |
| INT-5 | Sample data always shows a visible Sample banner and uses fictional names | M |
| INT-6 | A language lint blocks ranking and advice phrasing in UI copy and AI output | M |

### 4.2 Intake (INK)
| ID | Requirement | Pri |
|----|-------------|-----|
| INK-1 | Multi-step wizards for car and home with per-step validation and review step | M |
| INK-2 | Every optional field supports "I don't know"; the product works with partial data | M |
| INK-3 | Autosave (browser for guests, server when signed in); resume after refresh | M |
| INK-4 | No collection of name, address, VIN, license number, policy number, SSN, DOB; free-text fields reject SSN/card-like patterns | M |
| INK-5 | Inputs use bands where precision is not needed (age band, mileage band, ZIP) | M |

### 4.3 Car (CAR) and Home (HOM)
| ID | Requirement | Pri |
|----|-------------|-----|
| CAR-1 | Car profile summarizing vehicle, drivers, coverage, deductibles, premium | M |
| CAR-2 | Coverage breakdown with plain-language definitions linked to the coverage catalog; missing = "Not entered," never "Not covered" | M |
| CAR-3 | Premium explanation: line-level composition when entered; sourced factor cards mapped to entered attributes | M |
| CAR-4 | Split-limit parsing ("100/300/50") and normalization | M |
| HOM-1 | Home profile summarizing property, values, coverage, deductibles, premium | M |
| HOM-2 | Coverage breakdown (A–F plus endorsements) with ratios; explains market value vs rebuild cost | M |
| HOM-3 | Condo/townhome branch with educational pointer to association/master-policy interplay; manufactured/mobile homes show an "unsupported in MVP" state | M |
| HOM-4 | Home risk checklist with progress | M |

### 4.4 Scenarios and comparison (SCN, CMP)
| ID | Requirement | Pri |
|----|-------------|-----|
| SCN-1 | Deductible simulator: loss amount, 2–4 deductible options each with an entered premium; out-of-pocket, annual difference, break-even years | M |
| SCN-2 | "Claim every N years" view labeled Illustrative with editable N | S |
| SCN-3 | Save, rename, duplicate, delete scenarios (guest: local; signed in: server) | M |
| CMP-1 | Compare a baseline and up to three hypothetical policies of the same type | M |
| CMP-2 | Row-by-row differences across premium, limits, deductibles, optional coverages, limitations, benefits | M |
| CMP-3 | Comparability warnings (limits, deductibles, term, missing coverage, valuation basis) | M |
| CMP-4 | No scores, winners or "best" labels; user-chosen sort only, labeled as such | M |
| CMP-5 | Responsive layout: table on wide screens, card stack on mobile | M |
| CMP-6 | `PolicyProvider` interface with Manual and Sample providers | M |

### 4.5 Gaps, checklist, combined (GAP, CMB)
| ID | Requirement | Pri |
|----|-------------|-----|
| GAP-1 | Rule-driven review items from entered data only; each shows "why this appears," inputs used and source | M |
| GAP-2 | Rules missing inputs are skipped with "Not enough information"; empty results state they do not imply adequacy | M |
| GAP-3 | Messages are templates, never LLM-written | M |
| GAP-4 | Heuristic thresholds are labeled Illustrative with rationale, or omitted | M |
| CMB-1 | Dashboard shows combined annual cost, policy cards, coverage matrix, review items, scenarios, charts, checklist, assistant | M |
| CMB-2 | Bundle scenario: user-entered bundled premium(s); difference may be positive, negative or zero; comparability checks; neutral wording | M |

### 4.6 AI assistant (AI)
| ID | Requirement | Pri |
|----|-------------|-----|
| AI-1 | Explains terms, entered policy data, comparison results, general claims steps, questions for a professional | M |
| AI-2 | Uses only fact packets and read-only lookup tools; cites fact IDs | M |
| AI-3 | Refuses to recommend, quote, or state unverified legal requirements; says so when verified data is missing | M |
| AI-4 | Output validator: schema, citation presence, numeric grounding, language policy; regenerate once then safe fallback | M |
| AI-5 | Rate limits and token budget; streaming responses | M |
| AI-6 | Evaluation harness with 100+ prompts including adversarial cases, run in CI | M |

### 4.7 Education (EDU)
| ID | Requirement | Pri |
|----|-------------|-----|
| EDU-1 | Searchable glossary with sourced definitions and inline accessible tooltips | M |
| EDU-2 | "Why prices differ" explainer limited to sourced factors, with jurisdiction notes | M |
| EDU-3 | Claims guide for seven scenarios with a global "depends on your policy" disclaimer | M |
| EDU-4 | "Questions to ask a professional" generated from templates tied to findings and differences | M |
| EDU-5 | Synthetic document explainer with annotated regions and grounded Q&A | S |
| EDU-6 | Methodology and Sources pages publish how numbers are produced and every source | M |

### 4.8 Platform (PLT) and Demo (DEMO)
| ID | Requirement | Pri |
|----|-------------|-----|
| PLT-1 | Guest mode, full flow without sign-in | M |
| PLT-2 | Sign-in (magic link, Google) only to save across devices; guest data migrates | M |
| PLT-3 | Data export and delete-my-data | M |
| PLT-4 | Multi-state architecture: unsupported states show "verified information isn't available yet" and skip state-specific features | M |
| DEMO-1 | One-click "Try sample household" | M |
| DEMO-2 | Scripted 10-minute walkthrough documented in README | M |

### 4.9 Non-functional (NFR)
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Accessibility | WCAG 2.2 AA; axe zero serious/critical on all routes and states |
| NFR-2 | Responsive | 320 px to 1920 px; verified on phone, tablet, laptop, desktop |
| NFR-3 | Performance | Lighthouse performance ≥ 90 on marketing and education pages; engine recalculation under 50 ms for scenario edits |
| NFR-4 | Security | RLS isolation proven by tests; no high-severity findings in dependency or ZAP scans |
| NFR-5 | Reliability | Graceful degradation if AI or DB is unavailable (engine and education continue) |
| NFR-6 | Test coverage | Engine ≥ 95% branch coverage; all journeys in E2E |

(Targets are project goals set for this portfolio, not industry claims.)

## 5. Key Acceptance Criteria (examples)

**SCN-1:** Given a loss of $8,000 and two options (deductible $500 at $1,400/yr; deductible $1,000 at $1,250/yr), the simulator shows out-of-pocket $500 and $1,000, an annual premium difference of $150, and a break-even of about 3.3 claim-free years, each with a provenance label and a "Show the math" view.

**CMP-4:** No element in any comparison state contains ranking language; a test fails the build if it does.

**GAP-2:** With no vehicle value entered, the "loan balance vs value" rule displays "Not enough information," and no finding is produced.

**AI-3:** Asked "Which insurer is best?", the assistant declines to rank and offers to explain how the compared policies differ, citing the comparison result.

**PLT-4:** With state = Texas, state-specific minimum-limit content shows "verified information isn't available yet" while calculations and comparison still work.

## 6. Release Criteria (MVP)
All M requirements met; California auto and home Reference records at V2; every journey (J1–J8) green in E2E on desktop and mobile viewports; AI evaluation gates passed; accessibility audit complete; legal/compliance review completed before any public promotion; deployed with CI gating.

## 7. Open Questions
1. Final design direction and logo (UI-UX-SPEC).
2. Whether to add a short privacy-friendly analytics layer in MVP or defer.
3. Whether the sample household covers both Car and Home in one persona (assumed yes).
