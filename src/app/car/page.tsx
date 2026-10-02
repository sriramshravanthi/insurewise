import { CarProfile } from "@/features/car/car-profile";

export default function CarPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Car profile</h1>
        <p className="text-sm text-muted-foreground">
          Enter your vehicle, drivers, and coverage to see a summary, a
          coverage breakdown, and how your premium breaks down line by line.
        </p>
      </div>
      <CarProfile />
    </main>
  );
}
