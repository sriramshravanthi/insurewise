/**
 * Common primitives and helpers used across schemas.
 */
import { z } from "zod";

/** UUID v4 */
export const UuidZ = z.string().uuid();

/** Non-negative integer cents (money) */
export const CentsZ = z.number().int().nonnegative();

/** Optional non-negative integer cents */
export const OptCentsZ = CentsZ.optional().nullable();

/** ISO 8601 date string */
export const DateStringZ = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/** Two-letter US state code */
export const StateCodeZ = z.string().length(2).toUpperCase();

/** 5-digit ZIP */
export const Zip5Z = z.string().regex(/^\d{5}$/, "Expected 5-digit ZIP").nullable().optional();

/** Timestamps */
export const TimestampZ = z.string().datetime({ offset: true });

/** Short free text — max 200 chars */
export const ShortTextZ = z.string().max(200);

/** Label — max 80 chars */
export const LabelZ = z.string().max(80);

/** Notes — max 2000 chars */
export const NotesZ = z.string().max(2000).optional().nullable();

/** Schema version for JSONB structures */
export const SchemaVersionZ = z.number().int().positive();

/** Percentage 0–100 */
export const PctZ = z.number().min(0).max(100);
