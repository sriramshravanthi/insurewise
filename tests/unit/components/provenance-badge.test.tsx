import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { PROVENANCE_LABELS, type Provenance } from "@/schemas/provenance";

describe("ProvenanceBadge", () => {
  it.each(Object.keys(PROVENANCE_LABELS) as Provenance[])(
    "renders a visible text label for %s (never color-only)",
    (provenance) => {
      render(<ProvenanceBadge provenance={provenance} />);
      expect(
        screen.getByText(PROVENANCE_LABELS[provenance]),
      ).toBeInTheDocument();
    },
  );
});
