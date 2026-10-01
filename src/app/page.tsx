import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-16 text-center">
      <h1 className="text-2xl font-semibold">InsureWise</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An educational, decision-support tool for car and home insurance.
        InsureWise is not an insurer, agent or broker, and does not provide
        quotes or advice.
      </p>
      <Button disabled>Coming soon</Button>
    </main>
  );
}
