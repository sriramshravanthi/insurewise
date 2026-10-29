"use client";

import { useState } from "react";
import { useFieldArray, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyValue } from "@/components/value";
import { NumericValue } from "@/components/numeric-value";
import {
  CarProfileFormSchema,
  driverFormToDriver,
  emptyCarProfileForm,
  type CarCoverageForm,
  type CarProfileForm,
} from "@/schemas/car-profile-form";
import { dollarsToCents } from "@/schemas/deductible-simulator-form";
import { COMPARISON_COVERAGE_CODES } from "@/schemas/policy-comparison-form";
import { premiumComposition, type PremiumLine } from "@/engine/premium-composition";
import { getCoverageDefinition } from "@/reference/coverage-definitions";
import { getRatingFactors } from "@/reference/rating-factors";

// A UI-to-engine adapter, not a shape — belongs here, not in schemas
// (schemas is the dependency root and may not import from engine).
export function coveragesToPremiumLines(
  coverages: CarCoverageForm[],
): PremiumLine[] {
  return coverages
    .filter((c) => c.included && c.linePremiumDollars !== undefined)
    .map((c) => ({
      key: c.code,
      label: c.code,
      amountCents: dollarsToCents(c.linePremiumDollars as number),
    }));
}

const COVERAGE_LABELS: Record<string, string> = {
  liability: "Liability",
  collision: "Collision",
  comprehensive: "Comprehensive",
  um: "Uninsured motorist",
};

// An empty optional number input's native valueAsNumber is NaN, not
// undefined, and Zod rejects NaN even on optional fields (same fix as
// Cycle 2's comparison UI).
function emptyToUndefinedNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export function CarProfile() {
  const [submitted, setSubmitted] = useState<CarProfileForm | null>(null);

  const { register, control, handleSubmit } = useForm<CarProfileForm>({
    resolver: zodResolver(CarProfileFormSchema),
    defaultValues: emptyCarProfileForm(),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "drivers" });

  const onSubmit = (data: CarProfileForm) => setSubmitted(data);

  const compositionResult = submitted
    ? premiumComposition({
        lines: coveragesToPremiumLines(submitted.coverages),
        totalCents:
          submitted.annualPremiumDollars !== undefined
            ? dollarsToCents(submitted.annualPremiumDollars)
            : undefined,
      })
    : null;

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3 rounded-lg border p-4">
          <legend className="text-sm font-medium">Vehicle</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle.year">Year</Label>
              <Input
                id="vehicle.year"
                type="number"
                step="1"
                {...register("vehicle.year", { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle.make">Make</Label>
              <Input id="vehicle.make" {...register("vehicle.make")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle.model">Model</Label>
              <Input id="vehicle.model" {...register("vehicle.model")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle.ownership">Ownership</Label>
              <select
                id="vehicle.ownership"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                {...register("vehicle.ownership")}
              >
                <option value="owned">Owned</option>
                <option value="financed">Financed</option>
                <option value="leased">Leased</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle.valueDollars">Vehicle value ($)</Label>
              <Input
                id="vehicle.valueDollars"
                type="number"
                step="1"
                min="0"
                {...register("vehicle.valueDollars", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle.loanBalanceDollars">Loan balance ($)</Label>
              <Input
                id="vehicle.loanBalanceDollars"
                type="number"
                step="1"
                min="0"
                {...register("vehicle.loanBalanceDollars", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle.mileageBand">Mileage band</Label>
              <Input
                id="vehicle.mileageBand"
                placeholder="e.g. 10,000-15,000/yr"
                {...register("vehicle.mileageBand")}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Drivers (1–5)</legend>
          {fields.map((field, index) => {
            const path = (suffix: string) =>
              `drivers.${index}.${suffix}` as Path<CarProfileForm>;
            return (
              <div key={field.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Driver {index + 1}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={path("ageBand")} className="text-xs">
                      Age band
                    </Label>
                    <Input id={path("ageBand")} {...register(path("ageBand"))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={path("yearsLicensedBand")} className="text-xs">
                      Years licensed band
                    </Label>
                    <Input
                      id={path("yearsLicensedBand")}
                      {...register(path("yearsLicensedBand"))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={path("accidents3y")} className="text-xs">
                      Accidents (3y)
                    </Label>
                    <Input
                      id={path("accidents3y")}
                      type="number"
                      step="1"
                      min="0"
                      {...register(path("accidents3y"), {
                        setValueAs: emptyToUndefinedNumber,
                      })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={path("violations3y")} className="text-xs">
                      Violations (3y)
                    </Label>
                    <Input
                      id={path("violations3y")}
                      type="number"
                      step="1"
                      min="0"
                      {...register(path("violations3y"), {
                        setValueAs: emptyToUndefinedNumber,
                      })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => append({})}
            disabled={fields.length >= 5}
          >
            Add another driver
          </Button>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Coverage</legend>
          {COMPARISON_COVERAGE_CODES.map((code, i) => {
            const path = (suffix: string) =>
              `coverages.${i}.${suffix}` as Path<CarProfileForm>;
            return (
              <div
                key={code}
                className="grid grid-cols-1 gap-2 sm:grid-cols-6 sm:items-end"
              >
                <div className="flex items-center gap-2 sm:col-span-1">
                  <input
                    id={path("included")}
                    type="checkbox"
                    className="size-4"
                    {...register(path("included"))}
                  />
                  <Label htmlFor={path("included")}>{COVERAGE_LABELS[code]}</Label>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={path("limitPrimaryDollars")} className="text-xs">
                    Limit (primary, $)
                  </Label>
                  <Input
                    id={path("limitPrimaryDollars")}
                    type="number"
                    step="1"
                    min="0"
                    {...register(path("limitPrimaryDollars"), {
                      setValueAs: emptyToUndefinedNumber,
                    })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={path("limitSecondaryDollars")} className="text-xs">
                    Limit (secondary, $)
                  </Label>
                  <Input
                    id={path("limitSecondaryDollars")}
                    type="number"
                    step="1"
                    min="0"
                    {...register(path("limitSecondaryDollars"), {
                      setValueAs: emptyToUndefinedNumber,
                    })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={path("deductibleDollars")} className="text-xs">
                    Deductible ($)
                  </Label>
                  <Input
                    id={path("deductibleDollars")}
                    type="number"
                    step="1"
                    min="0"
                    {...register(path("deductibleDollars"), {
                      setValueAs: emptyToUndefinedNumber,
                    })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={path("linePremiumDollars")} className="text-xs">
                    Premium for this coverage ($/yr)
                  </Label>
                  <Input
                    id={path("linePremiumDollars")}
                    type="number"
                    step="1"
                    min="0"
                    {...register(path("linePremiumDollars"), {
                      setValueAs: emptyToUndefinedNumber,
                    })}
                  />
                </div>
              </div>
            );
          })}
        </fieldset>

        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="annualPremiumDollars">Total annual premium ($, optional)</Label>
          <Input
            id="annualPremiumDollars"
            type="number"
            step="1"
            min="0"
            {...register("annualPremiumDollars", {
              setValueAs: emptyToUndefinedNumber,
            })}
          />
        </div>

        <Button type="submit" className="self-start">
          Show car profile
        </Button>
      </form>

      {submitted && (
        <section aria-label="Car profile" className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Vehicle &amp; drivers</h2>
            <p className="text-sm">
              {submitted.vehicle.year} {submitted.vehicle.make}{" "}
              {submitted.vehicle.model} ({submitted.vehicle.ownership})
            </p>
            <p className="text-sm text-muted-foreground">
              Mileage band: {submitted.vehicle.mileageBand || "Not entered"}
            </p>
            {submitted.vehicle.valueDollars !== undefined && (
              <MoneyValue
                label="Vehicle value"
                value={{
                  amount: dollarsToCents(submitted.vehicle.valueDollars),
                  provenance: "entered",
                }}
              />
            )}
            <ul className="text-sm text-muted-foreground">
              {submitted.drivers.map((d, i) => {
                const driver = driverFormToDriver(d);
                return (
                  <li key={i}>
                    Driver {i + 1}: age band {driver.ageBand ?? "Not entered"},
                    licensed {driver.yearsLicensedBand ?? "Not entered"}
                    {driver.incidents3y &&
                      ` — ${driver.incidents3y.accidents} accident(s), ${driver.incidents3y.violations} violation(s) in 3y`}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Coverage breakdown</h2>
            <p className="text-xs text-muted-foreground">
              Plain-language definitions below come from the coverage
              catalog; a coverage without a verified, sourced definition
              yet (docs/RESEARCH-SOURCES.md is still Phase 0) shows just
              the entered values.
            </p>
            {submitted.coverages.map((c, i) => {
              const definition = getCoverageDefinition(c.code, "auto");
              return (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{COVERAGE_LABELS[c.code]}</p>
                {definition && (
                  <p className="mt-1 text-xs text-muted-foreground">{definition.plainLanguage}</p>
                )}
                {c.included ? (
                  <dl className="mt-1 grid grid-cols-2 gap-1 text-muted-foreground">
                    <dt>Limit (primary)</dt>
                    <dd>
                      {c.limitPrimaryDollars !== undefined
                        ? `$${c.limitPrimaryDollars}`
                        : "Not entered"}
                    </dd>
                    <dt>Limit (secondary)</dt>
                    <dd>
                      {c.limitSecondaryDollars !== undefined
                        ? `$${c.limitSecondaryDollars}`
                        : "Not entered"}
                    </dd>
                    <dt>Deductible</dt>
                    <dd>
                      {c.deductibleDollars !== undefined
                        ? `$${c.deductibleDollars}`
                        : "Not entered"}
                    </dd>
                  </dl>
                ) : (
                  <p className="mt-1 text-muted-foreground">Not entered</p>
                )}
              </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Premium explanation</h2>
            {(() => {
              const factors = getRatingFactors("auto");
              return factors.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No verified rating factors are available yet (docs/RESEARCH-SOURCES.md
                  is still Phase 0) — sourced factor cards will appear here once one
                  clears verification.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {factors.map((factor) => (
                    <li key={factor.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{factor.factor}</p>
                      <p className="text-muted-foreground">{factor.howCommonlyConsidered}</p>
                      <p className="text-xs text-muted-foreground">
                        Source: {factor.sourceIds.join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              );
            })()}
            {compositionResult?.status === "ok" ? (
              <ul className="flex flex-col gap-2">
                {compositionResult.value.shares.map((share) => (
                  <li key={share.key}>
                    <NumericValue
                      label={COVERAGE_LABELS[share.key] ?? share.label}
                      value={share.percentage}
                      unit="%"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter at least one coverage&apos;s premium to see the
                line-level breakdown.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
