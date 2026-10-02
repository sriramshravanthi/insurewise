import { SourceSchema, type Source } from "@/schemas/source";

// Transcribed verbatim from docs/RESEARCH-SOURCES.md §3 (the "Source
// Registry") — titles, publishers, tiers and URLs only, the citation
// metadata, never an insurance fact itself. This file does not add,
// remove or reinterpret any row; update it only by updating that
// registry first.
const RAW_SOURCES: Source[] = [
  {
    id: "S-001",
    title:
      "Bulletin 2023-1: Increase in Private Passenger Motor Vehicle Financial Responsibility Requirements (SB 1107), dated Jan 30, 2023",
    publisher: "California Dept. of Insurance",
    tier: 1,
    url: "https://www.insurance.ca.gov/0250-insurers/0300-insurers/0200-bulletins/bulletin-notices-commiss-opinion/upload/bulletin-2023-1-re-sb-1107-final-003.pdf",
  },
  {
    id: "S-002",
    title: "Consumer Alert: California's Low Cost Auto Insurance (July 23, 2024)",
    publisher: "CDI",
    tier: 1,
    url: "https://www.insurance.ca.gov/0400-news/0102-alerts/2024/California-s-Low-Cost-Auto-Insurance.cfm",
  },
  {
    id: "S-003",
    title: "Vehicle Code §16500 (text as mirrored)",
    publisher: "California Legislature (mirror site)",
    tier: 1,
    url: "https://california.public.law/codes/vehicle_code_section_16500",
    notes: "Mirror; capture leginfo original.",
  },
  {
    id: "S-004",
    title: "Impact Analysis of Weighting Auto Rating Factors: Executive Summary",
    publisher: "CDI",
    tier: 1,
    url: "https://www.insurance.ca.gov/0400-news/0200-studies-reports/0600-research-studies/auto-policy-studies/executive-summary.cfm",
  },
  {
    id: "S-005",
    title: "Summary of Proposition 103 (CDI Rate Regulation Division; archived copy, ~2003)",
    publisher: "CDI (archived by another agency)",
    tier: 1,
    url: "https://archive.legmt.gov/content/Committees/Administration/Legislative%20Council/2003-4/Subcommittees/Staff%20Reports/appendix_d.pdf",
    notes: "Archived; replace with current CDI/leginfo text.",
  },
  {
    id: "S-006",
    title: "Homeowners Insurance consumer guide (updated 12/19/24)",
    publisher: "CDI",
    tier: 1,
    url: "https://www.insurance.ca.gov/01-consumers/105-type/95-guides/upload/Homeowners-Insurance-Updated-121924.pdf",
  },
  {
    id: "S-007",
    title: "Flood Insurance Resources",
    publisher: "CDI",
    tier: 1,
    url: "https://www.insurance.ca.gov/01-consumers/140-catastrophes/FloodFacts.cfm",
  },
  {
    id: "S-008",
    title:
      "Consumer Alerts: Hurricane Hilary (2023) and Preparing for Winter Storms (2023)",
    publisher: "CDI",
    tier: 1,
    url: "https://www.insurance.ca.gov/0400-news/0102-alerts/2023/Consumer-Alert-on-Hurricane-Hilary.cfm",
    notes: "Dated.",
  },
  {
    id: "S-009",
    title: "Homeowners and Renters one-pager (updated 09/12/23)",
    publisher: "CDI",
    tier: 1,
    url: "https://www.insurance.ca.gov/01-consumers/105-type/95-guides/03-res/upload/Residential-Insurance-Homeowners-and-Renters-One-Pager-Updated-091223.pdf",
  },
];

export const SOURCES: Source[] = RAW_SOURCES.map((source) => SourceSchema.parse(source));

export function getSource(id: string): Source | null {
  return SOURCES.find((source) => source.id === id) ?? null;
}
