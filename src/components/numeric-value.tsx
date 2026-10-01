import { ProvenanceBadge } from "@/components/provenance-badge";
import type { Trace, Value as ValueT } from "@/schemas/value";

export interface NumericValueProps {
  label: string;
  value: ValueT<number>;
  /** e.g. "years" — appended after the number. */
  unit?: string;
  /** Present for Calculated/Illustrative values; renders "Show the math" (PRD INT-2). */
  trace?: Trace;
}

// Sibling to MoneyValue (src/components/value.tsx) for non-currency numeric
// values, such as break-even years. Kept separate rather than generalizing
// MoneyValue, to leave it untouched.
export function NumericValue({ label, value, unit, trace }: NumericValueProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <ProvenanceBadge provenance={value.provenance} />
      </div>
      <span className="text-2xl font-semibold tabular-nums">
        {value.amount}
        {unit ? (unit === "%" ? unit : ` ${unit}`) : ""}
      </span>
      {trace && (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer select-none">
            Show the math
          </summary>
          <ol className="ml-4 mt-2 list-decimal space-y-1">
            {trace.steps.map((step) => (
              <li key={step.label}>
                {step.label}: {step.expression} = {String(step.result)}
              </li>
            ))}
          </ol>
          {trace.notes.length > 0 && (
            <ul className="ml-4 mt-2 list-disc space-y-1">
              {trace.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </details>
      )}
    </div>
  );
}
