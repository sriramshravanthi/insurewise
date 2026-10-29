import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { HomeProfile } from "@/features/home/home-profile";

// Coverage rows render in HOME_COVERAGE_CODES order: dwelling,
// other_structures, personal_property, loss_of_use, personal_liability,
// medical_payments.
function fillCoverageLine(index: number, limit: string, premium: string) {
  const limitInputs = screen.getAllByLabelText("Limit ($)");
  const premiumInputs = screen.getAllByLabelText("Premium for this coverage ($/yr)");
  const checkboxes = screen.getAllByRole("checkbox");
  fireEvent.click(checkboxes[index]);
  fireEvent.change(limitInputs[index], { target: { value: limit } });
  fireEvent.change(premiumInputs[index], { target: { value: premium } });
}

describe("HomeProfile", () => {
  it("computes coverage ratios using C10's own worked example (HOM-2)", async () => {
    render(<HomeProfile />);

    fillCoverageLine(0, "600000", "600"); // dwelling (A)
    fillCoverageLine(2, "300000", "150"); // personal_property (C)
    fillCoverageLine(3, "120000", "100"); // loss_of_use (D)
    fireEvent.change(screen.getByLabelText("Rebuild estimate ($, optional)"), {
      target: { value: "700000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText("50%")).toBeInTheDocument();
    });
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("85.7%")).toBeInTheDocument();
  });

  it("labels the dwelling-vs-rebuild ratio Illustrative when the rebuild estimate comes from sqft x cost/sqft (C11)", async () => {
    render(<HomeProfile />);

    fillCoverageLine(0, "600000", "600"); // dwelling (A)
    fireEvent.change(screen.getByLabelText("Square feet"), {
      target: { value: "2000" },
    });
    fireEvent.change(screen.getByLabelText("Cost per sq ft ($, Illustrative)"), {
      target: { value: "350" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText("85.7%")).toBeInTheDocument();
    });
    const ratioRow = screen.getByText("Dwelling vs. rebuild estimate").parentElement;
    expect(ratioRow).not.toBeNull();
    expect(ratioRow && within(ratioRow).getByText("Illustrative")).toBeInTheDocument();
  });

  it("shows the market-value-vs-rebuild-cost note, hedged as a question for a professional (HOM-2)", async () => {
    render(<HomeProfile />);

    fireEvent.change(screen.getByLabelText("Market value ($)"), {
      target: { value: "600000" },
    });
    fireEvent.change(screen.getByLabelText("Rebuild estimate ($, optional)"), {
      target: { value: "700000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText(/licensed professional/)).toBeInTheDocument();
    });
  });

  it('shows "Not entered" (never "Not covered") for an excluded coverage (HOM-1/2)', async () => {
    render(<HomeProfile />);
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText("Coverage breakdown")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Not entered").length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/not covered/i);
  });

  it("notes that coverage catalog definitions are deferred (HOM-2)", async () => {
    render(<HomeProfile />);
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText(/coverage catalog/)).toBeInTheDocument();
    });
  });

  it("shows an educational pointer for condo/townhome as soon as selected, before submitting (HOM-3)", () => {
    render(<HomeProfile />);

    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "condo" },
    });
    expect(screen.getByText(/master policy/)).toBeInTheDocument();
  });

  it("does not show the condo/townhome pointer for a single-family property", () => {
    render(<HomeProfile />);
    expect(screen.queryByText(/master policy/)).not.toBeInTheDocument();
  });

  it('shows an "unsupported in MVP" state for manufactured/mobile homes (HOM-3)', async () => {
    render(<HomeProfile />);

    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "manufactured_mobile" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText(/aren't supported in this MVP/)).toBeInTheDocument();
    });
    expect(screen.queryByText("Coverage breakdown")).not.toBeInTheDocument();
  });

  it("shows a profile-completeness checklist with progress, flagged as a placeholder (HOM-4)", async () => {
    render(<HomeProfile />);

    fireEvent.change(screen.getByLabelText("Market value ($)"), {
      target: { value: "600000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText("Home risk checklist")).toBeInTheDocument();
    });
    expect(screen.getByText(/1 of 6 reviewed/)).toBeInTheDocument();
    expect(screen.getByText(/Placeholder/)).toBeInTheDocument();
  });

  it("computes the line-level premium composition using C7 (parallel to CAR-3)", async () => {
    render(<HomeProfile />);

    fillCoverageLine(0, "600000", "600"); // dwelling
    fillCoverageLine(1, "0", "400"); // other_structures
    fillCoverageLine(2, "300000", "150"); // personal_property
    fillCoverageLine(3, "120000", "100"); // loss_of_use
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText("48%")).toBeInTheDocument();
    });
    expect(screen.getByText("32%")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
  });

  it("never renders ranking or advice language", async () => {
    render(<HomeProfile />);
    fireEvent.click(screen.getByRole("button", { name: "Show home profile" }));

    await waitFor(() => {
      expect(screen.getByText("Coverage breakdown")).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(
      /\b(best|cheapest|recommended|top pick|winner)\b/i,
    );
  });
});
