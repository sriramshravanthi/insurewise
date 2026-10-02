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
      <Link href="/car" className="text-muted-foreground hover:text-foreground">
        Car profile
      </Link>
      <Link href="/home" className="text-muted-foreground hover:text-foreground">
        Home profile
      </Link>
      <Link href="/scenarios" className="text-muted-foreground hover:text-foreground">
        Deductible simulator
      </Link>
      <Link href="/compare" className="text-muted-foreground hover:text-foreground">
        Compare policies
      </Link>
      <Link href="/review" className="text-muted-foreground hover:text-foreground">
        Review items
      </Link>
      <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
        Sign in
      </Link>
    </nav>
  );
}
