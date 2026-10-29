import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NumericValue } from "@/components/numeric-value";

describe("NumericValue", () => {
  it("renders the number, unit, and provenance label", () => {
    render(
      <NumericValue
        label="Break-even"
        value={{ amount: 3.3, provenance: "calculated" }}
        unit="years"
      />,
    );

    expect(screen.getByText("3.3 years")).toBeInTheDocument();
    expect(screen.getByText("Calculated")).toBeInTheDocument();
  });

  it("renders a percent unit with no space, unlike a word unit", () => {
    render(
      <NumericValue
        label="Ratio"
        value={{ amount: 10, provenance: "illustrative" }}
        unit="%"
      />,
    );

    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("renders without a unit or trace", () => {
    render(
      <NumericValue label="Count" value={{ amount: 4, provenance: "entered" }} />,
    );

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.queryByText("Show the math")).not.toBeInTheDocument();
  });

  it("shows 'Show the math' when a trace is provided", () => {
    render(
      <NumericValue
        label="Break-even"
        value={{ amount: 3.3, provenance: "calculated" }}
        unit="years"
        trace={{
          formulaId: "C5",
          engineVersion: "0.1.0",
          inputs: [],
          steps: [{ label: "Break-even", expression: "500 / 150", result: 3.3 }],
          output: 3.3,
          notes: [],
        }}
      />,
    );

    expect(screen.getByText("Show the math")).toBeInTheDocument();
  });
});
