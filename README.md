# InsureWise

An educational, decision-support web app for U.S. car and home insurance.
InsureWise is **not** an insurer, agent, broker or quote engine. See
[`CLAUDE.md`](./CLAUDE.md) for the non-negotiable product rules and
[`docs/`](./docs) for requirements, architecture, calculations and data model.

Status: Phase 1 (project scaffolding). No insurance features are implemented
yet.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Vitest ·
Supabase (Postgres, Auth, RLS) · Anthropic API (planned)

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

End-to-end (Playwright), accessibility (axe) and AI-evaluation checks are not
set up yet; they will be added alongside the first features that need them.

## Repository layout

See `docs/ARCHITECTURE.md` §11 for the authoritative layout and §4 for the
module boundaries (enforced by the ESLint config). In short:

- `src/schemas` — Zod schemas and derived types (the dependency root)
- `src/engine` — pure calculation and rules engine, no I/O
- `src/reference` — typed accessors over verified reference data
- `src/providers` — `PolicyProvider` implementations
- `src/ai` — fact-packet builder, prompts, model adapter
- `src/lib` — Supabase clients, auth, rate limiting, logging
- `src/features` — feature UI and hooks
- `src/components` — design-system primitives (shadcn/ui lives in `components/ui`)
- `docs/` — product and engineering documentation
- `reference-data/` — the offline verified-fact pipeline (workbook → exports → scripts)
- `supabase/` — migrations, seed data, RLS policies
- `tests/` — unit, property, integration, e2e, a11y, ai-evals

## Documentation map

- [`CLAUDE.md`](./CLAUDE.md) — non-negotiable rules and working agreements
- [`docs/PRD.md`](./docs/PRD.md) — requirements
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — structure
- [`docs/CALCULATIONS.md`](./docs/CALCULATIONS.md) — engine formulas
- [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) — schema and RLS
- [`docs/RESEARCH-SOURCES.md`](./docs/RESEARCH-SOURCES.md) — verified facts and sources
