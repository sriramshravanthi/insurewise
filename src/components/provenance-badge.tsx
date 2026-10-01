import { Badge, type badgeVariants } from "@/components/ui/badge";
import { PROVENANCE_LABELS, type Provenance } from "@/schemas/provenance";
import type { VariantProps } from "class-variance-authority";

// Color is never the only signal (WCAG rule in CLAUDE.md): the label text
// always names the provenance, the variant is a visual aid on top of it.
const VARIANT_BY_PROVENANCE: Record<
  Provenance,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  entered: "secondary",
  calculated: "default",
  reference: "outline",
  illustrative: "outline",
  sample: "destructive",
};

export function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  return (
    <Badge variant={VARIANT_BY_PROVENANCE[provenance]}>
      {PROVENANCE_LABELS[provenance]}
    </Badge>
  );
}
