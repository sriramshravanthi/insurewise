import { Car } from "lucide-react";
import { CarProfile } from "@/features/car/car-profile";
import { PageHeader } from "@/components/page-header";
import { PageFadeIn } from "@/components/page-fade-in";

export default function CarPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <PageHeader
        icon={<Car className="size-5" />}
        title="Car profile"
        description="Enter your vehicle, drivers, and coverage to see a summary, a coverage breakdown, and how your premium breaks down line by line."
      />
      <PageFadeIn>
        <CarProfile />
      </PageFadeIn>
    </main>
  );
}
