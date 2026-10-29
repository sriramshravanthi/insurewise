import { describe, expect, it } from "vitest";
import {
  formatSplitLimit,
  parseSplitLimit,
  SplitLimitSchema,
} from "@/schemas/split-limit";

describe("parseSplitLimit", () => {
  it("parses the documented three-part example: 100/300/50", () => {
    expect(parseSplitLimit("100/300/50")).toEqual({
      raw: "100/300/50",
      limitsCents: [10_000_000, 30_000_000, 5_000_000],
    });
  });

  it("parses a two-part limit", () => {
    expect(parseSplitLimit("250/500")).toEqual({
      raw: "250/500",
      limitsCents: [25_000_000, 50_000_000],
    });
  });

  it("normalizes surrounding and inner whitespace", () => {
    expect(parseSplitLimit(" 100 / 300 / 50 ")).toEqual({
      raw: "100 / 300 / 50",
      limitsCents: [10_000_000, 30_000_000, 5_000_000],
    });
  });

  it("allows a zero segment", () => {
    expect(parseSplitLimit("0/300/50")?.limitsCents[0]).toBe(0);
  });

  it.each([
    "100", // only one segment
    "100/300/50/25", // too many segments
    "abc/300/50", // non-numeric segment
    "-100/300/50", // negative
    "100/300.5/50", // decimal
    "",
  ])("rejects malformed input: %s", (raw) => {
    expect(parseSplitLimit(raw)).toBeNull();
  });
});

describe("formatSplitLimit", () => {
  it("formats cents back to the canonical slash-separated notation", () => {
    expect(formatSplitLimit([10_000_000, 30_000_000, 5_000_000])).toBe(
      "100/300/50",
    );
  });

  it("round-trips through parseSplitLimit", () => {
    const parsed = parseSplitLimit("100/300/50");
    expect(formatSplitLimit(parsed!.limitsCents)).toBe("100/300/50");
  });
});

describe("SplitLimitSchema", () => {
  it("parses valid input via Zod", () => {
    const result = SplitLimitSchema.safeParse("100/300/50");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limitsCents).toEqual([10_000_000, 30_000_000, 5_000_000]);
    }
  });

  it("reports a validation error for malformed input", () => {
    const result = SplitLimitSchema.safeParse("not a limit");
    expect(result.success).toBe(false);
  });
});
