import { HomeProfile } from "@/features/home/home-profile";

export default function HomeInsurancePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Home profile</h1>
        <p className="text-sm text-muted-foreground">
          Enter your property, coverage, and premium to see a summary, a
          coverage breakdown with ratios, and how your premium breaks down
          line by line.
        </p>
      </div>
      <HomeProfile />
    </main>
  );
}
