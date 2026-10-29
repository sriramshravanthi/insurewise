import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CarProfile } from "@/features/car/car-profile";

const LINE_PREMIUMS: Record<string, string> = {
  liability: "600",
  collision: "400",
  comprehensive: "150",
  um: "100",
};

function fillMinimumVehicle() {
  fireEvent.change(screen.getByLabelText("Make"), { target: { value: "Honda" } });
  fireEvent.change(screen.getByLabelText("Model"), { target: { value: "Civic" } });
}

// Coverage rows render in this fixed order (COMPARISON_COVERAGE_CODES).
const CODE_ORDER = ["liability", "collision", "comprehensive", "um"];

function includeAllCoveragesWithPremiums() {
  for (const checkbox of screen.getAllByRole("checkbox")) {
    fireEvent.click(checkbox);
  }
  const premiumInputs = screen.getAllByLabelText(
    "Premium for this coverage ($/yr)",
  );
  premiumInputs.forEach((input, i) => {
    fireEvent.change(input, { target: { value: LINE_PREMIUMS[CODE_ORDER[i]] } });
  });
}

describe("CarProfile", () => {
  it("shows the vehicle & drivers profile summary (CAR-1)", async () => {
    render(<CarProfile />);
    fillMinimumVehicle();
    fireEvent.click(screen.getByRole("button", { name: "Show car profile" }));

    await waitFor(() => {
      expect(screen.getByText(/Honda Civic/)).toBeInTheDocument();
    });
    expect(screen.getByText("Vehicle & drivers")).toBeInTheDocument();
    expect(screen.getByText(/Driver 1: age band Not entered/)).toBeInTheDocument();
  });

  it('shows "Not entered" (never "Not covered") for an excluded coverage (CAR-2)', async () => {
    render(<CarProfile />);
    fillMinimumVehicle();
    fireEvent.click(screen.getByRole("button", { name: "Show car profile" }));

    await waitFor(() => {
      expect(screen.getByText("Coverage breakdown")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Not entered").length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/not covered/i);
  });

  it("notes that coverage definitions and factor cards are deferred (CAR-2/CAR-3)", async () => {
    render(<CarProfile />);
    fillMinimumVehicle();
    fireEvent.click(screen.getByRole("button", { name: "Show car profile" }));

    await waitFor(() => {
      expect(screen.getByText("Coverage breakdown")).toBeInTheDocument();
    });
    expect(screen.getByText(/coverage catalog/)).toBeInTheDocument();
    expect(screen.getByText(/verified rating factors/)).toBeInTheDocument();
  });

  it("computes the line-level premium composition using C7 (CAR-3)", async () => {
    render(<CarProfile />);
    fillMinimumVehicle();
    includeAllCoveragesWithPremiums();
    fireEvent.click(screen.getByRole("button", { name: "Show car profile" }));

    await waitFor(() => {
      expect(screen.getByText("48%")).toBeInTheDocument();
    });
    expect(screen.getByText("32%")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
  });

  it("supports adding up to five drivers and removing down to one", () => {
    render(<CarProfile />);

    expect(screen.getByText("Driver 1")).toBeInTheDocument();
    for (let i = 2; i <= 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Add another driver" }));
      expect(screen.getByText(`Driver ${i}`)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: "Add another driver" }),
    ).toBeDisabled();

    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    }
    expect(screen.getAllByRole("button", { name: "Remove" })[0]).toBeDisabled();
  });

  it("never renders ranking or advice language", async () => {
    render(<CarProfile />);
    fillMinimumVehicle();
    fireEvent.click(screen.getByRole("button", { name: "Show car profile" }));

    await waitFor(() => {
      expect(screen.getByText("Vehicle & drivers")).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(
      /\b(best|cheapest|recommended|top pick|winner)\b/i,
    );
  });
});
