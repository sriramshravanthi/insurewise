"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// Wraps a page's main feature content with a fade/slide entrance, timed
// just after PageHeader. Purely a motion wrapper — never alters what's
// rendered inside it.
export function PageFadeIn({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {children}
    </motion.div>
  );
}
