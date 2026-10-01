import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewFindings } from "@/features/review/review-findings";

// Default values (vehicle $6,000; collision+comprehensive $800) give a
// coverage-to-value ratio of 13.3%, which triggers the demo rule's 10%
// Illustrative threshold.
describe("ReviewFindings", () => {
  it("shows a triggered finding with why-it-appears, source, and threshold, plus a professional question", async () => {
    render(<ReviewFindings />);

    fireEvent.click(screen.getByRole("button", { name: "Check for review items" }));

    await waitFor(() => {
      expect(screen.getByText("Why this appears")).toBeInTheDocument();
    });
    expect(screen.getByText(/Based on: coverageToValueRatioPct/)).toBeInTheDocument();
    expect(screen.getByText("Source: S-DEMO-1")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("Illustrative")).toBeInTheDocument();

    expect(screen.getByText("Questions to ask a professional")).toBeInTheDocument();
    expect(screen.getByText("q.high-coverage-to-value-ratio")).toBeInTheDocument();
  });

  it('reports "Not enough information" when the vehicle value is cleared (PRD GAP-2)', async () => {
    render(<ReviewFindings />);

    fireEvent.change(screen.getByLabelText("Vehicle value ($)"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check for review items" }));

    await waitFor(() => {
      expect(screen.getByText("Not enough information")).toBeInTheDocument();
    });
    expect(screen.getByText(/Missing: coverageToValueRatioPct/)).toBeInTheDocument();
    expect(screen.queryByText("Why this appears")).not.toBeInTheDocument();
  });

  it('shows the "does not imply adequacy" note when nothing is triggered (PRD GAP-2)', async () => {
    render(<ReviewFindings />);

    fireEvent.change(screen.getByLabelText("Collision premium ($/yr)"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Comprehensive premium ($/yr)"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check for review items" }));

    await waitFor(() => {
      expect(
        screen.getByText(/does not imply the coverage is adequate/),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Why this appears")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Questions to ask a professional"),
    ).not.toBeInTheDocument();
  });

  it("never renders ranking or advice language", async () => {
    render(<ReviewFindings />);

    fireEvent.click(screen.getByRole("button", { name: "Check for review items" }));

    await waitFor(() => {
      expect(screen.getByText("Why this appears")).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(
      /\b(best|cheapest|recommended|top pick|winner)\b/i,
    );
  });
});
