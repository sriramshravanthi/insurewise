"use client";

/**
 * CompositionChart — C7 premium composition.
 *
 * Takes the included coverages from a policy and their individual premium
 * estimates, then shows a pie/donut chart of how the total splits across
 * coverage types. Because insurers don't break premiums out by coverage,
 * users enter rough estimates — the chart is illustrative.
 */

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { c7PremiumComposition } from "@/engine/c7-premium-composition";
import type { PremiumLine } from "@/engine/c7-premium-composition";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents, parseDollarsToCents } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Palette — distinct, accessible colors for up to 7 slices
// ---------------------------------------------------------------------------

const SLICE_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
];

// ---------------------------------------------------------------------------
// Default coverage lines (user fills in estimated annual amounts)
// ---------------------------------------------------------------------------

interface CoverageLine {
  key: string;
  label: string;
  value: string; // user input, dollar string
}

const DEFAULT_LINES: CoverageLine[] = [
  { key: "BI", label: "Bodily Injury Liability", value: "" },
  { key: "PD", label: "Property Damage Liability", value: "" },
  { key: "MED", label: "Medical Payments", value: "" },
  { key: "UM", label: "Uninsured Motorist", value: "" },
  { key: "COMP", label: "Comprehensive", value: "" },
  { key: "COLL", label: "Collision", value: "" },
];

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayload {
  name: string;
  value: number; // cents
  payload: { sharePct: number; annualCents: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  if (!item) return null;
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-sm shadow">
      <p className="font-medium">{item.name}</p>
      <p className="text-muted-foreground">
        {formatCents(item.payload.annualCents)}/yr &middot;{" "}
        {item.payload.sharePct.toFixed(1)}%
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompositionChart() {
  const [lines, setLines] = useState<CoverageLine[]>(DEFAULT_LINES);

  function updateLine(key: string, value: string) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, value } : l))
    );
  }

  // Build engine input — only lines with valid nonzero values
  const premiumLines: PremiumLine[] = lines
    .map((l) => ({
      key: l.key,
      label: l.label,
      annualCents: parseDollarsToCents(l.value) ?? 0,
    }))
    .filter((l) => l.annualCents > 0);

  const result =
    premiumLines.length > 0 ? c7PremiumComposition(premiumLines) : null;

  const chartData =
    result?.status === "ok"
      ? result.value.shares.map((s) => ({
          name: s.label,
          value: s.annualCents,
          sharePct: s.sharePct,
          annualCents: s.annualCents,
        }))
      : [];

  const totalCents =
    result?.status === "ok" ? result.value.totalCents : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Premium Composition</CardTitle>
        <CardDescription>
          Enter your estimated annual cost for each coverage type to see how
          your premium breaks down. Exact per-coverage amounts aren&apos;t
          printed on most policies — use your best estimate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {lines.map((line) => (
            <div key={line.key} className="space-y-1">
              <Label className="text-xs">
                {line.label}{" "}
                <span className="text-muted-foreground">({line.key})</span>
              </Label>
              <Input
                value={line.value}
                onChange={(e) => updateLine(line.key, e.target.value)}
                placeholder="e.g. 400"
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {chartData.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Enter at least one coverage amount above to see the chart.
          </p>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">
                Total estimated: {formatCents(totalCents)}/yr
              </span>
              <span className="text-xs text-muted-foreground">
                Illustrative only
              </span>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SLICE_COLORS[index % SLICE_COLORS.length] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Table */}
            <div className="rounded-lg border divide-y text-sm">
              {result?.status === "ok" &&
                result.value.shares.map((s, i) => (
                  <div
                    key={s.key}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          SLICE_COLORS[i % SLICE_COLORS.length],
                      }}
                    />
                    <span className="flex-1 truncate">{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatCents(s.annualCents)}/yr
                    </span>
                    <span className="w-14 text-right tabular-nums font-medium">
                      {s.sharePct.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Insurers do not itemize premiums by coverage on most declarations
              pages. These are your own estimates — not a breakdown provided by
              your insurer.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
