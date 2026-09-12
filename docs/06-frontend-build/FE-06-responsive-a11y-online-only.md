# FE-06 — Responsive, Accessible, Online-Only Verification Pass

| | |
|---|---|
| **Phase ID** | `FE-06` |
| **Depends on** | `FE-03`, `FE-04`, `FE-05` |
| **Blocks** | `FE-07` |
| **Reference docs** | `04-design/ux-principles.md §Mobile-first reality check`, `design-system.md §7 Accessibility` |

---

## Goal

Prove — not assume — that every screen built in FE-03/04/05 actually works across the real device spread ManharEvent will be used on: a cheap phone, a tablet, and a laptop browser. And prove that the platform's core promise — **fully online, no physical hardware, ever** — actually holds across the whole codebase, not just in the phases that said so.

This phase produces no new screens. It produces fixes to existing ones.

---

## Deliverables

1. Every route from FE-03, FE-04, FE-05 checked at three widths: 375px (phone), 768px (tablet), 1440px (laptop)
2. Zero horizontal scroll anywhere except deliberately-scrollable rows (e.g. the night-card row) that are supposed to scroll
3. axe-core: zero violations across all three apps' primary routes
4. A written "online-only" audit confirming no hardware/native dependency exists anywhere
5. Keyboard-only navigation verified on the dashboard (the surface where a mouse is assumed but shouldn't be required)
6. `prefers-reduced-motion` honoured everywhere motion exists

---

## Step-by-step

1. **Responsive sweep.** Open every route from `04-design/manharevents-screen-specs.md` §1, §2, §3 at 375px, 768px, and 1440px. Fix: any element with a fixed pixel width wider than its container; any text that overflows its box; any tap target under 44×44px (64×64px on the scanner); any layout that requires horizontal scroll it shouldn't have.
2. **Thumb-zone check (public site, mobile).** Confirm every primary action (Book Passes, Continue to Pay, pass-selector steps) sits in the bottom third of the viewport on a 375px-wide screen, per `ux-principles.md`'s mobile-first section.
3. **Sidebar collapse (dashboard).** Confirm the dashboard sidebar collapses to icon-only between 768px and ~1024px and doesn't overlap content.
4. **Accessibility pass.** Run `@axe-core/playwright` (installed in FE-01) against the home page, an event page, the pass selector, the dashboard overview, and the scanner's main screen. Fix every violation — don't just log it. Recheck contrast specifically on any custom-coloured element (zone badges, chart colours) against the dark surfaces.
5. **Keyboard-only pass.** Using only Tab/Shift+Tab/Enter/Space/Arrow keys, complete: browsing to an event, opening the pass selector, and navigating the dashboard sidebar + a data table's sort/filter/pagination controls. Every interactive element must be reachable with a visible focus ring.
6. **Reduced-motion pass.** With `prefers-reduced-motion: reduce` simulated, confirm all non-essential transitions (hovers, page transitions, the venue ticker) are disabled or reduced to an instant/near-instant state.
7. **"Fully online, no hardware" audit.** Grep the entire codebase for any dependency or comment suggesting: a receipt/label printer, a barcode-gun SDK (as opposed to the phone-camera-based `@zxing/browser`), a POS terminal integration, a native mobile build (React Native, Capacitor, Expo), or a Bluetooth/USB peripheral. There should be none. Write the result — a short pass/fail note — into `docs/06-frontend-build/FE-06-online-only-audit.md` (create it) listing what was checked and confirming the result.
8. **Cross-app data consistency check.** With the mock store shared across apps (per FE-02), confirm an event published in the dashboard (FE-04) actually appears correctly on the public site (FE-03), and a pass "purchased" on the public site appears correctly as a scannable mock pass in the scanner (FE-05) — the three surfaces must visibly agree, because in production they'll share one real database.

---

## Files created

```
docs/06-frontend-build/FE-06-online-only-audit.md   (the audit result — written as part of this phase)
e2e/a11y-frontend.spec.ts                            (axe checks across the three apps' key routes)
```
Plus in-place fixes across `apps/web`, `apps/dashboard`, `apps/scanner`, `packages/ui` — no new screens.

---

## Acceptance criteria

- [ ] No route shows unwanted horizontal scroll at 375px, 768px, or 1440px
- [ ] Every tap target meets the 44px (64px scanner) minimum, verified by inspection or a script
- [ ] `pnpm e2e -- a11y-frontend` reports zero axe violations on the checked routes
- [ ] Every checked flow is completable keyboard-only
- [ ] `FE-06-online-only-audit.md` exists and confirms zero hardware/native dependencies found
- [ ] An event created in the dashboard mock store is visible and bookable on the public site in the same session
- [ ] A pass "bought" on the public site scans correctly (in at least one non-`allowed` state, seeded deliberately, and at least one `allowed` state) on the scanner in the same session

## Definition of Done

Every screen built so far has been opened at three real widths and fixed, not just designed; accessibility is verified with a tool, not assumed; and there's a written, checked confirmation that the "100% online, zero physical hardware" promise is actually true in the code, not just in the docs.

---

## Claude Code prompt

> Follow `docs/06-frontend-build/FE-06-responsive-a11y-online-only.md` step by step against everything built in FE-03, FE-04, and FE-05. This phase fixes existing screens — build nothing new except the axe test file and the online-only audit doc. Check 375px/768px/1440px on every route, run axe-core and fix every violation, verify keyboard-only navigation on the dashboard, and grep the whole codebase for any printer/POS/barcode-gun/native-app dependency, writing the result to `docs/06-frontend-build/FE-06-online-only-audit.md`.
