import type { Trace } from "./value";

// Every engine function returns one of these — never NaN, never throws for
// an expected case (docs/CALCULATIONS.md §1).
export interface Ok<T> {
  status: "ok";
  value: T;
  trace: Trace;
}

export interface InsufficientData {
  status: "insufficient_data";
  missing: string[];
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export interface Invalid {
  status: "invalid";
  errors: FieldError[];
}

export type Result<T> = Ok<T> | InsufficientData | Invalid;

export function ok<T>(value: T, trace: Trace): Ok<T> {
  return { status: "ok", value, trace };
}

export function insufficientData<T = never>(
  missing: string[],
): Result<T> {
  return { status: "insufficient_data", missing };
}

export function invalid<T = never>(errors: FieldError[]): Result<T> {
  return { status: "invalid", errors };
}
