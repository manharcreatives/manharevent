# FE-09 — Rescope `apps/web`: Remove City Discovery, Add `<FeeBreakdown>`

| | |
|---|---|
| **Phase ID** | `FE-09` |
| **Depends on** | `FE-03` (original public-site build), `FE-08` (fee-line template established on `/pricing`) |
| **Blocks** | `FE-11` |
| **Reference docs** | `02-product/product-spec.md §2, §5.1` (2026-09-12 pivot), `02-product/user-flows.md §1` (2026-09-12 pivot), `04-design/manharevents-screen-specs.md §1.1, §1.4` |

---

## Goal

`apps/web` (built in `FE-03`) was built faithfully against the original, now-superseded multi-organizer marketplace model — it has a city picker, a cross-organizer "Browse by city" row, and an organizer-count trust badge on Home. This phase does **not** rebuild `apps/web` from scratch: it removes the specific cross-tenant discovery surface and adds the fee-transparency requirement, leaving everything else (event landing, pass selector, `<PassCard>`, checkout, my account) intact, since none of that was ever cross-tenant in the first place.

---

## Deliverables

1. Home (`/`) rebuilt per `manharevents-screen-specs.md §1.1`'s current (post-pivot) wireframe: single-organizer brand header, no city/date/category search bar, single-organizer trust strip, "Book Passes" as the one primary action, night-lineup preview instead of a cross-organizer EventCard grid, no "Browse by city" row anywhere
2. `EventCard` component kept but repurposed: only ever renders events belonging to the one organizer whose site this is (relevant for a multi-event organizer) — verify no code path can render another tenant's event on this component
3. Any `/[city]` route, city-filter query param, or cross-tenant search API call in the mock layer removed (not just hidden — actually removed, so no dead code implies a discovery feature still exists)
4. `<FeeBreakdown>` component built per `manharevents-screen-specs.md §1.4` and wired into the checkout order-summary step, visually consistent with the two-line template on `apps/marketing`'s `/pricing` page (`FE-08`)
5. Mock data for platform fee + gateway fee per order, so `<FeeBreakdown>` has real numbers to render, not hardcoded placeholders

---

## Step-by-step

1. **Remove the city-discovery surface.** Delete the `/[city]` route (or equivalent) from `apps/web` if it exists post-`FE-03`. Remove the city/date/category search bar and the "Browse by city" row from Home. Remove any organizer-count trust badge.
2. **Rebuild Home** per the current (struck-through-replaced) wireframe in `manharevents-screen-specs.md §1.1`: organizer's own brand in the header (not "ManharEvents" wordmark — this is the *organizer's* site), full-bleed hero, single "Book Passes" CTA, night-lineup preview row, single-organizer trust strip ("🔒 Secured by Razorpay · Organized by `<name>`"), footer keeps a small "Powered by ManharEvent" credit line (this is the one place the ManharEvent brand still appears on an organizer's site).
3. **Audit `EventCard` usage.** Confirm every place it's rendered pulls only from the current tenant's event list in the mock store (per the `FE-02` tenant-scoping convention) — if the mock store ever had a cross-tenant "all events" query backing the old Home, remove that query function from `packages/mock-data/src/repo.ts` entirely, not just its call site.
4. **Build `<FeeBreakdown>`.** New component in `packages/ui` (so `apps/marketing`'s pricing page and `apps/web`'s checkout can share the exact same visual template — check `FE-08` first and reuse rather than duplicate). Two line items always visible (platform fee, gateway fee) above the total, each with a tap-to-expand one-line explainer, per the copy in `manharevents-screen-specs.md §1.4`.
5. **Wire it into checkout.** In the order-summary step of the existing pass-selector/checkout flow (`FE-03`), replace whatever single "convenience fee" line existed (if any) with `<FeeBreakdown>`. Add platform-fee and gateway-fee fields to the mock order/pricing calculation in `packages/mock-data` so the numbers are real, computed values, not hardcoded strings.
6. **Re-run the FE-06 responsive/a11y checks** on just the screens this phase touched (Home, checkout) — a rescope is still a UI change and inherits the same bar, not a lower one.
7. **Update `manharevents-screen-specs.md` cross-references if anything drifted** during implementation — same "fix the doc in the same PR" rule as everywhere else in this project.

---

## Files created

```
packages/ui/src/components/fee-breakdown.tsx     <FeeBreakdown>
```
Plus in-place changes to `apps/web`'s Home route, checkout order-summary step, and `packages/mock-data`'s repo functions (removals + fee-field additions) — no other new routes.

---

## Acceptance criteria

- [ ] No route, query param, or mock-store function anywhere in `apps/web` implements cross-organizer/cross-tenant discovery — grep confirms it
- [ ] Home shows the organizer's own brand, one primary CTA, and no city/date/category search bar
- [ ] `<FeeBreakdown>` renders on the checkout order summary with two distinct, always-expanded fee lines that sum correctly into the total
- [ ] `<FeeBreakdown>`'s visual template matches `apps/marketing`'s `/pricing` page (same two labels, same order, same tone)
- [ ] Home and checkout re-pass the `FE-06` responsive (375/768/1440) and axe checks
- [ ] `pnpm lint && pnpm typecheck && pnpm build` green across the monorepo

## Definition of Done

`apps/web` no longer contains, anywhere in its code or its mock data, a way to browse or discover events across organizers — and every checkout now shows the platform fee and gateway fee as two honest, separate numbers, matching what a prospective organizer was told on `apps/marketing`'s pricing page before they ever registered.

---

## Claude Code prompt

> Follow `docs/06-frontend-build/FE-09-rescope-public-site.md` step by step. This is a rescope of the existing `apps/web` from `FE-03`, not a rebuild — remove the city/date/category discovery surface (route, search bar, trust badge, any backing mock-store query) per `docs/02-product/product-spec.md §2/§5.1` and `docs/04-design/manharevents-screen-specs.md §1.1`'s current wireframe, rebuild Home to be single-organizer, and add a new shared `<FeeBreakdown>` component (in `packages/ui`, reused from `apps/marketing`'s `/pricing` page built in `FE-08`) wired into checkout per `§1.4`. Re-run the `FE-06` responsive/a11y checks on the screens you touch. End green: `pnpm lint && pnpm typecheck && pnpm build`. Update `docs/PROGRESS.md` honestly.
