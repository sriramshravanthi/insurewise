import { ProvenanceBadge } from "@/components/provenance-badge";
import type { DiffRow, DiffStatus } from "@/engine/policy-diff";
import type { MoneyCents } from "@/schemas/money";
import type { Value } from "@/schemas/value";

// PRD CMP-5: table on wide screens, card stack on mobile. PRD CMP-4: no
// ranking — status labels are neutral ("Same"/"Different"), never implying
// one side is better.
const STATUS_LABELS: Record<DiffStatus, string> = {
  same: "Same",
  different: "Different",
  not_comparable: "Not enough information",
};

function formatMoney(cents: MoneyCents): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function MoneyCell({ value }: { value: Value<MoneyCents> | null }) {
  if (value === null) {
    return <span className="text-muted-foreground">Not entered</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      {formatMoney(value.amount)}
      <ProvenanceBadge provenance={value.provenance} />
    </span>
  );
}

function PresenceCell({ present }: { present: boolean }) {
  return <span>{present ? "Yes" : "No"}</span>;
}

function cellsFor(row: DiffRow) {
  if (row.kind === "money") {
    return {
      baseline: <MoneyCell value={row.baseline} />,
      comparison: <MoneyCell value={row.comparison} />,
    };
  }
  return {
    baseline: <PresenceCell present={row.inBaseline} />,
    comparison: <PresenceCell present={row.inComparison} />,
  };
}

export function PolicyDiffTable({ rows }: { rows: DiffRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No comparable rows between these two policies.
      </p>
    );
  }

  return (
    <>
      <table className="hidden w-full text-sm sm:table">
        <caption className="sr-only">Row-by-row policy comparison</caption>
        <thead>
          <tr className="border-b text-left">
            <th scope="col" className="py-2 pr-4 font-medium">
              Row
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Baseline
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Comparison
            </th>
            <th scope="col" className="py-2 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const cells = cellsFor(row);
            return (
              <tr key={i} className="border-b">
                <td className="py-2 pr-4">{row.label}</td>
                <td className="py-2 pr-4">{cells.baseline}</td>
                <td className="py-2 pr-4">{cells.comparison}</td>
                <td className="py-2">{STATUS_LABELS[row.status]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row, i) => {
          const cells = cellsFor(row);
          return (
            <div key={i} className="rounded-lg border p-3">
              <p className="font-medium">{row.label}</p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Baseline</dt>
                <dd>{cells.baseline}</dd>
                <dt className="text-muted-foreground">Comparison</dt>
                <dd>{cells.comparison}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{STATUS_LABELS[row.status]}</dd>
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}
