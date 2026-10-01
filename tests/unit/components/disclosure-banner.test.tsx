import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisclosureBanner } from "@/components/disclosure-banner";

describe("DisclosureBanner", () => {
  it("states InsureWise is not an insurer, agent or broker, and that premiums are not quotes (PRD INT-4)", () => {
    render(<DisclosureBanner />);

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/not an insurer, agent or broker/i);
    expect(note).toHaveTextContent(/not quotes/i);
  });
});
