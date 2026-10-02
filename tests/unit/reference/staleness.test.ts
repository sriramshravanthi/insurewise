import { describe, expect, it } from "vitest";
import { isStale } from "@/reference/staleness";

describe("isStale (PRD INT-3: \"stale (>12 months) shows a notice\")", () => {
  it("is not stale right after verification", () => {
    expect(isStale("2026-01-01", new Date("2026-01-02"))).toBe(false);
  });

  it("is not stale exactly at 12 months", () => {
    expect(isStale("2026-01-01", new Date("2026-12-31"))).toBe(false);
  });

  it("is stale after 12 months", () => {
    expect(isStale("2025-01-01", new Date("2026-06-01"))).toBe(true);
  });
});
