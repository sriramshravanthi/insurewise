import { z } from "zod";

// CLAUDE.md rule 7 (minimize data) / docs/DATA-MODEL.md §7: free-text fields
// must reject SSN-like and card-like patterns server-side. This is a
// heuristic PII guard, not a validator of real SSNs or card numbers.

// "123-45-6789", or a bare 9-digit run not adjacent to other digits.
const SSN_FORMATTED = /\d{3}-\d{2}-\d{4}/;
const SSN_BARE = /(?<!\d)\d{9}(?!\d)/;

// A 13-19 digit run, optionally grouped with single spaces or dashes
// (typical card-number entry), not adjacent to other digits.
const CARD_LIKE = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/;

export function containsSsnLikePattern(text: string): boolean {
  return SSN_FORMATTED.test(text) || SSN_BARE.test(text);
}

export function containsCardLikePattern(text: string): boolean {
  return CARD_LIKE.test(text);
}

export function safeFreeTextSchema(fieldLabel = "This field") {
  return z
    .string()
    .refine((text) => !containsSsnLikePattern(text), {
      message: `${fieldLabel} looks like it contains a Social Security number. Remove it before continuing.`,
    })
    .refine((text) => !containsCardLikePattern(text), {
      message: `${fieldLabel} looks like it contains a card number. Remove it before continuing.`,
    });
}
