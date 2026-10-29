import { GitCompare } from "lucide-react";
import { DeductibleSimulator } from "@/features/scenarios/deductible-simulator";
import { PageHeader } from "@/components/page-header";
import { PageFadeIn } from "@/components/page-fade-in";

export default function ScenariosPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <PageHeader
        icon={<GitCompare className="size-5" />}
        title="Deductible simulator"
        description="Enter a loss amount and 2–4 deductible options, each with the premium you were quoted, to see the out-of-pocket cost, the annual premium difference, and how many claim-free years it would take to break even."
      />
      <PageFadeIn>
        <DeductibleSimulator />
      </PageFadeIn>
    </main>
  );
}
