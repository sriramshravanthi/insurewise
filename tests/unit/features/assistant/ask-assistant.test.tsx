import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AskAssistant } from "@/features/assistant/ask-assistant";

const FACTS = [
  { id: "fact-1", label: "Fact 1", value: 10, unit: "%", provenance: "illustrative" as const },
];

function mockFetchOnce(response: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(response),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AskAssistant (docs/PRD.md AI-1)", () => {
  it("shows the answer and its citations on a grounded response", async () => {
    mockFetchOnce({ status: "answered", answer: "It's 10%.", citedFactIds: ["fact-1"] });
    render(<AskAssistant facts={FACTS} />);

    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "What's the threshold?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => {
      expect(screen.getByText("It's 10%.")).toBeInTheDocument();
    });
    expect(screen.getByText("Based on: fact-1")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/assistant",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ question: "What's the threshold?", facts: FACTS }),
      }),
    );
  });

  it('shows the "not configured" state when the assistant isn\'t set up', async () => {
    mockFetchOnce({ status: "not_configured" });
    render(<AskAssistant facts={FACTS} />);

    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Q" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => {
      expect(
        screen.getByText("The assistant isn't configured in this environment yet."),
      ).toBeInTheDocument();
    });
  });

  it("shows the safe-fallback message (docs/ARCHITECTURE.md §8)", async () => {
    mockFetchOnce({ status: "safe_fallback" });
    render(<AskAssistant facts={FACTS} />);

    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Q" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't give a grounded answer/),
      ).toBeInTheDocument();
    });
  });

  it("shows a generic error state when the request itself fails", async () => {
    mockFetchOnce({}, false);
    render(<AskAssistant facts={FACTS} />);

    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Q" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong asking the assistant. Try again."),
      ).toBeInTheDocument();
    });
  });
});
