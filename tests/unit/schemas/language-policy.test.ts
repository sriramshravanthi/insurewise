import { describe, expect, it } from "vitest";
import { findLanguagePolicyViolations } from "@/schemas/language-policy";

describe("findLanguagePolicyViolations", () => {
  it("flags ranking phrasing", () => {
    expect(findLanguagePolicyViolations("This is the best option.")).toEqual([
      { phrase: "best", index: 12 },
    ]);
    expect(
      findLanguagePolicyViolations("Policy B is the cheapest choice.")
        .length,
    ).toBe(1);
    expect(
      findLanguagePolicyViolations("Here is our top pick for you.").length,
    ).toBe(1);
  });

  it("flags advice phrasing", () => {
    expect(
      findLanguagePolicyViolations("You should buy this policy.").length,
    ).toBe(1);
    expect(
      findLanguagePolicyViolations("We recommend policy A.").length,
    ).toBe(1);
  });

  it("does not flag neutral, educational language", () => {
    expect(
      findLanguagePolicyViolations(
        "These policies differ in deductible and limit. Worth reviewing with a licensed professional.",
      ),
    ).toEqual([]);
  });

  it("matches whole words, not substrings", () => {
    expect(findLanguagePolicyViolations("The bestiary is unrelated.")).toEqual(
      [],
    );
  });
});
