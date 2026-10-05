"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "cn";

const LINKS = [
  { href: "/car", label: "Car profile" },
  { href: "/home", label: "Home profile" },
  { href: "/scenarios", label: "Deductible simulator" },
  { href: "/compare", label: "Compare policies" },
  { href: "/review", label: "Review items" },
  { href: "/sign-in", label: "Sign in" },
];

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative px-1 py-2 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </Link>
  );
}

// Minimal nav, grown incrementally as each UI cycle adds a reachable page.
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 z-40 border-b bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          InsureWise
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 pb-4">
              {LINKS.map((link) => (
                <NavLink key={link.href} {...link} onClick={() => setOpen(false)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
