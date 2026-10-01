import { z } from "zod";

// PRD INK-2: "Every optional field supports 'I don't know'; the product
// works with partial data." UNKNOWN is a deliberate user choice, distinct
// from a field that simply hasn't been answered yet (undefined).
export const UNKNOWN = "unknown" as const;

export type Unknowable<T> = T | typeof UNKNOWN;

export function isUnknown<T>(
  value: Unknowable<T> | undefined,
): value is typeof UNKNOWN {
  return value === UNKNOWN;
}

export function unknowableSchema<Schema extends z.ZodTypeAny>(
  valueSchema: Schema,
) {
  return z.union([valueSchema, z.literal(UNKNOWN)]);
}

// Not entered and "I don't know" both resolve to no value for the engine
// (which reports insufficient_data rather than guessing; see
// docs/CALCULATIONS.md §1).
export function resolveUnknowable<T>(
  value: Unknowable<T> | undefined,
): T | undefined {
  if (value === undefined || value === UNKNOWN) return undefined;
  return value;
}

// Builds the `missing` list for Result's insufficient_data status
// (src/schemas/result.ts) from a set of optional/unknowable fields.
export function collectMissingFields(
  fields: Record<string, Unknowable<unknown> | undefined>,
): string[] {
  return Object.entries(fields)
    .filter(([, value]) => value === undefined || isUnknown(value))
    .map(([key]) => key);
}
