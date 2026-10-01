import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComparabilityWarningList } from "@/components/comparability-warning-list";

describe("ComparabilityWarningList", () => {
  it("renders a neutral message when there are no warnings", () => {
    render(<ComparabilityWarningList warnings={[]} />);
    expect(
      screen.getByText("No comparability warnings for this pair."),
    ).toBeInTheDocument();
  });

  it("renders each warning's readable label, coverage code, and fields", () => {
    render(
      <ComparabilityWarningList
        warnings={[
          { type: "DIFFERENT_DEDUCTIBLE", coverageCode: "collision", fields: ["deductibleCents"] },
          { type: "DIFFERENT_TERM", fields: ["termMonths"] },
        ]}
      />,
    );

    expect(screen.getByText("Different deductible")).toBeInTheDocument();
    expect(screen.getByText(/collision/)).toBeInTheDocument();
    expect(screen.getByText("Different term")).toBeInTheDocument();
  });

  it("never renders ranking or advice language", () => {
    render(
      <ComparabilityWarningList
        warnings={[{ type: "DIFFERENT_LIMIT", coverageCode: "liability", fields: ["limitPrimaryCents"] }]}
      />,
    );
    expect(document.body.textContent).not.toMatch(
      /best|cheapest|recommended|top pick|winner/i,
    );
  });
});
