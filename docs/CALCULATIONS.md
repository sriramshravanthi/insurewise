# CALCULATIONS.md: InsureWise Engine Specification

**Version:** 0.1 · **Engine module:** `src/engine` (pure TypeScript)
**Scope decision (D2):** the engine contains **no premium-rating algorithm and no claim-probability model.** Premiums are always Entered by the user or labeled Illustrative.

## 1. Global Rules

**Purity.** No I/O, no randomness, no system clock. Dates and reference data are parameters.

**Money.** Integer cents. All arithmetic on money is integer arithmetic. Ratios are kept as exact fractions (numerator/denominator) until display.

**Rounding.** Round half up to the nearest cent for a *named output*, never for intermediate steps. Percentages display to one decimal using half-up. Sets of percentages that must total 100% (composition) use the largest-remainder method so displayed values sum to exactly 100.0%.

**Result type.** Every function returns one of:
- `ok`: `{value, trace}`
- `insufficient_data`: `{missing: [fieldKeys]}`, used instead of guessing
- `invalid`: `{errors: [{field, code, message}]}`, for impossible inputs (negative money, non-finite numbers, ordering violations)

**Trace (feeds "Show the math").** `{formulaId, engineVersion, inputs:[{key, label, value, provenance}], steps:[{label, expression, result}], output, roundingNote, notes[]}`.

**Provenance of outputs.** An output is *Calculated* if all inputs are Entered or Reference. If any input is Illustrative, the output is labeled **Illustrative** (the weakest input label wins).

**Versioning.** `engineVersion` (semver) is stored with saved scenarios so old results remain interpretable.

## 2. Formulas

### C1: Annualized premium
**Inputs:** `amountCents`, `amountBasis` ∈ {`per_term`, `per_installment`}, `termMonths` ∈ {1, 3, 6, 12}, `installmentsPerYear` ∈ {1, 2, 4, 12} (only for `per_installment`).
**Formula:**
- per term: `annual = amount × (12 / termMonths)`
- per installment: `annual = amount × installmentsPerYear`
**Fees:** each fee has `recurrence` ∈ {`per_term`, `per_installment`, `one_time`}. Recurring fees are annualized the same way. One-time fees are listed separately and **excluded** from annual totals unless the user opts in.
**Edge cases:** missing term → `insufficient_data`; term not dividing 12 → `invalid`; zero premium → `ok` with a note.
**Example:** a $900 six-month premium → 900 × (12 / 6) = **$1,800/yr**. A $150 monthly installment → 150 × 12 = **$1,800/yr**.

### C2: Combined annual cost
`combined = annual_car + annual_home` (each from C1). If either is missing → `insufficient_data` listing which; never treats missing as zero.
**Example:** $1,800 + $2,400 = **$4,200/yr**.

### C3: Out-of-pocket on a claim (first-party coverages)
**Inputs:** `loss` L ≥ 0, `deductible` D ≥ 0, optional `limit` M, `limitBasis` ∈ {`after_deductible`, `before_deductible`}.
**Formula:**
- `after_deductible` (default): `insurerPays = max(0, min(L − D, M))`
- `before_deductible`: `insurerPays = max(0, min(L, M) − D)`
- `userPays = L − insurerPays`

**Why two bases:** how a limit and a deductible interact can vary by policy form. Until the order is verified against a sourced sample form, outputs from this function are labeled **Illustrative** and the UI says "check your policy language." (This replaces the single formula in the draft blueprint, which assumed only the "before" order.)
**Percentage deductibles:** `D = pct × baseLimit`, where `baseLimit` is entered (for example the dwelling limit). The UI states that how the percentage is applied depends on the policy.
**Edge cases:** L < D → insurer pays 0; no limit → M treated as unbounded; L = 0; D > M.
**Examples:**
- L = $8,000, D = $1,000, no limit → insurer $7,000, user **$1,000**.
- L = $500, D = $1,000 → insurer $0, user **$500**.
- L = $300,000, D = $2,000, M = $250,000 → `after`: insurer $250,000, user **$50,000**; `before`: insurer $248,000, user **$52,000**.

*Liability coverage is not modeled with deductibles in C3.*

### C4: Deductible trade-off
**Inputs:** two options, low deductible `D_low` with annual premium `P_low`, high deductible `D_high` with `P_high` (all Entered).
**Outputs:** `annualPremiumDifference = P_low − P_high` (positive means the higher deductible has the lower premium); `extraOutOfPocketIfClaim = D_high − D_low`.
**Edge cases:** `D_high ≤ D_low` → `invalid` (ordering); `P_high ≥ P_low` → `ok` with a note that no premium reduction was entered for the higher deductible (shown neutrally, not blocked).

### C5: Break-even (claim-free years)
**Formula:** `breakEvenYears = (D_high − D_low) / (P_low − P_high)`, only when `P_low − P_high > 0`.
**Meaning:** the number of claim-free years after which the entered premium savings would have offset the extra deductible. It is arithmetic on entered numbers, not a prediction.
**Edge cases:** savings ≤ 0 → status `no_premium_savings_entered`, no number.
**Example:** D_low $500 @ $1,400/yr; D_high $1,000 @ $1,250/yr → 500 / 150 = **3.33 → "about 3.3 years."**

### C6: N-year cost view ("claim every N years")
**Inputs:** options from C4, `N` ≥ 1 (Illustrative, user-editable), assumes exactly one claim over the N years with loss ≥ deductible.
**Formula (per option):** `cost = N × annualPremium + deductible`.
**Output label:** Illustrative (N is an assumption). Not a probability.
**Example (N = 5):** low-deductible option 5 × 1,400 + 500 = **$7,500**; high-deductible option 5 × 1,250 + 1,000 = **$7,250**. At N = 3: **$4,700** vs **$4,750**, consistent with the 3.3-year break-even.

### C7: Premium composition
**Inputs:** line-level annual premiums (Entered). **Output:** each line as a share of the total, largest-remainder rounded to sum to 100.0%.
**Edge cases:** total = 0 → `insufficient_data`; lines not summing to the entered total → show an "unallocated" line (never silently rescale).
**Example:** liability $600, collision $400, comprehensive $150, UM $100 (total $1,250) → **48.0%, 32.0%, 12.0%, 8.0%.**

### C8: Scenario delta
`delta = P_scenario − P_baseline`; `pct = delta / P_baseline`. Sign preserved. Baseline = 0 → `insufficient_data` for the percentage.
**Example:** baseline $2,000, scenario $2,150 → **+$150 (+7.5%)**.

### C9: Bundle delta
`separate = Σ annual premiums of the separate policies`; `difference = separate − bundled` (positive means the bundle entry is lower); `pct = difference / separate`.
**Output wording is generated from the sign** (lower / higher / the same) and always accompanied by the comparability checks in §3.
**Examples:** separate $4,200, bundled $3,950 → bundle entry **$250 lower (6.0%)**. Bundled $4,300 → **$100 higher (2.4%)**.

### C10: Home coverage ratios
- `contentsRatio = C / A`, `lossOfUseRatio = D / A` (Entered values; displayed with the observation that common policy structures set these as defaults, but only where a verified source exists).
- `dwellingVsRebuild = A / rebuildEstimate` where `rebuildEstimate` is Entered, or computed by C11.
**Example (Illustrative inputs):** A = $600,000; C = $300,000 → **50.0%**; D = $120,000 → **20.0%**; rebuild estimate $700,000 → A ÷ estimate = **85.7%**.

### C11: Rebuild estimate helper
`rebuildEstimate = squareFeet × costPerSqFt`. `costPerSqFt` is **Entered by the user** (Illustrative); the engine ships no built-in cost-per-square-foot figures unless a cited reference exists.
**Example:** 2,000 × $350 = **$700,000** (Illustrative).

### C12: Actual cash value illustration
`acvLoss = L × (1 − depreciationPct)`, where `depreciationPct` is Entered and Illustrative. Feeds C3 to contrast replacement-cost and actual-cash-value settlement. The model is **simplified**; real settlement mechanics vary by policy.
**Example:** replacement-cost loss $20,000, depreciation 30%, deductible $1,000 → ACV basis: loss $14,000, insurer pays **$13,000**, user pays **$7,000**; replacement-cost basis: insurer pays **$19,000**, user pays **$1,000**.

### C13: Coverage cost relative to vehicle value
`ratio = annual(collision + comprehensive premium) / vehicleValue` (both Entered). The engine returns the ratio only. Any threshold used to raise a review item is a labeled Illustrative rule parameter, not an engine constant.
**Example:** $550 / $6,000 = **9.2%**.

### C14: Loan-versus-value shortfall
`shortfall = max(0, loanBalance − vehicleValue)`; also reports `gapCoverageEntered`.
**Example:** $22,000 − $18,500 = **$3,500**.

### C15: Deductible affordability (optional input)
`shortfall = max(0, deductible − emergencySavings)`; savings optional and never required.
**Example:** $1,000 deductible vs $800 savings → **$200 shortfall.**

## 3. Comparability Checks (comparison engine)
Pure functions over normalized policies. Each returns a typed warning with the fields involved:
`DIFFERENT_LIMIT`, `DIFFERENT_DEDUCTIBLE`, `COVERAGE_ONLY_IN_ONE`, `DIFFERENT_TERM`, `DIFFERENT_VALUATION_BASIS`, `FIELD_NOT_ENTERED`, `DIFFERENT_POLICY_TYPE` (blocks comparison). Warnings never imply which policy is preferable.

## 4. Review-Rule Evaluation Semantics
A rule is `{id, appliesTo, requiredInputs, condition, severity, messageTemplateId, sourceIds, parameters}`. Evaluation: if any required input is missing → result `not_enough_information`; else evaluate `condition` over inputs and parameters. Parameters that encode judgment (for example a ratio threshold) carry `provenance: Illustrative` and a rationale, or the rule is not shipped. Output includes the inputs used so the UI can show "what this is based on."

## 5. Testing Requirements
- **Unit tests:** every formula, every edge case above, and every example in this document as a golden test.
- **Property tests (fast-check):**
  - `userPays + insurerPays = L`; both ≥ 0; `userPays ≤ L`.
  - Increasing D never decreases `userPays` (same basis, same L, M).
  - With no limit, `userPays = min(L, D)`.
  - C1 round-trip: per-installment monthly × 12 equals per-term (12-month) when equivalent.
  - C7 percentages always sum to exactly 100.0%.
  - C8/C9 antisymmetry: swapping baseline and scenario flips the sign of the delta.
  - No function returns `NaN`, `Infinity` or negative money.
- **Oracle tests:** results cross-checked against an independent spreadsheet built separately from the code.
- **Trace tests:** each output has a trace whose steps reproduce the output when re-evaluated.
- **Mutation testing (optional):** on the engine to confirm tests detect formula changes.

## 6. Change Control
Any formula change requires updating this document, the golden tests and the engine version. Saved scenarios keep their original `engineVersion` and display it.
