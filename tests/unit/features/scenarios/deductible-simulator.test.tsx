import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { DeductibleSimulator } from "@/features/scenarios/deductible-simulator";

// MoneyValue/NumericValue render {label row}{value span} as adjacent
// siblings; several labels in this worked example coincidentally share a
// dollar figure (e.g. "Insurer pays" at $500 deductible and the 5-year cost
// at the lower deductible are both $7,500), so queries must be scoped to
// each specific label rather than searching the whole document.
function valueNearLabel(labelText: string): string {
  const label = screen.getByText(labelText);
  const labelRow = label.parentElement as HTMLElement;
  const valueEl = labelRow.nextElementSibling as HTMLElement;
  return valueEl.textContent ?? "";
}

// Default form values already match the PRD SCN-1 worked example:
// loss $8,000; $500@$1,400/yr vs $1,000@$1,250/yr; N=5.
describe("DeductibleSimulator", () => {
  it("computes and displays the PRD SCN-1 worked example on submit", async () => {
    render(<DeductibleSimulator />);

    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => {
      expect(screen.getByText("Out-of-pocket per option")).toBeInTheDocument();
    });

    const [lowOptionCard, highOptionCard] = screen
      .getByText("Out-of-pocket per option")
      .parentElement!.querySelectorAll(".rounded-lg");
    expect(within(lowOptionCard as HTMLElement).getByText("$7,500.00")).toBeInTheDocument();
    expect(within(lowOptionCard as HTMLElement).getByText("$500.00")).toBeInTheDocument();
    expect(within(highOptionCard as HTMLElement).getByText("$7,000.00")).toBeInTheDocument();
    expect(within(highOptionCard as HTMLElement).getByText("$1,000.00")).toBeInTheDocument();

    expect(valueNearLabel("Annual premium difference")).toBe("$150.00");
    expect(valueNearLabel("Extra out-of-pocket if a claim happens")).toBe("$500.00");
    expect(valueNearLabel("Break-even (claim-free years)")).toBe("3.3 years");
    expect(valueNearLabel("Cost over 5 years (lower deductible)")).toBe("$7,500.00");
    expect(valueNearLabel("Cost over 5 years (higher deductible)")).toBe("$7,250.00");
  });

  it("shows a validation error and no results when deductible options are duplicated", async () => {
    render(<DeductibleSimulator />);

    const deductibleInputs = screen.getAllByLabelText("Deductible ($)");
    fireEvent.change(deductibleInputs[1], { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => {
      expect(
        screen.getByText("Each deductible option must be a different amount."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Out-of-pocket per option")).not.toBeInTheDocument();
  });

  it("supports adding a third deductible option, up to a maximum of four", async () => {
    render(<DeductibleSimulator />);

    expect(screen.getAllByLabelText("Deductible ($)")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Add another option" }));
    expect(screen.getAllByLabelText("Deductible ($)")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Add another option" }));
    expect(screen.getAllByLabelText("Deductible ($)")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Add another option" })).toBeDisabled();
  });

  it("cannot remove below two options", () => {
    render(<DeductibleSimulator />);

    const removeButtons = screen.getAllByRole("button", { name: /Remove deductible option/ });
    expect(removeButtons).toHaveLength(2);
    for (const button of removeButtons) {
      expect(button).toBeDisabled();
    }
  });
});
