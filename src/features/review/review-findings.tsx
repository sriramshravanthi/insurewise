"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericValue } from "@/components/numeric-value";
import {
  ReviewFindingsFormSchema,
  type ReviewFindingsForm,
} from "@/schemas/review-findings-form";
import { dollarsToCents } from "@/schemas/deductible-simulator-form";
import { coverageToValueRatio } from "@/engine/coverage-to-value-ratio";
import {
  compileReviewFindings,
  type ReviewFindingsResult,
} from "@/engine/review-findings-compiler";
import { generateProfessionalQuestions } from "@/engine/professional-questions";
import { DEMO_REVIEW_RULE } from "./demo-review-rule";

const DEFAULT_VALUES: ReviewFindingsForm = {
  vehicleValueDollars: 6_000,
  collisionPremiumDollars: 400,
  comprehensivePremiumDollars: 400,
};

interface Outcome {
  ratioAvailable: boolean;
  findingsResult: ReviewFindingsResult;
  notes: string[];
  questions: ReturnType<typeof generateProfessionalQuestions>;
}

export function ReviewFindings() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const {
    register,
    handleSubmit,
  } = useForm<ReviewFindingsForm>({
    resolver: zodResolver(ReviewFindingsFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = (data: ReviewFindingsForm) => {
    const ratioResult = coverageToValueRatio({
      collisionPremiumCents: dollarsToCents(data.collisionPremiumDollars),
      comprehensivePremiumCents: dollarsToCents(data.comprehensivePremiumDollars),
      vehicleValueCents: dollarsToCents(data.vehicleValueDollars),
      provenance: "entered",
    });
    if (ratioResult.status !== "ok") return;

    const inputs: Record<string, number> = {};
    if (ratioResult.value.ratio) {
      inputs.coverageToValueRatioPct = ratioResult.value.ratio.amount;
    }

    const findingsResult = compileReviewFindings([DEMO_REVIEW_RULE], inputs);
    if (findingsResult.status !== "ok") return;

    const questions = generateProfessionalQuestions(
      findingsResult.value.findings,
      [],
      {},
    );

    setOutcome({
      ratioAvailable: Boolean(ratioResult.value.ratio),
      findingsResult: findingsResult.value,
      notes: findingsResult.trace.notes,
      questions,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicleValueDollars">Vehicle value ($)</Label>
            <Input
              id="vehicleValueDollars"
              type="number"
              step="1"
              min="0"
              {...register("vehicleValueDollars", { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="collisionPremiumDollars">
              Collision premium ($/yr)
            </Label>
            <Input
              id="collisionPremiumDollars"
              type="number"
              step="1"
              min="0"
              {...register("collisionPremiumDollars", { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="comprehensivePremiumDollars">
              Comprehensive premium ($/yr)
            </Label>
            <Input
              id="comprehensivePremiumDollars"
              type="number"
              step="1"
              min="0"
              {...register("comprehensivePremiumDollars", {
                valueAsNumber: true,
              })}
            />
          </div>
        </div>
        <Button type="submit" className="self-start">
          Check for review items
        </Button>
      </form>

      {outcome && (
        <section aria-label="Review results" className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Review items</h2>

            {outcome.findingsResult.findings.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {outcome.notes[0] ??
                  "No review items were triggered. This does not imply the coverage is adequate."}
              </p>
            )}

            {outcome.findingsResult.findings.map(({ ruleId, finding }) => (
              <div key={ruleId} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Why this appears</p>
                  <span className="text-xs text-muted-foreground">
                    Severity: {finding.severity}
                  </span>
                </div>
                <ul className="text-sm text-muted-foreground">
                  <li>
                    Based on: {finding.inputsUsed.join(", ")} (computed from
                    your entries)
                  </li>
                  <li>Source: {finding.sourceIds.join(", ")}</li>
                </ul>
                {Object.entries(finding.parameters).map(([key, value]) => (
                  <NumericValue
                    key={key}
                    label={`Threshold used (${key})`}
                    value={value}
                    unit="%"
                  />
                ))}
              </div>
            ))}

            {outcome.findingsResult.notEnoughInformation.map((item) => (
              <div key={item.ruleId} className="flex flex-col gap-2 rounded-lg border p-4">
                <p className="font-medium">Not enough information</p>
                <p className="text-sm text-muted-foreground">
                  Missing: {item.missing.join(", ")}
                </p>
              </div>
            ))}
          </div>

          {outcome.questions.status === "ok" &&
            outcome.questions.value.questions.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">
                  Questions to ask a professional
                </h2>
                <ul className="flex flex-col gap-2 text-sm">
                  {outcome.questions.value.questions.map((q, i) => (
                    <li key={i} className="rounded-lg border p-3">
                      <span>
                        Template: <code className="text-xs">{q.questionTemplateId}</code>
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Full wording will come from the content/reference
                        layer once it ships; this shows which template
                        applies.
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </section>
      )}
    </div>
  );
}
