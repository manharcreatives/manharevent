# Phase 01 — Design System & Component Library

| | |
|---|---|
| **Phase ID** | `P-01` |
| **Depends on** | `P-00` |
| **Blocks** | Every UI phase (`P-04` onward) |
| **Estimated effort** | 14–20 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `04-design/design-system.md`, `04-design/ux-principles.md` |

---

## Goal

Turn `packages/ui` into a themed, documented, accessible component library that all three apps consume — including the white-label colour-override mechanism and full dark/light support. Build the shared components that later phases assume exist.

---

## Deliverables

1. Tailwind v4 preset carrying every token from the design system doc
2. shadcn/ui components installed into `packages/ui` and re-themed
3. Theme provider with dark default + white-label runtime override
4. Font loading strategy per locale
5. Custom shared components (the surface-agnostic ones)
6. A component gallery route for visual review
7. axe-core accessibility test harness

---

## Step-by-step

### 1.1 Tokens
1. Write `packages/config/tailwind/preset.ts` mapping **every** CSS variable from `design-system.md §2` into Tailwind v4 `@theme` tokens.
2. Create `packages/ui/src/styles/globals.css` containing the `:root` and `:root[data-theme="light"]` blocks verbatim from the design doc.
3. Add the elevation, radius, and motion tokens.
4. Import `globals.css` in all three apps' root layouts.

### 1.2 Theme provider
5. Build `packages/ui/src/theme/ThemeProvider.tsx`:
   - Dark is default; `data-theme` on `<html>`; respects `prefers-color-scheme` only when the user has made no explicit choice.
   - Persist choice in a cookie (SSR-readable) — **not** localStorage, so first paint is correct.
   - Zero flash of wrong theme: inline a tiny blocking script in `<head>`.
6. Build `packages/ui/src/theme/BrandOverride.tsx`: a **server component** that takes `{ primary, accent }` from `tenant_branding` and emits a `<style>` tag redefining `--primary` / `--accent`. This is the entire white-label mechanism.

### 1.3 Fonts
7. Configure `next/font/local` or `next/font/google` for Inter Variable, Bricolage Grotesque, JetBrains Mono.
8. Conditionally load Noto Sans Gujarati / Devanagari **only** when the active locale needs it. Never ship all three scripts to every visitor.
9. Set `font-variant-numeric: tabular-nums` globally on `.tabular`, and apply it to every money and count component.

### 1.4 shadcn components
10. Configure `components.json` to install into `packages/ui/src/components/ui`.
11. Install: `button input label textarea select checkbox radio-group switch slider tabs dialog sheet drawer dropdown-menu popover tooltip command table badge avatar separator skeleton alert progress accordion calendar input-otp sonner form scroll-area pagination`.
12. Re-theme each to the token set — replace every hardcoded colour with a variable.
13. Extend `button` variants to: `primary | secondary | ghost | link | destructive | outline`, sizes `sm | default | lg | xl` (xl = 64px tall, for the scanner).
14. Ensure every component's focus ring uses `--ring` at 2px with 2px offset.

### 1.5 Shared custom components
Build these in `packages/ui` (used by more than one app):

15. `<Money value={Paise} />` — formats to `₹1,234`, tabular, locale-aware
16. `<StatTile label value delta trend />`
17. `<EmptyState icon title description action />` — enforces UX rule 6
18. `<ErrorState what why action />` — enforces UX rule 7
19. `<Field />` — label + control + hint + error, wired to react-hook-form, `aria-describedby` correct
20. `<PhoneInput />` — `+91` prefixed, 10-digit, numeric keypad on mobile
21. `<OtpInput />` — 6 digits, uses shadcn `input-otp`, keeps the `otp-column-up/down` animation from the audit
22. `<LoadingButton />` — disabled + spinner + text swap, never allows double submit
23. `<ConfirmDialog />` — single confirm pattern for the whole product
24. `<DataTable />` — TanStack Table wrapper with URL-synced sorting/filtering/pagination (UX rule: dashboard never uses infinite scroll)
25. `<LangSwitcher />`
26. `<CopyableCode />` — for pass codes, mono, one-tap copy

### 1.6 Component gallery
27. Add `apps/dashboard/src/app/(dev)/gallery/page.tsx` (dev-only, blocked in production) rendering every component in every state, in both themes, at mobile and desktop widths.
28. This page is the visual review artefact for every future phase.

### 1.7 Accessibility harness
29. Install `@axe-core/playwright`.
30. Write `e2e/a11y.spec.ts` that loads the gallery and asserts zero violations at `wcag2a` + `wcag2aa`.
31. Wire it into CI. **This test failing blocks merge.**

### 1.8 Lint rules that enforce the principles
32. ESLint rule banning bare string literals in JSX text position (forces i18n) — allow-list the gallery.
33. ESLint rule banning hex colours in `.tsx` files (forces tokens).
34. Bundle-size budget in CI: `apps/web` first-load JS ≤ 200 KB gzipped.

---

## Files created

```
packages/config/tailwind/preset.ts
packages/ui/
├── components.json
├── src/styles/globals.css
├── src/theme/{ThemeProvider.tsx,BrandOverride.tsx,theme-script.ts}
├── src/fonts/index.ts
├── src/components/ui/*            (shadcn, re-themed)
├── src/components/{Money,StatTile,EmptyState,ErrorState,Field,PhoneInput,
│                   OtpInput,LoadingButton,ConfirmDialog,DataTable,
│                   LangSwitcher,CopyableCode}.tsx
└── src/index.ts
apps/dashboard/src/app/(dev)/gallery/page.tsx
e2e/a11y.spec.ts
packages/config/eslint/rules/{no-raw-strings.js,no-hex-colors.js}
```

---

## Acceptance criteria

- [ ] Gallery renders every component in dark and light with no visual breakage
- [ ] Theme toggle produces **zero** flash of incorrect theme on reload
- [ ] Passing a custom `primary` to `<BrandOverride>` recolours the whole UI, and nothing else changes
- [ ] `pnpm e2e -- a11y` reports zero axe violations
- [ ] Gujarati text renders correctly with the right font; English pages do **not** download the Gujarati font (verify in the network tab)
- [ ] `apps/web` first-load JS is under the 200 KB budget and CI enforces it
- [ ] Every money value renders tabular and does not shift width when it changes
- [ ] Keyboard-only navigation reaches every interactive element with a visible focus ring

---

## Definition of Done

All acceptance criteria pass, the gallery is reviewed and approved visually at 375px and 1440px in both themes, and no later phase needs to write a base UI primitive.

---

## OpenCode prompt

> Read `docs/04-design/design-system.md`, `docs/04-design/ux-principles.md`, and `docs/05-execution/phase-01-design-system.md`. Execute Phase 01 steps 1.1–1.8. Use the exact token values from the design doc — do not invent colours. Build the gallery page and make the axe test pass before reporting done.
