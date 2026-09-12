# FE-07 — Final Polish & Backend Handoff Map

| | |
|---|---|
| **Phase ID** | `FE-07` |
| **Depends on** | `FE-06` |
| **Blocks** | The decision of where/how the database connects — everything in `05-execution` from P-02 onward |
| **Reference docs** | `04-design/ux-principles.md`, `04-design/manharevents-screen-specs.md`, `03-architecture/data-model.md` |

---

## Goal

Two things, and this phase ends the frontend-first track:

1. **Make it feel finished** — empty states, loading states, and error states everywhere, per the UX rules, so nothing in a demo ever shows a blank screen or a raw error.
2. **Produce the handoff map** — a single document listing every place mock data is standing in for something real, so the decision "database kaha connect karna hai" can be made deliberately, and executed as a series of clean swaps rather than a rewrite.

---

## Deliverables

1. Every list/table screen has a real `<EmptyState>` (what this is · why it's empty · one action) — no bare "No data" anywhere
2. Every async action (mock "payment", mock "publish event", mock "scan sync") has a real loading state — skeleton or `<LoadingButton>`, never a frozen button
3. Every failure path (mock payment "declined" test case, invalid promo code, OTP mismatch) shows an error in the required shape: what happened · why · what to do now
4. A final visual QA pass against `manharevents-screen-specs.md` §0's reference-mapping table — confirm each of the 10 source patterns actually landed where it was supposed to
5. `docs/06-frontend-build/HANDOFF-TO-BACKEND.md` — the mock→real map

---

## Step-by-step

1. **Empty states.** Walk every list/table in the dashboard (events, orders, refunds, team, vendors) and the public site (search with no results, empty "My Passes" for a new user) — build or fix `<EmptyState>` per `ux-principles.md` rule 6 on each.
2. **Loading states.** Walk every button that triggers an async mock action — confirm it disables, shows a spinner or text swap via `<LoadingButton>`, and cannot be double-clicked into a duplicate mock order/event.
3. **Error states.** Deliberately trigger every failure path that exists in mock form (wrong OTP, invalid/expired promo code, a "declined" test payment path, a scan of a deliberately-corrupted mock QR) and confirm each error follows the what/why/what-now shape from `ux-principles.md` rule 7. Banned phrases ("Something went wrong", raw error codes) must not appear anywhere — grep for them.
4. **One-primary-action audit.** Walk every screen and confirm exactly one `--primary`-styled control exists; demote or restructure any screen with two.
5. **Visual QA against the reference mapping.** Re-open `manharevents-screen-specs.md` §0's table and, screen by screen, confirm the pattern each of the 10 references was meant to inform is actually visible in the build (e.g. the pass-selector's `<ZoneMap>` glow, the `<PassCard>`'s duotone panel, the dashboard's stat-tile-then-chart rhythm). Fix anything that drifted.
6. **Write `HANDOFF-TO-BACKEND.md`.** For every function in `packages/mock-data/src/repo.ts`, list: the function name, which real service replaces it (Supabase table/query, Razorpay call, WhatsApp/SMS send, Supabase Realtime channel), and which `05-execution` phase (P-02 … P-16) owns wiring it for real. This is the literal answer to "database kaha connect karna hai" — a checklist, not a decision made here.
7. **Sanity-check the whole thing once more on a real phone** (not just a resized browser window) — the scanner especially, since it's the surface with the least tolerance for surprises.

---

## Files created

```
docs/06-frontend-build/HANDOFF-TO-BACKEND.md
```
Plus in-place fixes across all three apps for empty/loading/error states — no new routes.

---

## Acceptance criteria

- [ ] Every list/table screen shows a real, on-brand empty state when empty
- [ ] Every async mock action shows a loading state and cannot be double-submitted
- [ ] Every mock failure path shows an error in the what/why/what-now shape; a grep for "Something went wrong" and raw HTTP-style codes returns nothing
- [ ] Every screen has exactly one primary-styled action
- [ ] Each of the 10 reference patterns from `manharevents-screen-specs.md` §0 is visibly present where it was assigned
- [ ] `HANDOFF-TO-BACKEND.md` lists every `repo.ts` function with its real replacement and owning `05-execution` phase
- [ ] The whole demo (public site → dashboard → scanner) runs cleanly on one real phone and one real laptop, back to back

## Definition of Done

ManharEvent can be demoed to an organizer, an investor, or a friend, on any device, start to finish, and it looks and behaves like a finished product — while a clear, honest document exists saying exactly which parts are real UI over fake data, and exactly what replaces each fake part when the database decision is made.

---

## Claude Code prompt

> Follow `docs/06-frontend-build/FE-07-polish-handoff.md` step by step. Fix empty/loading/error states across everything built in FE-03 through FE-06 per `docs/04-design/ux-principles.md` rules 5–7. Do a final pass against `docs/04-design/manharevents-screen-specs.md` §0's reference table and fix any drift. Then write `docs/06-frontend-build/HANDOFF-TO-BACKEND.md`: for every function in `packages/mock-data/src/repo.ts`, name its real replacement (Supabase / Razorpay / WhatsApp / Realtime) and which `05-execution` phase owns it. Do not make the database decision yourself — just produce the map that makes it easy to make later.
