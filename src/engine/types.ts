/**
 * Core types for the InsureWise calculation engine.
 * Pure TypeScript — no I/O, no imports from UI/DB/AI.
 */

export const ENGINE_VERSION = "0.1.0";

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export type Provenance =
  | "Entered"
  | "Calculated"
  | "Reference"
  | "Illustrative"
  | "Sample";

/** Weakest provenance wins: Illustrative < Reference < Entered = Calculated */
export function weakerProvenance(a: Provenance, b: Provenance): Provenance {
  const rank: Record<Provenance, number> = {
    Illustrative: 0,
    Reference: 1,
    Sample: 1,
    Entered: 2,
    Calculated: 2,
  };
  return (rank[a] ?? 0) <= (rank[b] ?? 0) ? a : b;
}

export function provenanceOfInputs(
  inputs: readonly ProvenancedInput[]
): Provenance {
  return inputs.reduce<Provenance>(
    (acc, inp) => weakerProvenance(acc, inp.provenance),
    "Calculated"
  );
}

// ---------------------------------------------------------------------------
// Trace
// ---------------------------------------------------------------------------

export interface ProvenancedInput {
  key: string;
  label: string;
  value: number | string | boolean | null;
  provenance: Provenance;
}

export interface TraceStep {
  label: string;
  expression: string;
  result: number | string;
}

export interface CalculationTrace {
  formulaId: string;
  engineVersion: string;
  inputs: ProvenancedInput[];
  steps: TraceStep[];
  output: number | string;
  outputProvenance: Provenance;
  roundingNote?: string;
  notes?: string[];
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type EngineResult<T> =
  | { status: "ok"; value: T; trace: CalculationTrace }
  | { status: "insufficient_data"; missing: string[] }
  | { status: "invalid"; errors: FieldError[] };

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Money helpers (integer cents)
// ---------------------------------------------------------------------------

/** Round half-up to nearest cent. Only for NAMED outputs, never intermediates. */
export function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5);
}

/** Format cents as a display string e.g. 180000 → "$1,800.00" */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}
