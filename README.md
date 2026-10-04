# InsureWise

An educational, decision-support web app for U.S. car and home insurance.
InsureWise is **not** an insurer, agent, broker or quote engine. See
[`CLAUDE.md`](./CLAUDE.md) for the non-negotiable product rules and
[`docs/`](./docs) for requirements, architecture, calculations and data model.

**Status:** all 8 MVP roadmap groups are implemented — car/home profiles,
scenario and comparison tools, review findings, guest persistence,
authentication, a grounded AI assistant, and the reference-content
infrastructure. The app is functionally complete; what's still open is
**content and deployment infrastructure**, not features:

- No real Supabase or Anthropic project is connected (`.env.example` has
  placeholders only) — auth, persistence-sync and the AI assistant degrade
  gracefully to a "not configured" state without them.
- [`docs/RESEARCH-SOURCES.md`](./docs/RESEARCH-SOURCES.md) has no fact
  verified to V2 yet, so the coverage catalog, glossary, rating factors and
  risk-checklist content all ship empty on purpose — the accessors and UI
  are built and tested, waiting on real sourced content.
- Supabase migrations/RLS SQL are deferred to the documented Phase 7.
- Playwright (e2e) and axe (accessibility) are not wired up yet.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Vitest ·
Supabase (Postgres, Auth, RLS) · Anthropic API (behind an adapter)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint, including the module-boundary rules |
| `npm run type-check` | TypeScript, no emit |
| `npm test` | Run unit/property tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

A seed of the AI evaluation harness runs as part of `npm test`
(`tests/ai-evals/`, scripted against a fake model provider — no live
Anthropic account needed). End-to-end (Playwright) and accessibility (axe)
checks are not wired up yet.

## What's implemented

- **Car & Home profiles** (`/car`, `/home`) — vehicle/driver/property
  intake, coverage breakdown, line-level premium composition, home coverage
  ratios, all with provenance labels (Entered/Calculated/Illustrative).
- **Scenarios** (`/scenarios`) — deductible trade-off, break-even, and
  N-year cost views.
- **Compare** (`/compare`) — baseline vs. up to three policies, row-level
  differences, comparability warnings, no ranking.
- **Review** (`/review`) — rule-driven review findings, "questions to ask a
  professional," and an AI assistant grounded in that computed data.
- **Guest persistence** — IndexedDB-backed, same Zod schemas as the server
  model; works fully without signing in.
- **Authentication** (`/sign-in`) — Supabase Auth adapter (magic link,
  Google) with guest-to-account migration, gracefully inert without a live
  project.
- **AI Assistant** (`/api/v1/assistant`) — fact-packet grounding, read-only
  lookup tools, output validation (schema/citation/numeric-grounding/
  language-policy), rate limiting; gracefully inert without a live
  Anthropic account.
- **Reference layer** (`src/reference`) — sourced citation registry,
  jurisdiction support, and a V2-only verification gate for coverage
  definitions, glossary terms, rating factors and checklist items.

## Repository layout

See `docs/ARCHITECTURE.md` §11 for the authoritative layout and §4 for the
module boundaries (enforced by the ESLint config). In short:

- `src/schemas` — Zod schemas and derived types (the dependency root)
- `src/engine` — pure calculation and rules engine, no I/O
- `src/reference` — typed accessors over verified reference data (ships
  empty content arrays until `docs/RESEARCH-SOURCES.md` reaches V2)
- `src/providers` — `PolicyProvider` implementations (manual entry, sample)
- `src/ai` — fact-packet builder, prompts, model adapter, output validator
- `src/lib` — Supabase/auth clients, guest storage, rate limiting
- `src/features` — feature UI and hooks
- `src/components` — design-system primitives (shadcn/ui lives in `components/ui`)
- `docs/` — product and engineering documentation
- `reference-data/` — the offline verified-fact pipeline (workbook → exports → scripts)
- `supabase/` — migrations, seed data, RLS policies (empty — deferred to Phase 7)
- `tests/` — unit, property, ai-evals (e2e and a11y not set up yet)

## Documentation map

- [`CLAUDE.md`](./CLAUDE.md) — non-negotiable rules and working agreements
- [`docs/PRD.md`](./docs/PRD.md) — requirements
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — structure
- [`docs/CALCULATIONS.md`](./docs/CALCULATIONS.md) — engine formulas
- [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) — schema and RLS
- [`docs/RESEARCH-SOURCES.md`](./docs/RESEARCH-SOURCES.md) — verified facts and sources
