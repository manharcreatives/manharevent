# FE-02 — Mock Data & Domain Layer

| | |
|---|---|
| **Phase ID** | `FE-02` |
| **Depends on** | `FE-00` |
| **Blocks** | `FE-03`, `FE-04`, `FE-05` |
| **Reference docs** | `03-architecture/data-model.md`, `02-product/product-spec.md §4` |

---

## Goal

Give every later phase realistic, correctly-typed data to build screens against — **without a database**. This is the single most important phase for making sure today's work is not throwaway: if the shapes here match `data-model.md` exactly, FE-07's handoff to Supabase is a data-source swap, not a rewrite.

---

## Deliverables

1. `packages/domain` — pure TypeScript types mirroring every entity in `data-model.md` (Tenant, Event, EventNight, Venue, Zone, Gate, PassType, PriceTier, AddOn, PromoCode, Order, Payment, Pass, PassHolder, CheckIn, WalletTxn) — zero React/Next/Supabase dependency, exactly as `tech-stack.md §3` requires long-term
2. `packages/mock-data` — a realistic fixture set: one sample tenant ("ManharEvent Ahmedabad" — this is sample content, not the real launch organizer), one 9-night event, 3 zones, 5 pass types, ~20 sample orders/passes, a handful of check-ins
3. A tiny in-memory "repository" layer (`packages/mock-data/src/repo.ts`) with functions shaped like the real queries will be (`getEventBySlug()`, `listPassTypesForZone()`, `createOrder()`, `validatePass()`) — so app code calls a function, not a hardcoded array, from day one
4. Money modelled as integer paise from the start (per `tech-stack.md` convention) — even in mock data, never a float

---

## Step-by-step

1. Read `data-model.md` fully. For every table, create a matching TypeScript `type` or `interface` in `packages/domain/src/entities/`. Field names and types must match exactly (snake_case as stored, or documented camelCase mapping — pick one and note it, since real Supabase-generated types will need to line up in `05-execution` P-02).
2. Write pure functions in `packages/domain/src/logic/` for anything `product-spec.md` describes as business logic that must work identically online and offline later (pass validity shape, price breakdown shape) — stub the real algorithm if needed, but the function signature must be final, because the scanner (FE-05) and checkout (FE-03) both import from here.
3. Build `packages/mock-data/src/fixtures/` — hand-written realistic JSON/TS fixtures: a 9-night Navratri event, VIP/Gold/General zones, Season/Weekend/Daily/Couple pass types with price tiers, a promo code, ~20 orders with passes in different states (valid, used, refunded) so every `<PassCard>` and `<ScanResult>` state has a real example to render.
4. Build `packages/mock-data/src/repo.ts`: async functions (even though they resolve instantly from memory) named exactly as the eventual Supabase-backed functions will be named — e.g. `async function getEventBySlug(slug: string): Promise<Event | null>`. Using `async` now means swapping the body for a Supabase call later touches zero call sites.
5. Add a tiny in-memory mutation store (a module-level array + simple functions) so the dashboard (FE-04) can "create an event" or "issue a comp pass" and see it reflected during the session — reset on server restart, which is fine and expected.
6. Document every function's eventual real backing in a comment, e.g. `// FE-07 handoff: replace body with supabase.from('events').select().eq('slug', slug).single()`.

---

## Files created

```
packages/domain/
├── src/entities/{tenant,event,venue,zone,pass-type,order,pass,checkin,wallet}.ts
├── src/logic/{pass-validity.ts,price-breakdown.ts,capacity.ts}.ts
└── src/index.ts
packages/mock-data/
├── src/fixtures/{tenant,event,zones,pass-types,orders,passes,checkins}.ts
├── src/repo.ts
└── src/index.ts
```

---

## Acceptance criteria

- [ ] Every entity type has a 1:1 field match against `data-model.md` (spot-checked field by field, not assumed)
- [ ] All money fields are `number` (paise, integer) or a branded `Paise` type — never a float, never a rupee-decimal
- [ ] `packages/domain` has zero imports from React, Next.js, or any Supabase package (verified — this is a hard architectural rule carried from `tech-stack.md §3`)
- [ ] `repo.ts` functions are all `async` and named to match their eventual real counterparts
- [ ] Fixture data includes at least one example of every `<PassCard>` state and every `<ScanResult>` verdict
- [ ] `pnpm typecheck` passes with `strict: true`

## Definition of Done

FE-03, FE-04, and FE-05 can each `import { repo } from '@manhar-garba/mock-data'` and build every screen against real-shaped, realistic data — no screen anywhere hardcodes an inline literal object.

---

## Claude Code prompt

> Read `docs/03-architecture/data-model.md` in full and `docs/02-product/product-spec.md` §4. Build FE-02 exactly as scoped in `docs/06-frontend-build/FE-02-mock-data-domain.md`: a dependency-free `packages/domain` with types matching the schema field-for-field, and `packages/mock-data` with realistic fixtures and an async `repo.ts` whose function names and signatures anticipate the real Supabase queries. Comment every repo function with what it becomes in the FE-07 handoff. No floats for money, anywhere.
