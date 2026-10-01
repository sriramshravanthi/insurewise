import { describe, expect, it } from "vitest";
import {
  containsCardLikePattern,
  containsSsnLikePattern,
  safeFreeTextSchema,
} from "@/schemas/safe-free-text";

describe("containsSsnLikePattern", () => {
  it("flags a dash-formatted SSN", () => {
    expect(containsSsnLikePattern("My SSN is 123-45-6789.")).toBe(true);
  });

  it("flags a bare 9-digit run", () => {
    expect(containsSsnLikePattern("123456789")).toBe(true);
  });

  it("does not flag a 5-digit ZIP or a 4-digit year", () => {
    expect(containsSsnLikePattern("ZIP 90210, built 1998")).toBe(false);
  });

  it("does not flag a 10-digit phone number", () => {
    expect(containsSsnLikePattern("Call 5551234567")).toBe(false);
  });
});

describe("containsCardLikePattern", () => {
  it("flags a bare 16-digit card number", () => {
    expect(containsCardLikePattern("4111111111111111")).toBe(true);
  });

  it("flags a space-grouped card number", () => {
    expect(containsCardLikePattern("4111 1111 1111 1111")).toBe(true);
  });

  it("flags a dash-grouped card number", () => {
    expect(containsCardLikePattern("4111-1111-1111-1111")).toBe(true);
  });

  it("does not flag ordinary free text", () => {
    expect(
      containsCardLikePattern("No prior claims in the last 3 years."),
    ).toBe(false);
  });
});

describe("safeFreeTextSchema", () => {
  it("accepts ordinary notes", () => {
    const schema = safeFreeTextSchema("Notes");
    expect(schema.safeParse("Garage-kept, no modifications.").success).toBe(
      true,
    );
  });

  it("rejects text containing an SSN-like pattern", () => {
    const schema = safeFreeTextSchema("Notes");
    const result = schema.safeParse("Insured SSN 123-45-6789");
    expect(result.success).toBe(false);
  });

  it("rejects text containing a card-like pattern", () => {
    const schema = safeFreeTextSchema("Notes");
    const result = schema.safeParse("Card on file: 4111111111111111");
    expect(result.success).toBe(false);
  });
});
