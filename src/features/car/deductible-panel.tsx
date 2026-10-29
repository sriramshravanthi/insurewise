"use client";

/**
 * DeductiblePanel — C4 / C5 / C6 deductible trade-off analysis.
 *
 * User enters two deductible scenarios (low / high) with their
 * corresponding premiums. The panel shows:
 *   - Annual premium savings by choosing the higher deductible
 *   - Extra out-of-pocket exposure on a claim
 *   - Break-even years (C5)
 *   - N-year total cost comparison (C6), with an adjustable N slider
 */

import { useState } from "react";
import {
  c4DeductibleTradeoff,
  c5BreakEven,
  c6NYearCostView,
} from "@/engine/c4-deductible-tradeoff";
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
// Helpers
// ---------------------------------------------------------------------------

function toCents(val: string): number | null {
  return parseDollarsToCents(val);
}

function StatRow({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: string;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-2 ${
        highlight ? "font-medium text-primary" : ""
      }`}
    >
      <div>
        <span className="text-sm">{label}</span>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
      <span className="text-sm tabular-nums">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeductiblePanel() {
  const [dLow, setDLow] = useState("");
  const [pLow, setPLow] = useState("");
  const [dHigh, setDHigh] = useState("");
  const [pHigh, setPHigh] = useState("");
  const [nYears, setNYears] = useState(3);

  const dLowCents = toCents(dLow);
  const pLowCents = toCents(pLow);
  const dHighCents = toCents(dHigh);
  const pHighCents = toCents(pHigh);

  const hasAll =
    dLowCents != null &&
    pLowCents != null &&
    dHighCents != null &&
    pHighCents != null;

  const c4 = hasAll
    ? c4DeductibleTradeoff({
        dLowCents: dLowCents!,
        pLowAnnualCents: pLowCents!,
        dHighCents: dHighCents!,
        pHighAnnualCents: pHighCents!,
      })
    : null;

  const c5 =
    c4?.status === "ok"
      ? c5BreakEven({
          dLowCents: dLowCents!,
          pLowAnnualCents: pLowCents!,
          dHighCents: dHighCents!,
          pHighAnnualCents: pHighCents!,
        })
      : null;

  const c6 =
    c4?.status === "ok"
      ? c6NYearCostView({
          dLowCents: dLowCents!,
          pLowAnnualCents: pLowCents!,
          dHighCents: dHighCents!,
          pHighAnnualCents: pHighCents!,
          nYears,
        })
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deductible Trade-off</CardTitle>
        <CardDescription>
          Compare two deductible levels side-by-side. Enter the annual premium
          for each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Low deductible */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Option A</Badge>
              <span className="text-sm font-medium">Low deductible</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Deductible ($)</Label>
                <Input
                  value={dLow}
                  onChange={(e) => setDLow(e.target.value)}
                  placeholder="e.g. 250"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Annual premium ($)</Label>
                <Input
                  value={pLow}
                  onChange={(e) => setPLow(e.target.value)}
                  placeholder="e.g. 1600"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* High deductible */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Option B</Badge>
              <span className="text-sm font-medium">High deductible</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Deductible ($)</Label>
                <Input
                  value={dHigh}
                  onChange={(e) => setDHigh(e.target.value)}
                  placeholder="e.g. 1000"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Annual premium ($)</Label>
                <Input
                  value={pHigh}
                  onChange={(e) => setPHigh(e.target.value)}
                  placeholder="e.g. 1400"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {!hasAll && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Enter both deductible / premium pairs above to see the analysis.
          </p>
        )}

        {c4?.status === "invalid" && (
          <p className="text-sm text-destructive">
            {c4.errors[0]?.message ?? "Invalid input."}
          </p>
        )}

        {c4?.status === "ok" && (
          <div className="space-y-4">
            {/* C4 */}
            <div className="divide-y rounded-lg border px-4">
              <StatRow
                label="Annual premium savings (Option B)"
                value={
                  c4.value.annualPremiumDifferenceCents > 0
                    ? formatCents(c4.value.annualPremiumDifferenceCents)
                    : "No savings"
                }
                note="How much less you pay per year with the higher deductible"
                highlight={c4.value.annualPremiumDifferenceCents > 0}
              />
              <StatRow
                label="Extra out-of-pocket if a claim occurs"
                value={formatCents(c4.value.extraOutOfPocketIfClaimCents)}
                note="The additional amount you'd owe if you file a claim"
              />
            </div>

            {/* C5 break-even */}
            {c5?.status === "ok" && (
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <span className="font-medium">Break-even: </span>
                {c5.value.breakEvenYears <= 1 ? (
                  <span>
                    Less than 1 year — the higher deductible pays off quickly if
                    you stay claim-free.
                  </span>
                ) : (
                  <span>
                    ~{c5.value.breakEvenYears} claim-free years to recover the
                    extra out-of-pocket risk.
                  </span>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Arithmetic on your numbers — not a prediction of future claims.
                </p>
              </div>
            )}

            {c5?.status === "no_premium_savings_entered" && (
              <p className="text-sm text-muted-foreground">
                The higher deductible has no lower premium — break-even does
                not apply.
              </p>
            )}

            {/* C6 N-year view */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {nYears}-year cost view (one claim assumed)
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Label className="text-xs text-muted-foreground">Years:</Label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={nYears}
                    onChange={(e) => setNYears(Number(e.target.value))}
                    className="w-24 accent-primary"
                  />
                  <span className="w-4 text-xs tabular-nums">{nYears}</span>
                </div>
              </div>

              {c6?.status === "ok" && (
                <div className="grid grid-cols-2 gap-3">
                  {c6.value.options.map((opt) => (
                    <div
                      key={opt.label}
                      className="rounded-lg border p-3 text-center space-y-1"
                    >
                      <Badge
                        variant={
                          opt.label === "low_deductible"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {opt.label === "low_deductible"
                          ? "Option A"
                          : "Option B"}
                      </Badge>
                      <p className="text-lg font-semibold tabular-nums">
                        {formatCents(opt.nYearCostCents)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCents(opt.annualPremiumCents)}/yr premium +{" "}
                        {formatCents(opt.deductibleCents)} deductible
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Illustrative: assumes exactly one claim ≥ the deductible.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
