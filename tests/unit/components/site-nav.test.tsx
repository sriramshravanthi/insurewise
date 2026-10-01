import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteNav } from "@/components/site-nav";

describe("SiteNav", () => {
  it("links to the home page, the deductible simulator, and compare policies", () => {
    render(<SiteNav />);

    expect(screen.getByRole("link", { name: "InsureWise" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Deductible simulator" }),
    ).toHaveAttribute("href", "/scenarios");
    expect(
      screen.getByRole("link", { name: "Compare policies" }),
    ).toHaveAttribute("href", "/compare");
  });
});
