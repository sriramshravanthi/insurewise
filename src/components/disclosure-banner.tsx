// Persistent, app-wide disclosure (PRD INT-4). Rendered once in the root
// layout so it appears on every page — not opt-in, not dismissible.
export function DisclosureBanner() {
  return (
    <div
      role="note"
      className="border-b bg-muted px-4 py-2 text-center text-sm text-muted-foreground"
    >
      InsureWise is an educational tool, not an insurer, agent or broker.
      Scenario premiums shown here are not quotes.
    </div>
  );
}
