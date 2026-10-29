import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoneyValue } from "@/components/value";
import { annualizePremium } from "@/engine/annualize-premium";

describe("MoneyValue", () => {
  it("renders the formatted amount, provenance label, and the math behind a Calculated value", () => {
    const result = annualizePremium({
      amountCents: 90_000,
      amountBasis: "per_term",
      termMonths: 6,
      provenance: "entered",
    });
    if (result.status !== "ok") throw new Error("expected ok");

    render(
      <MoneyValue
        label="Annual premium"
        value={result.value.annualPremium}
        trace={result.trace}
      />,
    );

    expect(screen.getByText("$1,800.00")).toBeInTheDocument();
    expect(screen.getByText("Calculated")).toBeInTheDocument();

    const disclosure = screen.getByText("Show the math");
    expect(disclosure.closest("details")).not.toHaveAttribute("open");
  });

  it("renders without a trace for a plain Entered value", () => {
    render(
      <MoneyValue
        label="Premium"
        value={{ amount: 90_000, provenance: "entered" }}
      />,
    );

    expect(screen.getByText("$900.00")).toBeInTheDocument();
    expect(screen.queryByText("Show the math")).not.toBeInTheDocument();
  });
});
