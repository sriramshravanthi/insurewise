"use client";

/**
 * /dashboard/compare — Scenario comparison (C8) and bundle delta (C9).
 *
 * Two tools on one page:
 *   1. Scenario Delta (C8): compare two annual premiums and see the delta
 *   2. Bundle Comparison (C9): enter separate premiums and a bundled quote,
 *      see the savings or cost difference
 *
 * Educational only — no recommendation which is "better".
 */

import { useState } from "react";
import { GitCompare, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { c8ScenarioDelta } from "@/engine/c8-c9-deltas";
import { c9BundleDelta } from "@/engine/c8-c9-deltas";
import { formatCents, parseDollarsToCents } from "@/lib/utils";

// ---------------------------------------------------------------------------
// C8 — Scenario Delta tool
// ---------------------------------------------------------------------------

function ScenarioDeltaTool() {
  const [baseline, setBaseline] = useState("");
  const [scenario, setScenario] = useState("");
  const [baselineLabel, setBaselineLabel] = useState("Current policy");
  const [scenarioLabel, setScenarioLabel] = useState("Quote / alternative");

  const baselineCents = parseDollarsToCents(baseline);
  const scenarioCents = parseDollarsToCents(scenario);

  const result =
    baselineCents != null && scenarioCents != null
      ? c8ScenarioDelta({ baselineCents, scenarioCents })
      : null;

  const delta = result?.status === "ok" ? result.value : null;

  const directionLabel =
    delta == null
      ? null
      : delta.deltaCents < 0
      ? "less expensive"
      : delta.deltaCents > 0
      ? "more expensive"
      : "same cost";

  const badgeVariant =
    delta?.deltaCents != null && delta.deltaCents < 0 ? "success" : "outline";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scenario Comparison (C8)</CardTitle>
        <CardDescription>
          Compare two annual premium amounts side by side. Enter one as your
          baseline and one as a quote or alternative.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Baseline */}
          <div className="rounded-lg border p-4 space-y-3">
            <Badge variant="secondary">Baseline</Badge>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input
                  value={baselineLabel}
                  onChange={(e) => setBaselineLabel(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Annual premium ($)</Label>
                <Input
                  value={baseline}
                  onChange={(e) => setBaseline(e.target.value)}
                  placeholder="e.g. 1800"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Scenario */}
          <div className="rounded-lg border p-4 space-y-3">
            <Badge variant="outline">Scenario</Badge>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input
                  value={scenarioLabel}
                  onChange={(e) => setScenarioLabel(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Annual premium ($)</Label>
                <Input
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="e.g. 1600"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {!baselineCents && !scenarioCents && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Enter two annual premiums to see the difference.
          </p>
        )}

        {delta && (
          <div className="rounded-lg border divide-y px-4">
            <div className="flex items-start justify-between gap-4 py-2">
              <span className="text-sm">Annual difference</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={badgeVariant as "success" | "outline"}
                  className="text-xs"
                >
                  {directionLabel}
                </Badge>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    delta.deltaCents < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : delta.deltaCents > 0
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {delta.deltaCents < 0
                    ? `−${formatCents(-delta.deltaCents)}`
                    : delta.deltaCents > 0
                    ? `+${formatCents(delta.deltaCents)}`
                    : "$0.00"}
                </span>
              </div>
            </div>
            {delta.deltaPct != null && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Percentage change</span>
                <span className="text-sm tabular-nums">
                  {delta.deltaPct > 0 ? "+" : ""}
                  {delta.deltaPct.toFixed(1)}%
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{baselineLabel}</span>
              <span className="text-sm tabular-nums">{formatCents(baselineCents ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{scenarioLabel}</span>
              <span className="text-sm tabular-nums">{formatCents(scenarioCents ?? 0)}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Arithmetic comparison only. Coverage differences between two policies
          are not factored in. Lower price is not always the better option if
          coverage limits differ.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// C9 — Bundle comparison tool
// ---------------------------------------------------------------------------

function BundleTool() {
  const [separates, setSeparates] = useState([
    { label: "Car policy", value: "" },
    { label: "Home policy", value: "" },
  ]);
  const [bundled, setBundled] = useState("");

  function updateSeparate(index: number, field: "label" | "value", val: string) {
    setSeparates((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  }

  function addRow() {
    setSeparates((prev) => [...prev, { label: `Policy ${prev.length + 1}`, value: "" }]);
  }

  function removeRow(index: number) {
    setSeparates((prev) => prev.filter((_, i) => i !== index));
  }

  const separateCents = separates.map((s) => parseDollarsToCents(s.value) ?? 0);
  const bundledCents = parseDollarsToCents(bundled);

  const hasEnough =
    separateCents.some((v) => v > 0) && bundledCents != null;

  const result = hasEnough
    ? c9BundleDelta({
        separatePolicyCents: separateCents,
        bundledCents: bundledCents!,
      })
    : null;

  const bundle = result?.status === "ok" ? result.value : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bundle Comparison (C9)</CardTitle>
        <CardDescription>
          Enter your separate policy premiums and a bundled quote to see the
          dollar and percentage difference.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Separate policies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Separate policies (annual totals)
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={addRow}
            >
              + Add
            </Button>
          </div>
          <div className="space-y-2">
            {separates.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={s.label}
                  onChange={(e) => updateSeparate(i, "label", e.target.value)}
                  className="h-8 text-sm flex-[2]"
                  placeholder="Policy name"
                />
                <Input
                  value={s.value}
                  onChange={(e) => updateSeparate(i, "value", e.target.value)}
                  className="h-8 text-sm flex-1"
                  placeholder="$ annual"
                />
                {separates.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    onClick={() => removeRow(i)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Separate total</span>
            <span className="font-medium tabular-nums">
              {formatCents(separateCents.reduce((a, b) => a + b, 0))}/yr
            </span>
          </div>
        </div>

        <Separator />

        {/* Bundled */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bundled quote (annual)
          </Label>
          <Input
            value={bundled}
            onChange={(e) => setBundled(e.target.value)}
            placeholder="e.g. 2800"
            className="sm:max-w-[200px]"
          />
        </div>

        {/* Results */}
        {!hasEnough && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Enter at least one separate premium and the bundled quote.
          </p>
        )}

        {bundle && (
          <div className="rounded-lg border divide-y px-4">
            <div className="flex items-start justify-between gap-4 py-2">
              <span className="text-sm">Bundle vs. separate</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={bundle.direction === "lower" ? "success" : "outline"}
                  className="text-xs"
                >
                  {bundle.direction === "lower"
                    ? "Bundle is lower"
                    : bundle.direction === "higher"
                    ? "Bundle is higher"
                    : "Same cost"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Separate total</span>
              <span className="text-sm tabular-nums">
                {formatCents(bundle.separateTotalCents)}/yr
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Bundled quote</span>
              <span className="text-sm tabular-nums">
                {formatCents(bundledCents ?? 0)}/yr
              </span>
            </div>
            <div className="flex items-center justify-between py-2 font-medium">
              <span className="text-sm">Difference</span>
              <span
                className={`text-sm tabular-nums ${
                  bundle.differenceCents > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : bundle.differenceCents < 0
                    ? "text-destructive"
                    : ""
                }`}
              >
                {bundle.differenceCents > 0
                  ? `${formatCents(bundle.differenceCents)} savings`
                  : bundle.differenceCents < 0
                  ? `${formatCents(-bundle.differenceCents)} extra cost`
                  : "No difference"}
                {bundle.differencePct != null && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({bundle.differencePct.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          This is a dollar comparison only. Coverage limits, deductibles, and
          service quality may differ between separate and bundled policies.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitCompare className="h-6 w-6 text-primary" />
          Compare & Scenarios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare premiums side by side or evaluate whether bundling saves money.
        </p>
      </div>

      <ScenarioDeltaTool />
      <BundleTool />

      <div className="flex gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <strong>Educational tool only.</strong> Premium comparisons are
          arithmetic only — they do not account for coverage differences,
          insurer quality, claims handling, or any other factor. A lower
          premium is not always a better policy.
        </p>
      </div>
    </div>
  );
}
