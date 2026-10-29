import { ProvenanceBadge } from "@/components/provenance-badge";
import type { MoneyCents } from "@/schemas/money";
import type { Trace, Value as ValueT } from "@/schemas/value";

function formatMoneyCents(cents: MoneyCents): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export interface MoneyValueProps {
  label: string;
  value: ValueT<MoneyCents>;
  /** Present for Calculated/Illustrative values; renders "Show the math" (PRD INT-2). */
  trace?: Trace;
}

export function MoneyValue({ label, value, trace }: MoneyValueProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <ProvenanceBadge provenance={value.provenance} />
      </div>
      <span className="text-2xl font-semibold tabular-nums">
        {formatMoneyCents(value.amount)}
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
