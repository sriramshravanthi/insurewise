import { Sparkles } from "lucide-react";
import { ReviewFindings } from "@/features/review/review-findings";
import { PageHeader } from "@/components/page-header";
import { PageFadeIn } from "@/components/page-fade-in";

export default function ReviewPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <PageHeader
        icon={<Sparkles className="size-5" />}
        title="Review items"
        description="Enter your vehicle value and collision/comprehensive premiums to see rule-driven review items and questions you could ask a licensed professional. This demonstrates one Illustrative example rule — real rules will carry a verified source once that research is complete."
      />
      <PageFadeIn>
        <ReviewFindings />
      </PageFadeIn>
    </main>
  );
}
