# CLAUDE.md: InsureWise

Instructions for Claude Code. Read this first in every session, then the doc named for the task.

## What this project is
**InsureWise** is an educational, decision-support web app for U.S. car and home insurance. It is an employer-facing portfolio project built as real software: calculation engine, persistence, auth, AI assistant, tests, deployment. First verified jurisdiction is **California**; the architecture is multi-state.

It is **not** an insurer, agent, broker or quote engine.

## Non-negotiable rules
1. **Never invent insurance facts.** Coverage rules, legal minimums, discounts, rating factors and claims procedures come only from Reference data with a source and V2 verification (see `docs/RESEARCH-SOURCES.md`). If it isn't there, the UI and AI say verified information isn't available.
2. **No rating or quote algorithm.** Premiums are user-entered or clearly labeled Illustrative. Never generate a premium to "look realistic."
3. **Provenance on every number.** Each value is labeled Entered, Calculated, Reference, Illustrative or Sample. The shared `Money`/`Value` components require a `provenance` prop.
4. **No ranking.** Never write "best," "cheapest," "recommended," "top pick," scores or winner badges, in UI copy, code, tests fixtures or AI prompts.
5. **Educate, don't advise.** No "you should buy." Use "worth reviewing" and "questions to ask a licensed professional."
6. **AI explains, it does not decide.** The assistant sees only fact packets built from structured data. All math and rules live in `src/engine`.
7. **Minimize data.** Never collect or store name, address, VIN, license number, policy number, SSN, DOB or payment data. Use ZIP, age bands and bands generally.
8. **Sample data is labeled.** Synthetic households and documents use fictional names and a visible Sample badge.

## Architecture rules
- Modular monolith: Next.js (App Router), strict TypeScript, Tailwind, shadcn/ui, Recharts, React Hook Form + Zod, TanStack Query, Supabase (Postgres, Auth, RLS), Anthropic API behind an adapter, Vitest, Playwright, axe.
- `src/engine` is **pure**: no I/O, no `Date.now()`, no randomness, no imports from UI, DB or AI. Dates and reference data are parameters. Money is integer cents.
- `src/schemas` (Zod) is the single source of truth for shapes; derive TS types from it.
- `src/ai` may call the engine and reference accessors, never the DB directly. All model calls go through one adapter; the model name comes from env config.
- ESLint import rules enforce boundaries. Do not bypass them.
- Guest mode stores data in the browser using the same schemas; signing in migrates it.

## Quality gates (a task is done only when all pass)
- Type-check, lint, unit tests, integration tests, E2E for affected journeys, axe with zero serious/critical issues.
- New engine function → formula documented in `docs/CALCULATIONS.md`, unit + property tests, a worked example.
- New Reference record → source ID, effective date, `verified_at` (CI fails otherwise).
- New UI string or AI prompt → passes the neutrality/advice language lint.
- Every bug fix adds a regression test.

## Accessibility
WCAG 2.2 AA. Keyboard-operable, visible focus, labeled inputs, error summary plus inline errors, color never the only signal, charts have a data-table alternative, respect reduced motion.

## Working style
- Small, reviewable changes; one concern per commit; conventional commit messages.
- Before coding a feature, read its spec in `docs/` and its requirement IDs in `docs/PRD.md`. If the spec is missing or contradicts these rules, stop and ask.
- Prefer boring, explicit code over clever code. No dependencies without a stated reason.
- Never put secrets in code or fixtures; `.env.example` only.
- When unsure whether something is a fact, treat it as unverified.

## Doc map
`docs/PRD.md` requirements · `docs/ARCHITECTURE.md` structure · `docs/CALCULATIONS.md` math · `docs/DATA-MODEL.md` schema/RLS · `docs/RESEARCH-SOURCES.md` facts and sources · (to come) `AI-ARCHITECTURE.md`, `CAR-INSURANCE-SPEC.md`, `HOME-INSURANCE-SPEC.md`, `UI-UX-SPEC.md`, `SECURITY.md`, `TESTING.md`, `ROADMAP.md`.

## Commands
`npm install` · `npm run dev` · `npm run build` · `npm run start` · `npm test` (Vitest unit/property) · `npm run lint` (ESLint, including module-boundary rules) · `npm run type-check` (tsc --noEmit).
Not set up yet, pending the features that need them: `e2e` (Playwright), `seed` (Supabase, pending `supabase/` setup), `eval` (AI evaluation harness).
