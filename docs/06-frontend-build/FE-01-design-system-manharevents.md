# FE-01 — ManharEvent Design System Implementation

| | |
|---|---|
| **Phase ID** | `FE-01` |
| **Depends on** | `FE-00` |
| **Blocks** | `FE-03`, `FE-04`, `FE-05` |
| **Reference docs** | `04-design/design-system.md`, `04-design/ux-principles.md`, `04-design/manharevents-screen-specs.md §0` |

---

## Goal

Turn `packages/ui` into the themed, accessible component library every screen in later phases consumes — identical in substance to `05-execution/phase-01-design-system.md`, run here first, against no database, so every subsequent UI phase has real components instead of raw HTML.

This phase does **not** re-decide tokens. `design-system.md §2` is locked. This phase implements it.

---

## Deliverables

1. Tailwind v4 preset carrying every token from `design-system.md §2`
2. `ThemeProvider` (dark default, white-label override mechanism) + `BrandOverride`
3. Font loading (Inter Variable, Bricolage Grotesque, JetBrains Mono; Noto Sans Gujarati/Devanagari loaded conditionally)
4. shadcn/ui components installed into `packages/ui`, re-themed to the tokens
5. Shared custom components: `<Money>`, `<StatTile>`, `<EmptyState>`, `<ErrorState>`, `<Field>`, `<PhoneInput>`, `<OtpInput>`, `<LoadingButton>`, `<ConfirmDialog>`, `<DataTable>`, `<LangSwitcher>`, `<CopyableCode>`
6. `<EventCard>`, `<PassCard>`, `<ZoneMap>`, `<NightCard>` shells built to the visual spec in `manharevents-screen-specs.md §1.1, §1.2, §1.3, §1.5` (structure + styling now; real content wiring happens in FE-03)
7. A component gallery route (`apps/dashboard/(dev)/gallery`) rendering everything in both themes at mobile + desktop widths
8. axe-core accessibility harness

---

## Step-by-step

Follow `05-execution/phase-01-design-system.md` steps 1.1 through 1.8 verbatim — they are correct and were written for exactly this component set. The only difference from that file: skip anything that references live tenant data (e.g. `BrandOverride` should accept a **mock** `{ primary, accent }` object for now, not a Supabase-fetched `tenant_branding` row).

Additionally, specific to this track:

9. Build `<EventCard>` to `manharevents-screen-specs.md §1.1` — 4:5 photo, gradient scrim, price-from pill, hover glow.
10. Build `<PassCard>` to `manharevents-screen-specs.md §1.5` — all four states (valid, used-tonight, refunded, transferred-away) as Storybook-style variants in the gallery.
11. Build `<ZoneMap>` as an SVG abstract floor-plan component accepting an array of `{ zoneId, color, label, selected }` — no real venue geometry yet, a believable placeholder shape is fine.
12. Build `<NightCard>` to the "collectible card" treatment described in `manharevents-screen-specs.md §1.2`.
13. Confirm `<ScanResult>` (all 8 states from `design-system.md §6`) renders pixel-correct in the gallery, including the "readable at 1 metre" size check — this component is shared with FE-05 and must exist here first.

---

## Files created

Same tree as `05-execution/phase-01-design-system.md` "Files created", **plus**:
```
packages/ui/src/components/{EventCard,PassCard,ZoneMap,NightCard,ScanResult}.tsx
apps/dashboard/src/app/(dev)/gallery/page.tsx   (extended with the above)
```

---

## Acceptance criteria

All criteria from `05-execution/phase-01-design-system.md` "Acceptance criteria", plus:

- [ ] `<PassCard>` renders all 4 states correctly in the gallery
- [ ] `<ScanResult>` renders all 8 states, each readable at simulated arm's-length (large-type check, not literally tested outdoors yet — that's FE-05/FE-06)
- [ ] `<ZoneMap>` accepts arbitrary zone arrays and colours each region from `--zone-*` tokens, never a hardcoded hex
- [ ] Passing a mock `{ primary: '#...', accent: '#...' }` into `BrandOverride` recolours `<EventCard>`, `<PassCard>`, and every button — confirms white-label plumbing works before any real tenant exists

## Definition of Done

Same bar as `05-execution/phase-01-design-system.md`: gallery reviewed and approved at 375px and 1440px, both themes, and no later FE phase needs to invent a base primitive.

---

## Claude Code prompt

> Read `docs/04-design/design-system.md`, `docs/04-design/ux-principles.md`, `docs/04-design/manharevents-screen-specs.md`, and `docs/05-execution/phase-01-design-system.md`. Execute `docs/06-frontend-build/FE-01-design-system-manharevents.md` — it reuses phase-01's steps almost exactly, with `BrandOverride` taking a mock object instead of a Supabase row, and it adds `EventCard`, `PassCard`, `ZoneMap`, `NightCard`, and `ScanResult` built to the visual spec in `manharevents-screen-specs.md`. Use exact token values — invent nothing. Build the gallery and make the axe test pass before reporting done.
