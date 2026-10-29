# ARCHITECTURE.md: InsureWise

**Version:** 0.1 · **Style:** modular monolith, deployed serverless (Vercel + Supabase)

## 1. Architectural Goals
1. **Correctness you can show:** all math in a pure, heavily tested engine.
2. **Truthfulness by construction:** provenance travels with every value; reference facts are data, not prose.
3. **AI contained:** the model can only read verified, structured facts.
4. **Scalable to more states and insurers** without rewrites: reference data is versioned and jurisdiction-keyed; policies enter through a provider interface.
5. **Simple to operate** as a solo/portfolio project: one deployable, managed services, no custom infrastructure.

## 2. System Context

```
 Browser (guest or signed in)
   │  React UI (Next.js App Router)
   │    ├─ local store (IndexedDB) ← guest data, same Zod schemas
   │    └─ calls the engine directly in the client for instant what-if math
   ▼
 Next.js server (Vercel)
   ├─ Route Handlers  /api/v1/*   (Zod-validated, problem+json errors)
   ├─ Server Components (education, reference pages, ISR/CDN cacheable)
   ├─ AI module ──► Anthropic API (via adapter)
   └─ Supabase client
        ▼
 Supabase (Postgres + Auth + RLS)
   ├─ user tables (RLS: owner only)
   └─ reference tables (read-only, versioned, cited)

 Reference pipeline (offline, in repo):
   verified workbook → CSV/JSON export → Zod validation (CI) → seed/migration
```

## 3. Core Data Flow (the rule that governs everything)

```
User input
  → Zod validation (normalized, banded)
  → Structured application data
  → Engine (rules + calculations)   ← Reference data (jurisdiction, versioned, cited)
  → Verified results with provenance + calculation traces
  → UI renders values with badges      OR      AI fact packet → explanation
```

Nothing flows to the AI that did not pass through this path. The AI cannot write to application data.

## 4. Modules and Boundaries

| Module | Responsibility | May import | Must not import |
|--------|----------------|------------|-----------------|
| `schemas` | Zod schemas, derived types, enums, provenance types | none | everything else |
| `engine` | Calculations C1–C15, review rules, comparison diff, comparability checks, trace generation | `schemas` | UI, DB, AI, network, time/random |
| `reference` | Typed accessors for jurisdiction rules, glossary, coverage catalog, claims content; version/effective-date resolution | `schemas` | UI, AI |
| `providers` | `PolicyProvider` interface; `ManualEntryProvider`, `SamplePolicyProvider` | `schemas` | UI |
| `ai` | Fact-packet builder, tool definitions, prompts, guards, validators, model adapter, eval fixtures | `schemas`, `engine`, `reference` | DB, UI |
| `lib` | Supabase clients, auth helpers, rate limiting, logging, error types | `schemas` | `engine` internals |
| `features/*` | Feature UI and hooks (car, home, compare, dashboard, claims, documents, assistant) | all above except `ai` internals | other features' internals |
| `components` | Design-system primitives and domain components (`ProvenanceBadge`, `Value`, `ComparisonTable`) | `schemas` | `lib`, DB |

Boundaries are enforced with ESLint import restrictions and verified in CI. The engine is written so it can be extracted into a standalone package without changes.

## 5. Key Design Decisions

**5.1 Pure engine, shared by client and server.** The same functions power instant what-if edits in the browser and server-side saved results. Each result is a `Result<T>`: `ok` (value + trace), `insufficient_data` (missing fields listed), or `invalid` (field errors). Never `NaN`, never thrown exceptions for expected cases.

**5.2 Provenance as a type.** A `Value<T>` carries `{amount, provenance, sourceId?, traceId?}`. UI components accept only `Value`, so an unlabeled number cannot compile or render.

**5.3 Reference data as versioned, jurisdiction-keyed records.** Each rule has `effective_from`, `effective_to`, `applies_basis` (for example "issued or renewed on or after"), and may declare **scheduled future changes** (the current California research found one scheduled for 2035). Resolution takes `(jurisdiction, topic, asOfDate, policyDates)` as parameters, with no hidden clocks.

**5.4 Guest-first persistence.** Guest data lives in IndexedDB under a schema version. On sign-in, a migration step validates local data with current Zod schemas, uploads it into a household, and clears local data only after server confirmation. Conflicts are surfaced to the user rather than silently merged.

**5.5 Policy provider seam.** All policy data, whether typed, sample, or in future from an insurer, is mapped into one normalized model with per-field provenance. Adding a real provider later means writing an adapter plus a compliance review, not changing the engine or UI.

**5.6 AI behind a thin adapter.** One module calls the model; model name, limits and timeouts come from config. Static policy text and reference excerpts are cached by the provider where supported. The rest of the app depends only on `explain(factPacket, question)`.

**5.7 No ORM in MVP.** Supabase CLI migrations plus generated TypeScript types. Reconsider if query complexity grows.

**5.8 Server rendering where it helps.** Education, glossary, claims guide and methodology are server-rendered and cacheable. App screens are client-interactive.

## 6. API Style
REST-like JSON under `/api/v1`; Zod input/output validation; error format RFC 7807 problem details with `code` and optional `fieldErrors`; idempotency keys on scenario saves; per-user and per-IP rate limits on write and assistant endpoints; no business logic in handlers beyond orchestration, since handlers call engine and reference modules.

## 7. Security Architecture (summary; detail in SECURITY.md)
Row-level security on all user tables; no sensitive identifiers collected; strict CSP and security headers; secrets server-side only; prompt-injection hardening (user and document text treated as untrusted data); AI endpoints rate-limited and budget-capped; logs redact content.

## 8. Failure Modes and Degradation
| Failure | Behavior |
|---------|----------|
| AI provider down or validation fails twice | Assistant shows a safe fallback and links to glossary/related pages; the rest of the app is unaffected |
| Database unavailable | Guest mode and engine continue; save actions queue locally with a visible "not saved yet" state |
| Reference data missing for a jurisdiction | Feature shows "verified information isn't available yet"; calculations still run |
| Stale reference data | Visible "last verified" notice |
| Rate limit | Clear message with retry time |

## 9. Observability
Sentry for errors (PII-scrubbed); Vercel Analytics (privacy-friendly) for page performance; structured server logs with request IDs; AI evaluation results stored per run for trend viewing; `/api/health` for uptime checks.

## 10. Environments and Delivery
Local (Supabase local stack) → Preview (per pull request, isolated Supabase branch or project) → Production. GitHub Actions: lint, type-check, unit/property tests, reference-data validation, integration tests with RLS checks, Playwright E2E, axe, Lighthouse CI, AI evals (on prompt or reference changes and nightly), dependency and secret scans. Vercel deploys previews per PR; production deploys on merge to `main` after required checks.

## 11. Repository Layout
```
docs/  reference-data/(workbook, exports, scripts)  supabase/(migrations, seed, policies)
src/(app, engine, schemas, reference, providers, ai, components, features, lib, content)
tests/(unit, property, integration, e2e, a11y, ai-evals)  .github/workflows
```

## 12. Scaling Path (documented, not built)
Add states by adding verified reference data and rule versions; add insurers via providers; move the engine to a package/worker if needed; add pgvector only when the document explainer handles real documents; add an admin console when reference editing outgrows the pipeline.

## 13. Architecture Decision Records (to write in `docs/decisions/`)
ADR-001 Modular monolith · ADR-002 Pure engine and `Result` type · ADR-003 Provenance types · ADR-004 Versioned jurisdiction reference data · ADR-005 Guest-first local persistence · ADR-006 No rating algorithm · ADR-007 AI via fact packets and tools · ADR-008 Supabase over alternatives · ADR-009 No ORM in MVP · ADR-010 Source-tier policy.
