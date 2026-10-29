# UI-UX-SPEC.md: InsureWise

**Version:** 0.1 · **Status:** Draft · **Depends on:** PRD.md, ARCHITECTURE.md, CALCULATIONS.md

---

## 1. Design Principles

These govern every screen, component and copy string.

| Principle | What it means in practice |
|-----------|--------------------------|
| **Provenance always visible** | Every number carries a badge: Entered / Calculated / Reference / Illustrative / Sample. No number appears without one. |
| **Neutral, never advisory** | No "best," "recommended," "top pick," "you should." Use "worth reviewing" and "questions to ask a licensed professional." |
| **Partial data is fine** | Every optional field has an "I don't know" option. Missing inputs produce `not_enough_information`, never a guess. |
| **Math is showable** | Every Calculated value has a "Show the math" trigger that opens a drawer with inputs, formula and rounding note. |
| **Errors are kind** | Inline errors plus a summary at top. Never just red borders. Always say what to do, not just what's wrong. |
| **Guest is a real user** | Guest mode is the default. Sign-in is optional and only pitched as "save across devices." |
| **Sample is always labeled** | Sample households and documents always show a visible "Sample" banner. Fictional names only. |

---

## 2. Route Structure

```
/                          Marketing / landing
/demo                      One-click sample household (DEMO-1)
/car                       Car insurance hub
  /car/new                 Start car wizard (J1)
  /car/[id]                Car policy dashboard
  /car/[id]/edit           Edit car profile
  /car/[id]/scenarios      Deductible / what-if scenarios
  /car/[id]/compare        Policy comparison (up to 3 policies)
/home                      Home insurance hub
  /home/new                Start home wizard (J2)
  /home/[id]               Home policy dashboard
  /home/[id]/edit          Edit home profile
  /home/[id]/scenarios     Deductible / what-if scenarios
  /home/[id]/compare       Policy comparison
/dashboard                 Combined household view (CMB-1)
/assistant                 AI assistant (standalone)
/education                 Education hub
  /education/glossary      Searchable glossary (EDU-1)
  /education/why-prices    Why prices differ (EDU-2)
  /education/claims        Claims guide — 7 scenarios (EDU-3)
/sources                   Methodology + source registry (EDU-6)
/account                   Sign-in, data export, delete-my-data
```

All `/car/[id]` and `/home/[id]` routes work in guest mode (data in IndexedDB). IDs are local UUIDs for guests; server UUIDs once signed in.

---

## 3. User Journeys

Referenced in PRD release criteria (J1–J8). All must be green in E2E before MVP ships.

| ID | Journey | Entry point | Success state |
|----|---------|-------------|---------------|
| J1 | First-time car profile | `/car/new` | Dashboard shows coverage breakdown, at least one review item if applicable |
| J2 | First-time home profile | `/home/new` | Dashboard shows A–F breakdown and checklist |
| J3 | Deductible what-if | Car or home dashboard → Scenarios | Simulator shows out-of-pocket, annual difference, break-even; all labeled |
| J4 | Policy comparison | Dashboard → Compare | Comparison table with differences highlighted, no ranking |
| J5 | Bundle estimate | Dashboard → Bundle | Combined annual cost with comparability checks |
| J6 | Ask the assistant | Any page → Assistant | Assistant answers using only fact packets, cites fact IDs |
| J7 | One-click demo | `/demo` | Sample household loads in under 5 seconds, Sample banner visible |
| J8 | Sign-in and data migration | Guest → Sign in | All local data migrates; user confirms; local data cleared |

---

## 4. Page Layouts

### 4.1 Marketing / Landing (`/`)
- Hero: what InsureWise is and is not (educational tool, not insurer/broker)
- Two CTAs: "Start with your car" and "Start with your home"
- Third CTA: "Try sample household" (→ `/demo`)
- Brief explainer: how it works (enter → see breakdown → explore scenarios → ask questions)
- Persistent disclosure footer on every page

### 4.2 Wizard Layout (shared by car and home)
- Left sidebar on desktop: step progress (e.g., Vehicle → Drivers → Coverage → Premium → Review)
- Mobile: step indicator at top (dots or "Step 2 of 5")
- Main area: one focused form section per step
- Footer: Back / Save & Continue
- "I don't know" toggle on every optional field
- Auto-save indicator: "Saved" / "Saving…" / "Not saved — sign in to keep this"

### 4.3 Policy Dashboard Layout
- Top: policy label, insurer label (if entered), term, provenance badges
- Section: Premium summary (annualized, line-level if entered), Composition chart (C7) if line-level data exists
- Section: Coverage breakdown (card per coverage, plain-language definition, limit + deductible)
- Section: Review items (gap findings from GAP-1)
- Section: Scenarios shortcut
- Section: Compare shortcut
- Sidebar or bottom: Assistant entry point

### 4.4 Comparison Layout (CMP)
- Desktop: sticky header row + scrollable table, one column per policy
- Mobile: card stack, one card per policy, swipe or tab to switch
- Comparability warnings banner at top (orange, not red — these are not errors)
- No score column, no winner column, no "best value" row
- User-chosen sort: by premium, by limit, by deductible (labeled "Sorted by: [field]")

### 4.5 Combined Dashboard (`/dashboard`)
- Combined annual cost (C2) — large, Calculated badge
- Policy cards: one per saved policy
- Coverage matrix: coverages across car and home side by side
- Review items across all policies
- Scenarios summary
- Checklist progress
- Assistant entry

### 4.6 Education Pages
- Server-rendered, ISR-cached, no auth required
- Glossary: search input, alphabetical index, term cards with short + long definition and source
- Claims guide: 7 tabbed scenarios, global "depends on your policy" disclaimer on every tab
- Sources: table of all S-### records with tier, publisher, URL, retrieval date

---

## 5. Component Inventory

### 5.1 Provenance Badge
```
<ProvenanceBadge type="Entered | Calculated | Reference | Illustrative | Sample" />
```
- Renders as a small colored chip next to the value
- Color: Entered = blue, Calculated = purple, Reference = green, Illustrative = amber, Sample = grey
- Screen reader text: "This value is [type]"
- Color is never the only signal — each type has a distinct label

### 5.2 Value Component
```
<Value amount={cents} provenance={...} onShowMath?={handler} currency="USD" />
```
- Requires provenance — TypeScript will not compile without it
- If `onShowMath` provided and provenance = Calculated: renders "Show the math" button
- Formats as dollars with cents suppressed if .00, or explicit if non-zero

### 5.3 Show the Math Drawer
- Opens on "Show the math" click
- Shows: Formula ID, Engine version, Input table (key / label / value / provenance), Steps (label / expression / result), Final output, Rounding note
- Keyboard accessible (focus trap, Esc to close)
- Not available for Entered or Illustrative values (those have no formula)

### 5.4 Coverage Card
- Coverage name (from catalog)
- Status: Included / Not entered / Not applicable
- Limit + deductible (with provenance badges)
- Plain-language definition (collapsible)
- Source badge if definition is Reference

### 5.5 Comparability Warning Banner
- Orange background, icon, text
- Lists each warning type: DIFFERENT_LIMIT, DIFFERENT_DEDUCTIBLE, COVERAGE_ONLY_IN_ONE, etc.
- Each warning links to the differing rows in the table
- Dismissible per session but re-appears if data changes

### 5.6 Review Item Card
- Severity: Info / Warning (no "Critical" — we don't rank risk)
- Title (from message template)
- "Why this appears": inputs used
- "What to explore": questions for a professional
- Source badge (rule source)
- "Not enough information" state: gray, explains which field is missing

### 5.7 Wizard Step
- Step label + optional helper text
- Fields with inline validation
- "I don't know" toggle: grays out the field and sets value to `null` / band to `unknown`
- Error summary above the form on submit attempt

### 5.8 Sample Banner
```
<SampleBanner name="The Rivera Household (Sample)" />
```
- Fixed at top of any page showing sample data
- Yellow background, "Sample" label, fictional name
- Cannot be dismissed

### 5.9 Stale Data Notice
- Shown next to any Reference value whose `verified_at` is > 12 months ago
- "Last verified [date] — check for updates"
- Links to `/sources` entry

### 5.10 Assistant Chat
- Drawer on desktop (slides in from right), full-screen modal on mobile
- Message input at bottom
- Streamed responses
- Each assistant message shows: text, cited fact IDs as chips (click to see source), a "Show source" link
- Rate limit message: "You've asked a lot today — try again in [time]"
- Fallback if AI down: "The assistant isn't available right now. See the [glossary] for definitions."

---

## 6. Navigation

### 6.1 Top Navigation Bar
- Logo / "InsureWise" (links to `/`)
- Links: Car | Home | Dashboard | Education
- Guest: "Sign in to save" (subtle, not a CTA)
- Signed in: Account icon with menu (Export data / Delete account / Sign out)
- Mobile: hamburger menu

### 6.2 Persistent Disclosure Footer
Appears on every page:
> "InsureWise is an educational tool, not an insurer, agent or broker. Scenario premiums are not quotes. Verified information is shown with a source and date."

### 6.3 Breadcrumb
On wizard and dashboard pages: Home > Car > [Policy label] > Compare

---

## 7. Forms and Validation

- Library: React Hook Form + Zod (client) + Zod (server route handlers)
- Validation fires on blur for each field, and on submit for all
- Error messages: inline below the field + summary at top of form on submit
- Banded fields (age, mileage, roof age): rendered as segmented controls or select, never free text
- ZIP: free text, 5 digits, validated format only — no geolocation or address lookup
- Free text fields: character limit displayed; SSN-like and card-like patterns rejected client-side and server-side with a neutral message ("This field doesn't accept that format")
- Money entry: formatted input, cents optional, stored as integer cents

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Key changes |
|------------|-------|-------------|
| Mobile | 320–767 px | Single column, card stack comparison, bottom nav, full-screen modals |
| Tablet | 768–1023 px | Two-column wizard, comparison as cards |
| Desktop | 1024–1919 px | Sidebar wizard, full comparison table, drawer assistant |
| Wide | 1920 px+ | Max-width container centered (1280 px), no wider |

---

## 9. Accessibility (WCAG 2.2 AA)

- All interactive elements keyboard-operable with visible focus ring
- Focus order follows reading order; modals and drawers trap focus
- All images have alt text; decorative images have `alt=""`
- Color is never the only signal (provenance badges use label + color)
- Charts (Recharts) have a data-table alternative below each chart, visually hidden but accessible
- Forms: each input has a `<label>`; errors linked via `aria-describedby`
- Error summary has `role="alert"` and receives focus on submit
- Reduced motion: animations respect `prefers-reduced-motion`
- axe: zero serious or critical issues on all routes and all states (loading, error, empty, populated)

---

## 10. Performance Targets

| Metric | Target | Scope |
|--------|--------|-------|
| Lighthouse Performance | ≥ 90 | Marketing and education pages |
| Engine recalculation | < 50 ms | Scenario edits in browser |
| LCP | < 2.5 s | Marketing page, mobile |
| CLS | < 0.1 | All pages |
| First load JS | < 200 KB gzipped | App shell |

Education and methodology pages: server-rendered, ISR-cached, no client JS required for reading.

---

## 11. Empty and Error States

| State | UI behavior |
|-------|-------------|
| No policies entered | Dashboard shows "Add your car policy" and "Add your home policy" cards |
| Engine returns `insufficient_data` | Show which fields are missing, never a number |
| Engine returns `invalid` | Show field errors, block submission |
| AI unavailable | Fallback message + link to glossary; rest of app unaffected |
| DB unavailable | Guest mode continues; save actions show "Not saved yet" |
| Reference data missing for state | "Verified information isn't available yet for [state]" |
| Stale reference data | "Last verified [date]" notice |
| Rate limit hit | "Try again in [X minutes]" |

---

## 12. Copy Guidelines

- Second person ("your policy," "your deductible")
- Plain language — no jargon without a glossary link
- Banned words in UI and AI output (enforced by lint): best, cheapest, recommended, top pick, winner, score, rank, you should, we recommend
- Permitted hedges: "worth reviewing," "questions to ask," "may," "typically," "usually"
- Disclaimers are always present but not repeated on every field — once per section is enough
- All Reference copy ties to a fact ID; copy without a fact ID is not shipped

---

## 13. Open Items (to resolve before Phase 1 UI)

1. Final visual design direction and logo (color palette, typography, illustration style)
2. Whether the assistant appears as a persistent drawer or a dedicated page
3. Mobile comparison UX — card swipe vs. sticky-header scroll
4. Onboarding flow for first-time users (tooltip tour vs. inline hints vs. none)
5. Whether to show a progress/completion percentage on the dashboard
