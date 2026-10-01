import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the project name and the no-advice disclosure", () => {
    render(<Home />);

    expect(screen.getByText("InsureWise")).toBeInTheDocument();
    expect(
      screen.getByText(/not an insurer, agent or broker/i),
    ).toBeInTheDocument();
  });

  it("renders the C1 worked example with its provenance and the math behind it", () => {
    render(<Home />);

    expect(screen.getByText("$1,800.00")).toBeInTheDocument();
    expect(screen.getByText("Calculated")).toBeInTheDocument();
    expect(screen.getByText("Show the math")).toBeInTheDocument();
  });
});
