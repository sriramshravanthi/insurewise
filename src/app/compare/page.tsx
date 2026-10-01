import { PolicyComparison } from "@/features/compare/policy-comparison";

export default function ComparePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Compare policies</h1>
        <p className="text-sm text-muted-foreground">
          Enter a baseline policy and up to three policies to compare against
          it. You&apos;ll see comparability warnings and a row-by-row
          breakdown of the differences — we never rank or score policies
          against each other.
        </p>
      </div>
      <PolicyComparison />
    </main>
  );
}
