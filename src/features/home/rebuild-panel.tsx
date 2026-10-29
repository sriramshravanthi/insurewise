"use client";

/**
 * RebuildPanel — C10 coverage ratios + C11 rebuild estimate.
 *
 * Lets the user enter their home's square footage and a cost-per-sq-ft
 * estimate to get a rough rebuild figure (C11), then compares that
 * against their Coverage A limit and shows the other ratios (C/A, D/A).
 */

import { useState } from "react";
import {
  c11RebuildEstimate,
  c10CoverageRatios,
} from "@/engine/c10-c11-home-ratios";
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
import { formatCents, parseDollarsToCents } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function RatioRow({
  label,
  pct,
  note,
}: {
  label: string;
  pct: number | null;
  note: string;
}) {
  if (pct === null) return null;

  // Simple thresholding for educational color cue
  const color =
    pct >= 90
      ? "text-emerald-600 dark:text-emerald-400"
      : pct >= 70
      ? "text-amber-600 dark:text-amber-400"
      : "text-destructive";

  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <span className="text-sm">{label}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RebuildPanel() {
  const [sqFt, setSqFt] = useState("");
  const [costPerSqFt, setCostPerSqFt] = useState("");
  const [covA, setCovA] = useState("");
  const [covC, setCovC] = useState("");
  const [covD, setCovD] = useState("");

  const sqFtNum = parseFloat(sqFt);
  const costPerSqFtCents = parseDollarsToCents(costPerSqFt) ?? 0;
  const covACents = parseDollarsToCents(covA);
  const covCCents = parseDollarsToCents(covC);
  const covDCents = parseDollarsToCents(covD);

  // C11 rebuild estimate
  const c11 =
    sqFtNum > 0 && costPerSqFtCents > 0
      ? c11RebuildEstimate({ squareFeet: sqFtNum, costPerSqFtCents })
      : null;

  const rebuildCents =
    c11?.status === "ok" ? c11.value.rebuildEstimateCents : undefined;

  // C10 ratios
  const c10 =
    covACents != null && covACents > 0
      ? c10CoverageRatios({
          coverageACents: covACents,
          ...(covCCents != null ? { coverageCCents: covCCents } : {}),
          ...(covDCents != null ? { coverageDCents: covDCents } : {}),
          ...(rebuildCents != null ? { rebuildEstimateCents: rebuildCents } : {}),
          rebuildEstimateProvenance: "Illustrative",
        })
      : null;

  const ratios = c10?.status === "ok" ? c10.value : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rebuild Cost & Coverage Ratios</CardTitle>
        <CardDescription>
          Estimate your home&apos;s rebuild cost (C11) and see how your Coverage A
          stacks up against it, plus the C/A and D/A ratios (C10).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* C11 inputs */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Rebuild estimate (C11)
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Home size (sq ft)</Label>
              <Input
                value={sqFt}
                onChange={(e) => setSqFt(e.target.value)}
                placeholder="e.g. 1800"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Est. cost per sq ft ($)</Label>
              <Input
                value={costPerSqFt}
                onChange={(e) => setCostPerSqFt(e.target.value)}
                placeholder="e.g. 200"
                className="h-8 text-sm"
              />
            </div>
          </div>
          {c11?.status === "ok" && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <Badge variant="outline" className="text-xs">
                Illustrative
              </Badge>
              <span className="text-sm">
                Estimated rebuild:{" "}
                <strong>{formatCents(c11.value.rebuildEstimateCents)}</strong>
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Rebuild cost ≠ market value. Costs vary by location, materials, and
            labor. Use this as a rough illustration only.
          </p>
        </div>

        {/* C10 inputs */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your coverage limits (C10)
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Coverage A — Dwelling ($)</Label>
              <Input
                value={covA}
                onChange={(e) => setCovA(e.target.value)}
                placeholder="e.g. 350000"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Coverage C — Contents ($)</Label>
              <Input
                value={covC}
                onChange={(e) => setCovC(e.target.value)}
                placeholder="e.g. 175000"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Coverage D — Loss of Use ($)</Label>
              <Input
                value={covD}
                onChange={(e) => setCovD(e.target.value)}
                placeholder="e.g. 70000"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ratio results */}
        {!covACents && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Enter your Coverage A limit above to see the ratios.
          </p>
        )}

        {ratios && (
          <div className="space-y-2">
            <div className="divide-y rounded-lg border px-4">
              <RatioRow
                label="Dwelling vs. rebuild estimate"
                pct={ratios.dwellingVsRebuildPct}
                note="Coverage A ÷ rebuild estimate — aim for ≥ 100% to cover a total loss"
              />
              <RatioRow
                label="Contents vs. dwelling (C/A)"
                pct={ratios.contentsVsDwellingPct}
                note="Coverage C ÷ Coverage A — typical range 50–70%"
              />
              <RatioRow
                label="Loss of use vs. dwelling (D/A)"
                pct={ratios.lossOfUseVsDwellingPct}
                note="Coverage D ÷ Coverage A — typical range 20–30%"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ratios below 80% on dwelling vs. rebuild are informational only —
              your policy&apos;s adequacy depends on your specific situation. Discuss
              with your insurer or agent.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
