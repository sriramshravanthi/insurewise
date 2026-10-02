// PRD INT-3: "Reference values display source, effective date and
// verification date; stale (>12 months) shows a notice."
const STALE_AFTER_MS = 365 * 24 * 60 * 60 * 1000;

export function isStale(verifiedAt: string, now: Date): boolean {
  const verified = new Date(verifiedAt).getTime();
  return now.getTime() - verified > STALE_AFTER_MS;
}
