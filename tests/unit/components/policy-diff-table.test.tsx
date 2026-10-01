import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PolicyDiffTable } from "@/components/policy-diff-table";
import type { DiffRow } from "@/engine/policy-diff";

const moneyRow: DiffRow = {
  kind: "money",
  category: "premium",
  label: "Annual premium",
  baseline: { amount: 150_000, provenance: "entered" },
  comparison: { amount: 175_000, provenance: "entered" },
  status: "different",
};

const presenceRow: DiffRow = {
  kind: "presence",
  category: "endorsement",
  key: "roadside",
  label: "roadside",
  inBaseline: true,
  inComparison: false,
  status: "different",
};

describe("PolicyDiffTable", () => {
  it("renders a neutral message when there are no rows", () => {
    render(<PolicyDiffTable rows={[]} />);
    expect(
      screen.getByText("No comparable rows between these two policies."),
    ).toBeInTheDocument();
  });

  it("renders a money row with formatted amounts and provenance badges, in both the table and card layouts", () => {
    render(<PolicyDiffTable rows={[moneyRow]} />);

    expect(screen.getAllByText("$1,500.00")).toHaveLength(2); // table + card
    expect(screen.getAllByText("$1,750.00")).toHaveLength(2);
    expect(screen.getAllByText("Entered").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Different").length).toBeGreaterThan(0);
  });

  it("renders a presence row as Yes/No, never a score", () => {
    render(<PolicyDiffTable rows={[presenceRow]} />);

    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No").length).toBeGreaterThan(0);
  });

  it("shows 'Not entered' for a null side without crashing", () => {
    const row: DiffRow = { ...moneyRow, comparison: null, status: "not_comparable" };
    render(<PolicyDiffTable rows={[row]} />);
    expect(screen.getAllByText("Not entered").length).toBeGreaterThan(0);
  });

  it("never renders ranking or advice language", () => {
    render(<PolicyDiffTable rows={[moneyRow, presenceRow]} />);
    expect(document.body.textContent).not.toMatch(
      /best|cheapest|recommended|top pick|winner/i,
    );
  });
});
