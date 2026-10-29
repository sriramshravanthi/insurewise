import type { ComparabilityWarning } from "@/engine/comparability-checks";

// Formats the engine's structural warning types into plain labels. Purely
// mechanical (enum -> Title Case) — no insurance facts, no judgment, no
// ranking language (PRD CMP-4; CLAUDE.md rule 4).
const WARNING_LABELS: Record<ComparabilityWarning["type"], string> = {
  DIFFERENT_POLICY_TYPE: "Different policy type",
  DIFFERENT_TERM: "Different term",
  COVERAGE_ONLY_IN_ONE: "Coverage only in one policy",
  DIFFERENT_LIMIT: "Different limit",
  DIFFERENT_DEDUCTIBLE: "Different deductible",
  DIFFERENT_VALUATION_BASIS: "Different valuation basis",
  FIELD_NOT_ENTERED: "Not enough information to compare",
};

export function ComparabilityWarningList({
  warnings,
}: {
  warnings: ComparabilityWarning[];
}) {
  if (warnings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No comparability warnings for this pair.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {warnings.map((warning, i) => (
        <li key={i} className="text-muted-foreground">
          <span className="font-medium text-foreground">
            {WARNING_LABELS[warning.type]}
          </span>
          {warning.coverageCode && <> — {warning.coverageCode}</>}
          {warning.fields.length > 0 && <> ({warning.fields.join(", ")})</>}
        </li>
      ))}
    </ul>
  );
}
