import Link from "next/link";

// Minimal nav, grown incrementally as each UI cycle adds a reachable page.
export function SiteNav() {
  return (
    <nav
      aria-label="Main"
      className="flex items-center gap-4 border-b px-4 py-3 text-sm"
    >
      <Link href="/" className="font-semibold">
        InsureWise
      </Link>
      <Link href="/scenarios" className="text-muted-foreground hover:text-foreground">
        Deductible simulator
      </Link>
    </nav>
  );
}
