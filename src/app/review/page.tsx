import { ReviewFindings } from "@/features/review/review-findings";

export default function ReviewPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Review items</h1>
        <p className="text-sm text-muted-foreground">
          Enter your vehicle value and collision/comprehensive premiums to
          see rule-driven review items and questions you could ask a
          licensed professional. This demonstrates one Illustrative example
          rule — real rules will carry a verified source once that research
          is complete.
        </p>
      </div>
      <ReviewFindings />
    </main>
  );
}
