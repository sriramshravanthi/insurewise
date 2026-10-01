import { MoneyValue } from "@/components/value";
import { annualizePremium } from "@/engine/annualize-premium";

export default function Home() {
  // A worked example from docs/CALCULATIONS.md §2 (C1), shown here only to
  // demonstrate the provenance + "Show the math" primitives end to end.
  // This is not the car/home intake flow.
  const result = annualizePremium({
    amountCents: 90_000,
    amountBasis: "per_term",
    termMonths: 6,
    provenance: "entered",
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-16 text-center">
      <h1 className="text-2xl font-semibold">InsureWise</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An educational, decision-support tool for car and home insurance.
      </p>
      {result.status === "ok" && (
        <MoneyValue
          label="Example: $900 every 6 months, annualized"
          value={result.value.annualPremium}
          trace={result.trace}
        />
      )}
    </main>
  );
}
