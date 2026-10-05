"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** A rendered icon element (e.g. `<Car className="size-5" />`), not a
   * component reference — a bare component function can't cross the
   * Server-to-Client Component boundary from a server-rendered page.tsx. */
  icon: ReactNode;
  title: string;
  description: string;
}

// Shared, animated header used by every top-level page — keeps the
// colorful/motion treatment consistent without touching any feature
// component's internals (forms, calculations, tests untouched).
export function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <motion.div
      className="flex flex-col gap-3"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm"
      >
        {icon}
      </span>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
    </motion.div>
  );
}
