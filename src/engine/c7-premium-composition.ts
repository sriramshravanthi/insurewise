/**
 * C7: Premium composition (largest-remainder rounding so shares sum to 100.0%)
 */

import { ENGINE_VERSION, EngineResult } from "./types";

export interface PremiumLine {
  key: string;
  label: string;
  annualCents: number;
}

export interface C7LineShare {
  key: string;
  label: string;
  annualCents: number;
  sharePct: number; // one decimal, 0–100
}

export function c7PremiumComposition(
  lines: PremiumLine[]
): EngineResult<{ shares: C7LineShare[]; totalCents: number }> {
  if (lines.length === 0) {
    return { status: "insufficient_data", missing: ["lines"] };
  }

  for (const line of lines) {
    if (!Number.isFinite(line.annualCents) || line.annualCents < 0) {
      return {
        status: "invalid",
        errors: [
          {
            field: line.key,
            code: "NON_NEGATIVE_FINITE",
            message: `${line.label} must be ≥ 0.`,
          },
        ],
      };
    }
  }

  const totalCents = lines.reduce((s, l) => s + l.annualCents, 0);

  if (totalCents === 0) {
    return { status: "insufficient_data", missing: ["nonZeroTotal"] };
  }

  // Largest-remainder method to 1 decimal place (multiply by 1000 for integer arithmetic)
  const SCALE = 1000; // 1 decimal = ×10, but we work in tenths-of-a-percent
  const TARGET = 1000; // 100.0%

  const rawShares = lines.map((l) => ({
    ...l,
    raw: (l.annualCents / totalCents) * 100,
    floor: Math.floor((l.annualCents / totalCents) * SCALE),
    remainder: ((l.annualCents / totalCents) * SCALE) % 1,
  }));

  const floorSum = rawShares.reduce((s, x) => s + x.floor, 0);
  const remainder = TARGET - floorSum;

  // Sort by remainder descending to assign leftover tenths
  const sorted = [...rawShares]
    .map((x, i) => ({ ...x, origIdx: i }))
    .sort((a, b) => b.remainder - a.remainder);

  const allocated = new Array(lines.length).fill(0);
  sorted.forEach((item, i) => {
    allocated[item.origIdx] = item.floor + (i < remainder ? 1 : 0);
  });

  const shares: C7LineShare[] = lines.map((l, i) => ({
    key: l.key,
    label: l.label,
    annualCents: l.annualCents,
    sharePct: (allocated[i] ?? 0) / 10, // divide by 10 to get one decimal
  }));

  return {
    status: "ok",
    value: { shares, totalCents },
    trace: {
      formulaId: "C7",
      engineVersion: ENGINE_VERSION,
      inputs: lines.map((l) => ({
        key: l.key,
        label: l.label,
        value: l.annualCents,
        provenance: "Entered" as const,
      })),
      steps: [
        { label: "Total", expression: lines.map((l) => l.annualCents).join(" + "), result: totalCents },
        ...shares.map((s) => ({
          label: `${s.label} share`,
          expression: `${s.annualCents} ÷ ${totalCents} × 100`,
          result: `${s.sharePct.toFixed(1)}%`,
        })),
      ],
      output: shares.map((s) => `${s.label}: ${s.sharePct.toFixed(1)}%`).join(", "),
      outputProvenance: "Calculated",
      roundingNote: "Largest-remainder method; displayed values sum to exactly 100.0%.",
    },
  };
}
