import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  resetRateLimit();
});

describe("checkRateLimit (docs/PRD.md AI-5; docs/ARCHITECTURE.md §7)", () => {
  it("allows requests under the limit", () => {
    const config = { windowMs: 1000, maxRequests: 3 };
    expect(checkRateLimit("k", config, 0).allowed).toBe(true);
    expect(checkRateLimit("k", config, 10).allowed).toBe(true);
    expect(checkRateLimit("k", config, 20).allowed).toBe(true);
  });

  it("blocks once the limit is reached within the window", () => {
    const config = { windowMs: 1000, maxRequests: 2 };
    checkRateLimit("k", config, 0);
    checkRateLimit("k", config, 10);
    const result = checkRateLimit("k", config, 20);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets once the window elapses", () => {
    const config = { windowMs: 1000, maxRequests: 1 };
    checkRateLimit("k", config, 0);
    expect(checkRateLimit("k", config, 500).allowed).toBe(false);
    expect(checkRateLimit("k", config, 1500).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const config = { windowMs: 1000, maxRequests: 1 };
    checkRateLimit("a", config, 0);
    expect(checkRateLimit("a", config, 10).allowed).toBe(false);
    expect(checkRateLimit("b", config, 10).allowed).toBe(true);
  });
});
