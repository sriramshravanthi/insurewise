// Banned phrasing from CLAUDE.md rule 4 (No ranking) and rule 5 (Educate,
// don't advise). PRD INT-6: "A language lint blocks ranking and advice
// phrasing in UI copy and AI output." Shared here so the same policy backs
// both the static UI-copy scan (tests/unit/content/language-lint.test.ts)
// and the future AI output validator (PRD AI-4).
export const RANKING_PHRASES = [
  "best",
  "cheapest",
  "recommended",
  "top pick",
  "winner",
] as const;

export const ADVICE_PHRASES = [
  "you should buy",
  "you should choose",
  "you should get",
  "you should purchase",
  "you should switch",
  "we recommend",
  "i recommend",
] as const;

export interface LanguagePolicyViolation {
  phrase: string;
  index: number;
}

function wordBoundaryPattern(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/ /g, "\\s+");
  return new RegExp(`\\b${pattern}\\b`, "gi");
}

const ALL_BANNED_PHRASES = [...RANKING_PHRASES, ...ADVICE_PHRASES];

export function findLanguagePolicyViolations(
  text: string,
): LanguagePolicyViolation[] {
  const violations: LanguagePolicyViolation[] = [];
  for (const phrase of ALL_BANNED_PHRASES) {
    const pattern = wordBoundaryPattern(phrase);
    for (const match of text.matchAll(pattern)) {
      violations.push({ phrase, index: match.index ?? -1 });
    }
  }
  return violations;
}
