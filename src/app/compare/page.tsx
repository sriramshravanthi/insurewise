import { ClipboardCheck } from "lucide-react";
import { PolicyComparison } from "@/features/compare/policy-comparison";
import { PageHeader } from "@/components/page-header";
import { PageFadeIn } from "@/components/page-fade-in";

export default function ComparePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <PageHeader
        icon={<ClipboardCheck className="size-5" />}
        title="Compare policies"
        description="Enter a baseline policy and up to three policies to compare against it. You'll see comparability warnings and a row-by-row breakdown of the differences — we never rank or score policies against each other."
      />
      <PageFadeIn>
        <PolicyComparison />
      </PageFadeIn>
    </main>
  );
}
