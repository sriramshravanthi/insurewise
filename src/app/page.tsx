"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Car,
  Home as HomeIcon,
  GitCompare,
  ClipboardCheck,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoneyValue } from "@/components/value";
import { annualizePremium } from "@/engine/annualize-premium";
import { cn } from "cn";

const FEATURES = [
  {
    href: "/car",
    icon: Car,
    title: "Car profile",
    description:
      "Enter your vehicle, drivers and coverage to see a plain-language breakdown — never a quote.",
  },
  {
    href: "/home",
    icon: HomeIcon,
    title: "Home profile",
    description:
      "Coverage A–F ratios, rebuild-cost estimates, and a risk checklist for your property.",
  },
  {
    href: "/scenarios",
    icon: GitCompare,
    title: "Deductible simulator",
    description:
      "Compare deductible options side by side: out-of-pocket cost, break-even years, N-year totals.",
  },
  {
    href: "/compare",
    icon: ClipboardCheck,
    title: "Compare policies",
    description:
      "Line up a baseline against up to three policies. Differences only — never a ranking.",
  },
  {
    href: "/review",
    icon: Sparkles,
    title: "Review + AI assistant",
    description:
      "Rule-driven review items, questions for a professional, and an assistant grounded only in your entered data.",
  },
];

function Blob({ className, delay = 0 }: { className: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute rounded-full blur-3xl", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        reduceMotion
          ? { opacity: 0.5, scale: 1 }
          : { opacity: 0.5, scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -15, 0] }
      }
      transition={
        reduceMotion
          ? { duration: 0.6 }
          : { duration: 14, repeat: Infinity, ease: "easeInOut", delay }
      }
    />
  );
}

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
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <Blob className="-top-24 -left-24 size-72 bg-primary/30" />
        <Blob className="top-10 -right-20 size-80 bg-accent/30" delay={3} />

        <motion.div
          className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            Educational tool — not an insurer, agent or broker
          </Badge>

          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            InsureWise
          </p>
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
            Understand your car and home insurance
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Explore what-if scenarios with transparent math, compare policies
            by their differences, and prepare questions for a licensed
            professional — every number labeled, every claim grounded.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/car" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Start a car profile
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/home"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Start a home profile
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            What you can do here
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Every tool uses your entered data and verified reference facts
            only — never an invented figure.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link
                    href={feature.href}
                    className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground transition-transform group-hover:scale-110">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-semibold">{feature.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {feature.description}
                    </span>
                    <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Open <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Show the math */}
      {result.status === "ok" && (
        <section className="px-4 py-16">
          <motion.div
            className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border bg-secondary/40 p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-lg font-semibold">
              Every calculated number shows its math
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              A worked example — not part of any intake flow, just a
              demonstration of the provenance labels you&apos;ll see
              throughout the app.
            </p>
            <MoneyValue
              label="Example: $900 every 6 months, annualized"
              value={result.value.annualPremium}
              trace={result.trace}
            />
          </motion.div>
        </section>
      )}
    </main>
  );
}
