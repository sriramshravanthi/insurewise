// docs/ARCHITECTURE.md §4: "lib" — "...rate limiting..."; §7: "AI endpoints
// rate-limited and budget-capped" (PRD AI-5). A plain in-memory fixed-
// window counter, generic across any endpoint/key — not AI-specific, kept
// here rather than in src/ai, since src/ai must not import lib (DB) or be
// imported by it (docs/ARCHITECTURE.md §4 module table).

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 };

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= config.windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (bucket.count < config.maxRequests) {
    bucket.count += 1;
    return { allowed: true };
  }
  return { allowed: false, retryAfterMs: config.windowMs - (now - bucket.windowStart) };
}

/** Test-only reset; also useful if a key should be forgiven early. */
export function resetRateLimit(key?: string): void {
  if (key) {
    buckets.delete(key);
  } else {
    buckets.clear();
  }
}
