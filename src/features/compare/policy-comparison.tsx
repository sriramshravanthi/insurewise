"use client";

import { useState } from "react";
import { useFieldArray, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComparabilityWarningList } from "@/components/comparability-warning-list";
import { PolicyDiffTable } from "@/components/policy-diff-table";
import {
  COMPARISON_COVERAGE_CODES,
  PolicyComparisonFormSchema,
  emptyPolicyForm,
  fromPolicyForComparison,
  toPolicyForComparison,
  type PolicyComparisonForm,
} from "@/schemas/policy-comparison-form";
import { comparePolicySet } from "@/engine/policy-set-comparison";
import { SamplePolicyProvider } from "@/providers/sample-policy-provider";

const DEFAULT_VALUES: PolicyComparisonForm = {
  baseline: emptyPolicyForm("Baseline"),
  comparisons: [emptyPolicyForm("Option 1")],
};

// An empty number input's native valueAsNumber is NaN, not undefined, and
// Zod's z.number() rejects NaN even for optional fields. Converting here
// keeps "not entered" actually undefined.
function emptyToUndefinedNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

const COVERAGE_LABELS: Record<string, string> = {
  liability: "Liability",
  collision: "Collision",
  comprehensive: "Comprehensive",
  um: "Uninsured motorist",
};

function PolicyFields({
  prefix,
  register,
}: {
  prefix: "baseline" | `comparisons.${number}`;
  register: ReturnType<typeof useForm<PolicyComparisonForm>>["register"];
}) {
  const path = (suffix: string) => `${prefix}.${suffix}` as Path<PolicyComparisonForm>;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={path("termMonths")}>Term (months)</Label>
          <Input
            id={path("termMonths")}
            type="number"
            step="1"
            min="1"
            {...register(path("termMonths"), { valueAsNumber: true })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={path("annualPremiumDollars")}>Annual premium ($)</Label>
          <Input
            id={path("annualPremiumDollars")}
            type="number"
            step="1"
            min="0"
            {...register(path("annualPremiumDollars"), { valueAsNumber: true })}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Coverages</legend>
        {COMPARISON_COVERAGE_CODES.map((code, i) => (
          <div key={code} className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:items-end">
            <div className="flex items-center gap-2 sm:col-span-1">
              <input
                id={path(`coverages.${i}.included`)}
                type="checkbox"
                className="size-4"
                {...register(path(`coverages.${i}.included`))}
              />
              <Label htmlFor={path(`coverages.${i}.included`)}>
                {COVERAGE_LABELS[code]}
              </Label>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={path(`coverages.${i}.limitPrimaryDollars`)} className="text-xs">
                Limit (primary, $)
              </Label>
              <Input
                id={path(`coverages.${i}.limitPrimaryDollars`)}
                type="number"
                step="1"
                min="0"
                {...register(path(`coverages.${i}.limitPrimaryDollars`), {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={path(`coverages.${i}.limitSecondaryDollars`)} className="text-xs">
                Limit (secondary, $)
              </Label>
              <Input
                id={path(`coverages.${i}.limitSecondaryDollars`)}
                type="number"
                step="1"
                min="0"
                {...register(path(`coverages.${i}.limitSecondaryDollars`), {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={path(`coverages.${i}.deductibleDollars`)} className="text-xs">
                Deductible ($)
              </Label>
              <Input
                id={path(`coverages.${i}.deductibleDollars`)}
                type="number"
                step="1"
                min="0"
                {...register(path(`coverages.${i}.deductibleDollars`), {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={path(`coverages.${i}.valuationBasis`)} className="text-xs">
                Valuation basis
              </Label>
              <select
                id={path(`coverages.${i}.valuationBasis`)}
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                {...register(path(`coverages.${i}.valuationBasis`))}
              >
                <option value="">Not entered</option>
                <option value="replacement_cost">Replacement cost</option>
                <option value="actual_cash_value">Actual cash value</option>
              </select>
            </div>
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor={path("endorsementsText")}>Endorsements (one per line)</Label>
        <textarea
          id={path("endorsementsText")}
          className="min-h-16 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          {...register(path("endorsementsText"))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={path("limitationsText")}>Limitations (one per line)</Label>
        <textarea
          id={path("limitationsText")}
          className="min-h-16 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          {...register(path("limitationsText"))}
        />
      </div>
    </div>
  );
}

export function PolicyComparison() {
  const [results, setResults] = useState<ReturnType<typeof comparePolicySet> | null>(
    null,
  );

  const { register, control, handleSubmit, setValue } = useForm<PolicyComparisonForm>({
    resolver: zodResolver(PolicyComparisonFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "comparisons" });

  const loadSampleIntoBaseline = () => {
    const sample = new SamplePolicyProvider().listPolicies();
    if (sample.status !== "ok") return;
    const [samplePolicy] = sample.value;
    setValue(
      "baseline",
      fromPolicyForComparison("Baseline", samplePolicy.policy),
    );
  };

  const onSubmit = (data: PolicyComparisonForm) => {
    const baseline = toPolicyForComparison(data.baseline);
    const comparisons = data.comparisons.map(toPolicyForComparison);
    setResults(comparePolicySet(baseline, comparisons));
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Baseline policy</h2>
            <Button type="button" variant="outline" onClick={loadSampleIntoBaseline}>
              Load sample policy
            </Button>
          </div>
          <PolicyFields prefix="baseline" register={register} />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Policies to compare (1–3)</h2>
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Option {index + 1}</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  Remove
                </Button>
              </div>
              <PolicyFields prefix={`comparisons.${index}`} register={register} />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => append(emptyPolicyForm(`Option ${fields.length + 1}`))}
            disabled={fields.length >= 3}
          >
            Add another policy to compare
          </Button>
        </div>

        <Button type="submit" className="self-start">
          Compare
        </Button>
      </form>

      {results && results.status === "ok" && (
        <section aria-label="Comparison results" className="flex flex-col gap-8">
          {results.value.items.map((item) => (
            <div key={item.comparisonIndex} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">
                Baseline vs. Option {item.comparisonIndex + 1}
              </h2>
              <ComparabilityWarningList warnings={item.comparability.warnings} />
              {item.comparability.comparable && item.diff ? (
                <PolicyDiffTable rows={item.diff.rows} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  These policies are not comparable, so no row-by-row
                  comparison is shown.
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {results && results.status === "invalid" && (
        <p role="alert" className="text-sm text-destructive">
          Could not compare these policies. Check that every coverage code is
          unique and all entered amounts are zero or more.
        </p>
      )}
    </div>
  );
}
