import { JurisdictionSchema, type Jurisdiction } from "@/schemas/jurisdiction";

// PRD D1 ("California-first verified content, multi-state architecture")
// and docs/DATA-MODEL.md §3 ("MVP: CA supported for auto and home
// content"). supportedSince mirrors docs/RESEARCH-SOURCES.md's own
// "Registry started: 2026-10-01" — an engineering/project date, not an
// insurance fact, so it needs no source citation.
const RAW_JURISDICTIONS: Jurisdiction[] = [
  { code: "CA", name: "California", supported: true, supportedSince: "2026-10-01" },
];

export const JURISDICTIONS: Jurisdiction[] = RAW_JURISDICTIONS.map((jurisdiction) =>
  JurisdictionSchema.parse(jurisdiction),
);

export function isJurisdictionSupported(code: string): boolean {
  return JURISDICTIONS.some((j) => j.code === code && j.supported);
}

export function getJurisdiction(code: string): Jurisdiction | null {
  return JURISDICTIONS.find((j) => j.code === code) ?? null;
}
