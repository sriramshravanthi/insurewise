import { Home as HomeIcon } from "lucide-react";
import { HomeProfile } from "@/features/home/home-profile";
import { PageHeader } from "@/components/page-header";
import { PageFadeIn } from "@/components/page-fade-in";

export default function HomeInsurancePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <PageHeader
        icon={<HomeIcon className="size-5" />}
        title="Home profile"
        description="Enter your property, coverage, and premium to see a summary, a coverage breakdown with ratios, and how your premium breaks down line by line."
      />
      <PageFadeIn>
        <HomeProfile />
      </PageFadeIn>
    </main>
  );
}
