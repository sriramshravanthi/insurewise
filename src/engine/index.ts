/**
 * InsureWise Calculation Engine
 * Pure TypeScript — no I/O, no imports from UI/DB/AI.
 */

export { ENGINE_VERSION, roundHalfUp, formatCents, weakerProvenance, provenanceOfInputs } from "./types";
export type { Provenance, ProvenancedInput, TraceStep, CalculationTrace, EngineResult, FieldError } from "./types";

export { c1AnnualizedPremium } from "./c1-annualized-premium";
export type { C1Input, AmountBasis, TermMonths, InstallmentsPerYear } from "./c1-annualized-premium";

export { c2CombinedAnnualCost } from "./c2-combined-annual-cost";
export type { C2Input } from "./c2-combined-annual-cost";

export { c3OutOfPocket } from "./c3-out-of-pocket";
export type { C3Input, LimitBasis } from "./c3-out-of-pocket";

export { c4DeductibleTradeoff, c5BreakEven, c6NYearCostView } from "./c4-deductible-tradeoff";
export type { C4Input, C4Output, C5Output, C6Input, C6Option } from "./c4-deductible-tradeoff";

export { c7PremiumComposition } from "./c7-premium-composition";
export type { PremiumLine, C7LineShare } from "./c7-premium-composition";

export { c8ScenarioDelta, c9BundleDelta } from "./c8-c9-deltas";
export type { C8Input, C8Output, C9Input, C9Output } from "./c8-c9-deltas";

export { c10CoverageRatios, c11RebuildEstimate } from "./c10-c11-home-ratios";
export type { C10Input, C10Output, C11Input } from "./c10-c11-home-ratios";

export { c12AcvIllustration, c13CoverageCostRatio, c14LoanVsValueShortfall, c15DeductibleAffordability } from "./c12-c13-c14-c15-vehicle";
export type { C12Input, C12Output, C13Input, C14Input, C15Input } from "./c12-c13-c14-c15-vehicle";

export { checkComparability } from "./comparability";
export type { ComparabilityWarning, ComparabilityWarningCode, PolicySnapshot } from "./comparability";

export { evaluateReviewRule, evaluateAllRules } from "./review-rules";
export type { ReviewRule, ReviewRuleResult, RuleSeverity } from "./review-rules";
