import { DeductibleSimulator } from "@/features/scenarios/deductible-simulator";

export default function ScenariosPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Deductible simulator</h1>
        <p className="text-sm text-muted-foreground">
          Enter a loss amount and 2–4 deductible options, each with the
          premium you were quoted, to see the out-of-pocket cost, the annual
          premium difference, and how many claim-free years it would take to
          break even.
        </p>
      </div>
      <DeductibleSimulator />
    </main>
  );
}
