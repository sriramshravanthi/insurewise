import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PolicyComparison } from "@/features/compare/policy-comparison";

describe("PolicyComparison", () => {
  it("compares a sample-loaded baseline against the default (empty) comparison policy", async () => {
    render(<PolicyComparison />);

    fireEvent.click(screen.getByRole("button", { name: "Load sample policy" }));
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));

    await waitFor(() => {
      expect(
        screen.getByText("Baseline vs. Option 1"),
      ).toBeInTheDocument();
    });

    // The sample policy includes liability/collision/comprehensive; the
    // default comparison policy includes nothing, so each should be
    // flagged as only present in one policy.
    expect(screen.getAllByText("Coverage only in one policy").length).toBe(3);

    // Premiums differ ($1,200 sample vs. $0 default) -> a "Different" premium row.
    expect(screen.getAllByText("$1,200.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0);
  });

  it("never renders ranking or advice language anywhere in the results", async () => {
    render(<PolicyComparison />);

    fireEvent.click(screen.getByRole("button", { name: "Load sample policy" }));
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));

    await waitFor(() => {
      expect(screen.getByText("Baseline vs. Option 1")).toBeInTheDocument();
    });

    expect(document.body.textContent).not.toMatch(
      /\b(best|cheapest|recommended|top pick|winner)\b/i,
    );
  });

  it("supports adding up to three comparison policies and removing down to one", () => {
    render(<PolicyComparison />);

    expect(screen.getByText("Option 1")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Add another policy to compare" }),
    );
    expect(screen.getByText("Option 2")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Add another policy to compare" }),
    );
    expect(screen.getByText("Option 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add another policy to compare" }),
    ).toBeDisabled();

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[removeButtons.length - 1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(screen.getAllByRole("button", { name: "Remove" })[0]).toBeDisabled();
  });

  it("loading the sample policy fills in the baseline's coverages", () => {
    render(<PolicyComparison />);

    fireEvent.click(screen.getByRole("button", { name: "Load sample policy" }));

    const liabilityCheckbox = screen.getAllByLabelText("Liability")[0];
    expect(liabilityCheckbox).toBeChecked();
  });
});
