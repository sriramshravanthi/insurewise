import type { Provenance } from "./provenance";

// Feeds "Show the math" (docs/CALCULATIONS.md §1).
export interface TraceInput {
  key: string;
  label: string;
  value: unknown;
  provenance: Provenance;
}

export interface TraceStep {
  label: string;
  expression: string;
  result: unknown;
}

export interface Trace {
  formulaId: string;
  engineVersion: string;
  inputs: TraceInput[];
  steps: TraceStep[];
  output: unknown;
  roundingNote?: string;
  notes: string[];
}

// Every displayed number carries one of these (CLAUDE.md rule 3; PRD INT-1).
// UI components accept only a Value<T>, so an unlabeled number cannot render
// (docs/ARCHITECTURE.md §5.2).
export interface Value<T> {
  amount: T;
  provenance: Provenance;
  sourceId?: string;
  traceId?: string;
}
