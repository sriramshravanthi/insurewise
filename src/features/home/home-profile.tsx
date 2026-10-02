"use client";

import { useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyValue } from "@/components/value";
import { NumericValue } from "@/components/numeric-value";
import {
  HOME_COVERAGE_CODES,
  HomeProfileFormSchema,
  emptyHomeProfileForm,
  type HomeCoverageForm,
  type HomeProfileForm,
} from "@/schemas/home-profile-form";
import { dollarsToCents } from "@/schemas/deductible-simulator-form";
import { homeCoverageRatios } from "@/engine/home-coverage-ratios";
import { rebuildEstimate } from "@/engine/rebuild-estimate";
import { premiumComposition, type PremiumLine } from "@/engine/premium-composition";

const COVERAGE_LABELS: Record<string, string> = {
  dwelling: "Dwelling (A)",
  other_structures: "Other structures (B)",
  personal_property: "Personal property (C)",
  loss_of_use: "Loss of use (D)",
  personal_liability: "Personal liability (E)",
  medical_payments: "Medical payments (F)",
};

// An empty optional number input's native valueAsNumber is NaN, not
// undefined; Zod rejects NaN even on optional fields (same fix as the Car
// and Compare cycles).
function emptyToUndefinedNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

function coveragesToPremiumLines(coverages: HomeCoverageForm[]): PremiumLine[] {
  return coverages
    .filter((c) => c.included && c.linePremiumDollars !== undefined)
    .map((c) => ({
      key: c.code,
      label: c.code,
      amountCents: dollarsToCents(c.linePremiumDollars as number),
    }));
}

interface ChecklistItem {
  label: string;
  done: boolean;
}

function buildChecklist(data: HomeProfileForm): ChecklistItem[] {
  return [
    { label: "Roof age band entered", done: Boolean(data.property.roofAgeBand) },
    {
      label: "Rebuild estimate (entered or computable from sqft and cost/sqft)",
      done:
        data.property.rebuildEstimateDollars !== undefined ||
        (data.property.sqft !== undefined &&
          data.property.costPerSqftDollars !== undefined),
    },
    { label: "Market value entered", done: data.property.marketValueDollars !== undefined },
    { label: "Contents value entered", done: data.property.contentsValueDollars !== undefined },
    { label: "Annual premium entered", done: data.annualPremiumDollars !== undefined },
    { label: "Endorsements considered", done: data.endorsementsText.trim().length > 0 },
  ];
}

export function HomeProfile() {
  const [submitted, setSubmitted] = useState<HomeProfileForm | null>(null);
  // Tracked separately from RHF's own state (not via watch()) so the
  // condo/townhome pointer can update live without the memoization issues
  // RHF's watch() has under the React Compiler.
  const [propertyType, setPropertyType] = useState<HomeProfileForm["property"]["type"]>(
    "single_family",
  );

  const { register, handleSubmit } = useForm<HomeProfileForm>({
    resolver: zodResolver(HomeProfileFormSchema),
    defaultValues: emptyHomeProfileForm(),
  });
  const propertyTypeField = register("property.type");

  const onSubmit = (data: HomeProfileForm) => setSubmitted(data);

  if (submitted?.property.type === "manufactured_mobile") {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-lg border p-4 text-sm">
          Manufactured and mobile homes aren&apos;t supported in this MVP
          yet (PRD HOM-3).
        </p>
        <Button type="button" onClick={() => setSubmitted(null)}>
          Start over
        </Button>
      </div>
    );
  }

  const dwelling = submitted?.coverages.find((c) => c.code === "dwelling");
  const contents = submitted?.coverages.find((c) => c.code === "personal_property");
  const lossOfUse = submitted?.coverages.find((c) => c.code === "loss_of_use");

  let resolvedRebuildEstimateCents: number | undefined;
  if (submitted) {
    if (submitted.property.rebuildEstimateDollars !== undefined) {
      resolvedRebuildEstimateCents = dollarsToCents(
        submitted.property.rebuildEstimateDollars,
      );
    } else if (
      submitted.property.sqft !== undefined &&
      submitted.property.costPerSqftDollars !== undefined
    ) {
      const estimate = rebuildEstimate({
        squareFeet: submitted.property.sqft,
        costPerSqFtCents: dollarsToCents(submitted.property.costPerSqftDollars),
      });
      if (estimate.status === "ok") {
        resolvedRebuildEstimateCents = estimate.value.rebuildEstimateCents.amount;
      }
    }
  }

  const ratiosResult =
    submitted && dwelling?.included && dwelling.limitDollars !== undefined
      ? homeCoverageRatios({
          dwellingLimitCents: dollarsToCents(dwelling.limitDollars),
          contentsLimitCents:
            contents?.included && contents.limitDollars !== undefined
              ? dollarsToCents(contents.limitDollars)
              : undefined,
          lossOfUseLimitCents:
            lossOfUse?.included && lossOfUse.limitDollars !== undefined
              ? dollarsToCents(lossOfUse.limitDollars)
              : undefined,
          rebuildEstimateCents: resolvedRebuildEstimateCents,
          provenance: "entered",
        })
      : null;

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
          <legend className="text-sm font-medium">Property</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.type">Type</Label>
              <select
                id="property.type"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                {...propertyTypeField}
                onChange={(e) => {
                  propertyTypeField.onChange(e);
                  setPropertyType(
                    e.target.value as HomeProfileForm["property"]["type"],
                  );
                }}
              >
                <option value="single_family">Single family</option>
                <option value="townhome">Townhome</option>
                <option value="condo">Condo</option>
                <option value="manufactured_mobile">Manufactured / mobile</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.yearBuilt">Year built</Label>
              <Input
                id="property.yearBuilt"
                type="number"
                step="1"
                {...register("property.yearBuilt", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.sqft">Square feet</Label>
              <Input
                id="property.sqft"
                type="number"
                step="1"
                min="0"
                {...register("property.sqft", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.stories">Stories</Label>
              <Input
                id="property.stories"
                type="number"
                step="1"
                min="0"
                {...register("property.stories", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.roofAgeBand">Roof age band</Label>
              <Input
                id="property.roofAgeBand"
                placeholder="e.g. 0-5 years"
                {...register("property.roofAgeBand")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.marketValueDollars">Market value ($)</Label>
              <Input
                id="property.marketValueDollars"
                type="number"
                step="1"
                min="0"
                {...register("property.marketValueDollars", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.rebuildEstimateDollars">
                Rebuild estimate ($, optional)
              </Label>
              <Input
                id="property.rebuildEstimateDollars"
                type="number"
                step="1"
                min="0"
                {...register("property.rebuildEstimateDollars", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.costPerSqftDollars">
                Cost per sq ft ($, Illustrative)
              </Label>
              <Input
                id="property.costPerSqftDollars"
                type="number"
                step="1"
                min="0"
                {...register("property.costPerSqftDollars", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="property.contentsValueDollars">
                Contents value ($)
              </Label>
              <Input
                id="property.contentsValueDollars"
                type="number"
                step="1"
                min="0"
                {...register("property.contentsValueDollars", {
                  setValueAs: emptyToUndefinedNumber,
                })}
              />
            </div>
          </div>
          {(propertyType === "condo" || propertyType === "townhome") && (
            <p className="text-xs text-muted-foreground">
              Condo and townhome coverage often works alongside your
              association&apos;s master policy — ask your association and a
              licensed professional what the master policy covers versus
              what you need to cover yourself (PRD HOM-3).
            </p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Coverage (A–F)</legend>
          {HOME_COVERAGE_CODES.map((code, i) => {
            const path = (suffix: string) =>
              `coverages.${i}.${suffix}` as Path<HomeProfileForm>;
            return (
              <div
                key={code}
                className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-end"
              >
                <div className="flex items-center gap-2">
                  <input
                    id={path("included")}
                    type="checkbox"
                    className="size-4"
                    {...register(path("included"))}
                  />
                  <Label htmlFor={path("included")}>{COVERAGE_LABELS[code]}</Label>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={path("limitDollars")} className="text-xs">
                    Limit ($)
                  </Label>
                  <Input
                    id={path("limitDollars")}
                    type="number"
                    step="1"
                    min="0"
                    {...register(path("limitDollars"), {
                      setValueAs: emptyToUndefinedNumber,
                    })}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="deductibleDollars">Deductible ($)</Label>
            <Input
              id="deductibleDollars"
              type="number"
              step="1"
              min="0"
              {...register("deductibleDollars", {
                setValueAs: emptyToUndefinedNumber,
              })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="annualPremiumDollars">Total annual premium ($)</Label>
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
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="endorsementsText">Endorsements (one per line)</Label>
          <textarea
            id="endorsementsText"
            className="min-h-16 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
            {...register("endorsementsText")}
          />
        </div>

        <Button type="submit" className="self-start">
          Show home profile
        </Button>
      </form>

      {submitted && (
        <section aria-label="Home profile" className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Property &amp; values</h2>
            <p className="text-sm">
              {submitted.property.type.replace("_", " ")}
              {submitted.property.yearBuilt && `, built ${submitted.property.yearBuilt}`}
              {submitted.property.sqft && `, ${submitted.property.sqft} sq ft`}
            </p>
            <p className="text-sm text-muted-foreground">
              Roof age band: {submitted.property.roofAgeBand || "Not entered"}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {submitted.property.marketValueDollars !== undefined && (
                <MoneyValue
                  label="Market value"
                  value={{
                    amount: dollarsToCents(submitted.property.marketValueDollars),
                    provenance: "entered",
                  }}
                />
              )}
              {resolvedRebuildEstimateCents !== undefined && (
                <MoneyValue
                  label="Rebuild estimate"
                  value={{ amount: resolvedRebuildEstimateCents, provenance: "illustrative" }}
                />
              )}
            </div>
            {submitted.property.marketValueDollars !== undefined &&
              resolvedRebuildEstimateCents !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Market value and rebuild cost are not the same thing, and
                  policies may treat them differently — this is worth
                  discussing with a licensed professional (PRD HOM-2).
                </p>
              )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Coverage breakdown</h2>
            <p className="text-xs text-muted-foreground">
              Plain-language coverage definitions aren&apos;t available yet
              — they depend on the coverage catalog (Reference/Content
              layer, not yet built).
            </p>
            {submitted.coverages.map((c, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{COVERAGE_LABELS[c.code]}</p>
                {c.included ? (
                  <p className="mt-1 text-muted-foreground">
                    Limit:{" "}
                    {c.limitDollars !== undefined ? `$${c.limitDollars}` : "Not entered"}
                  </p>
                ) : (
                  <p className="mt-1 text-muted-foreground">Not entered</p>
                )}
              </div>
            ))}

            {ratiosResult?.status === "ok" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {ratiosResult.value.contentsRatio && (
                  <NumericValue
                    label="Contents ratio (C/A)"
                    value={ratiosResult.value.contentsRatio}
                    unit="%"
                  />
                )}
                {ratiosResult.value.lossOfUseRatio && (
                  <NumericValue
                    label="Loss-of-use ratio (D/A)"
                    value={ratiosResult.value.lossOfUseRatio}
                    unit="%"
                  />
                )}
                {ratiosResult.value.dwellingVsRebuildRatio && (
                  <NumericValue
                    label="Dwelling vs. rebuild estimate"
                    value={ratiosResult.value.dwellingVsRebuildRatio}
                    unit="%"
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a dwelling limit (Coverage A) to see coverage ratios.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Premium explanation</h2>
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

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Home risk checklist</h2>
            <p className="text-xs text-muted-foreground">
              Placeholder: tracks profile completeness only. Real,
              sourced risk-checklist items (why each matters, with a
              citation) depend on the Reference/Content layer, not yet
              built.
            </p>
            {(() => {
              const items = buildChecklist(submitted);
              const doneCount = items.filter((i) => i.done).length;
              return (
                <>
                  <p className="text-sm font-medium">
                    {doneCount} of {items.length} reviewed
                  </p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {items.map((item) => (
                      <li key={item.label} className="flex items-center gap-2">
                        <span aria-hidden="true">{item.done ? "✓" : "○"}</span>
                        <span>{item.label}</span>
                        <span className="sr-only">
                          {item.done ? "Reviewed" : "Not reviewed"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>
        </section>
      )}
    </div>
  );
}
