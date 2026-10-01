"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyValue } from "@/components/value";
import { NumericValue } from "@/components/numeric-value";
import {
  DeductibleSimulatorFormSchema,
  dollarsToCents,
  type DeductibleSimulatorForm,
} from "@/schemas/deductible-simulator-form";
import { outOfPocketOnClaim } from "@/engine/out-of-pocket";
import { deductibleTradeOff } from "@/engine/deductible-trade-off";
import { breakEvenYears } from "@/engine/break-even";
import { nYearCost } from "@/engine/n-year-cost";

const DEFAULT_VALUES: DeductibleSimulatorForm = {
  lossDollars: 8_000,
  options: [
    { deductibleDollars: 500, annualPremiumDollars: 1_400 },
    { deductibleDollars: 1_000, annualPremiumDollars: 1_250 },
  ],
  n: 5,
};

interface SimulatorResults {
  lossCents: number;
  perOption: {
    deductibleCents: number;
    annualPremiumCents: number;
    outOfPocket: ReturnType<typeof outOfPocketOnClaim>;
  }[];
  perPair: {
    lowDeductibleCents: number;
    highDeductibleCents: number;
    tradeOff: ReturnType<typeof deductibleTradeOff>;
    breakEven: ReturnType<typeof breakEvenYears>;
    nYear: ReturnType<typeof nYearCost>;
  }[];
  n: number;
}

export function DeductibleSimulator() {
  const [results, setResults] = useState<SimulatorResults | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeductibleSimulatorForm>({
    resolver: zodResolver(DeductibleSimulatorFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  const onSubmit = (data: DeductibleSimulatorForm) => {
    const lossCents = dollarsToCents(data.lossDollars);
    const options = [...data.options]
      .map((o) => ({
        deductibleCents: dollarsToCents(o.deductibleDollars),
        annualPremiumCents: dollarsToCents(o.annualPremiumDollars),
      }))
      .sort((a, b) => a.deductibleCents - b.deductibleCents);

    const deductibles = options.map((o) => o.deductibleCents);
    if (new Set(deductibles).size !== deductibles.length) {
      setFormError("Each deductible option must be a different amount.");
      setResults(null);
      return;
    }
    setFormError(null);

    const perOption = options.map((option) => ({
      ...option,
      outOfPocket: outOfPocketOnClaim({
        lossCents,
        deductibleCents: option.deductibleCents,
      }),
    }));

    const perPair = options.slice(1).map((high, i) => {
      const low = options[i];
      return {
        lowDeductibleCents: low.deductibleCents,
        highDeductibleCents: high.deductibleCents,
        tradeOff: deductibleTradeOff({ low, high, provenance: "entered" }),
        breakEven: breakEvenYears({ low, high, provenance: "entered" }),
        nYear: nYearCost({ low, high, n: data.n }),
      };
    });

    setResults({ lossCents, perOption, perPair, n: data.n });
  };

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        aria-describedby={formError ? "simulator-form-error" : undefined}
      >
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="lossDollars">Loss amount ($)</Label>
          <Input
            id="lossDollars"
            type="number"
            step="1"
            min="0"
            {...register("lossDollars", { valueAsNumber: true })}
            aria-invalid={errors.lossDollars ? true : undefined}
            aria-describedby={errors.lossDollars ? "lossDollars-error" : undefined}
          />
          {errors.lossDollars && (
            <p id="lossDollars-error" className="text-sm text-destructive">
              {errors.lossDollars.message}
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-medium">
            Deductible options (2–4)
          </legend>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor={`options.${index}.deductibleDollars`}>
                  Deductible ($)
                </Label>
                <Input
                  id={`options.${index}.deductibleDollars`}
                  type="number"
                  step="1"
                  min="0"
                  {...register(`options.${index}.deductibleDollars`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`options.${index}.annualPremiumDollars`}>
                  Annual premium ($)
                </Label>
                <Input
                  id={`options.${index}.annualPremiumDollars`}
                  type="number"
                  step="1"
                  min="0"
                  {...register(`options.${index}.annualPremiumDollars`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => remove(index)}
                disabled={fields.length <= 2}
                aria-label={`Remove deductible option ${index + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
          {errors.options?.message && (
            <p className="text-sm text-destructive">{errors.options.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => append({ deductibleDollars: 0, annualPremiumDollars: 0 })}
            disabled={fields.length >= 4}
          >
            Add another option
          </Button>
        </fieldset>

        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="n">Assume one claim every N years</Label>
          <Input
            id="n"
            type="number"
            step="1"
            min="1"
            {...register("n", { valueAsNumber: true })}
          />
          {errors.n && (
            <p className="text-sm text-destructive">{errors.n.message}</p>
          )}
        </div>

        {formError && (
          <p id="simulator-form-error" role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" className="self-start">
          Calculate
        </Button>
      </form>

      {results && (
        <section aria-label="Results" className="flex flex-col gap-8">
          <div>
            <h2 className="text-lg font-semibold">Out-of-pocket per option</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {results.perOption.map((option, i) =>
                option.outOfPocket.status === "ok" ? (
                  <div key={i} className="flex flex-col gap-4 rounded-lg border p-4">
                    <p className="text-sm font-medium">
                      Deductible: ${option.deductibleCents / 100}
                    </p>
                    <MoneyValue
                      label="Insurer pays"
                      value={option.outOfPocket.value.insurerPaysCents}
                      trace={option.outOfPocket.trace}
                    />
                    <MoneyValue
                      label="You pay"
                      value={option.outOfPocket.value.userPaysCents}
                    />
                  </div>
                ) : (
                  <p key={i} role="alert" className="text-sm text-destructive">
                    Could not calculate this option.
                  </p>
                ),
              )}
            </div>
          </div>

          {results.perPair.map((pair, i) => (
            <div key={i} className="flex flex-col gap-6 rounded-lg border p-4">
              <h2 className="text-lg font-semibold">
                ${pair.lowDeductibleCents / 100} vs. ${pair.highDeductibleCents / 100}{" "}
                deductible
              </h2>

              {pair.tradeOff.status === "ok" ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <MoneyValue
                    label="Annual premium difference"
                    value={pair.tradeOff.value.annualPremiumDifferenceCents}
                    trace={pair.tradeOff.trace}
                  />
                  <MoneyValue
                    label="Extra out-of-pocket if a claim happens"
                    value={pair.tradeOff.value.extraOutOfPocketIfClaimCents}
                  />
                </div>
              ) : (
                <p role="alert" className="text-sm text-destructive">
                  Could not calculate the trade-off for this pair.
                </p>
              )}

              {pair.breakEven.status === "ok" &&
                (pair.breakEven.value.status === "computed" ? (
                  <NumericValue
                    label="Break-even (claim-free years)"
                    value={pair.breakEven.value.breakEvenYears!}
                    unit="years"
                    trace={pair.breakEven.trace}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No break-even: no premium savings were entered for the
                    higher deductible.
                  </p>
                ))}

              {pair.nYear.status === "ok" && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <MoneyValue
                    label={`Cost over ${results.n} years (lower deductible)`}
                    value={pair.nYear.value.lowCostCents}
                    trace={pair.nYear.trace}
                  />
                  <MoneyValue
                    label={`Cost over ${results.n} years (higher deductible)`}
                    value={pair.nYear.value.highCostCents}
                  />
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
