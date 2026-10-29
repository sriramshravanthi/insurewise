import { z } from "zod";

// PRD CAR-4: "Split-limit parsing ('100/300/50') and normalization."
// Standard liability notation: 2 or 3 "/"-separated non-negative whole
// numbers, each in thousands of dollars (e.g. "100/300/50" = $100,000 /
// $300,000 / $50,000). This only normalizes the string into numbers and
// back — it does not decide which segment maps to which coverage; that's a
// product decision for a future car-insurance spec, not made here.
export interface SplitLimit {
  raw: string;
  limitsCents: number[];
}

const SEGMENT_PATTERN = /^\d+$/;
const THOUSANDS_TO_CENTS = 100_000;

export function parseSplitLimit(raw: string): SplitLimit | null {
  const trimmed = raw.trim();
  const segments = trimmed.split("/").map((segment) => segment.trim());

  if (segments.length < 2 || segments.length > 3) return null;
  if (segments.some((segment) => !SEGMENT_PATTERN.test(segment))) return null;

  const limitsCents = segments.map(
    (segment) => Number(segment) * THOUSANDS_TO_CENTS,
  );
  if (limitsCents.some((cents) => !Number.isSafeInteger(cents))) return null;

  return { raw: trimmed, limitsCents };
}

export function formatSplitLimit(limitsCents: number[]): string {
  return limitsCents
    .map((cents) => String(cents / THOUSANDS_TO_CENTS))
    .join("/");
}

export const SplitLimitSchema = z.string().transform((raw, ctx) => {
  const parsed = parseSplitLimit(raw);
  if (!parsed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Enter a split limit like "100/300/50": two or three non-negative whole numbers, in thousands of dollars, separated by "/".',
    });
    return z.NEVER;
  }
  return parsed;
});
