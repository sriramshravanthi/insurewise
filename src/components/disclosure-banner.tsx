import { Info } from "lucide-react";

// Persistent, app-wide disclosure (PRD INT-4). Rendered once in the root
// layout so it appears on every page — not opt-in, not dismissible.
export function DisclosureBanner() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground"
    >
      <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
      InsureWise is an educational tool, not an insurer, agent or broker.
      Scenario premiums shown here are not quotes.
    </div>
  );
}
