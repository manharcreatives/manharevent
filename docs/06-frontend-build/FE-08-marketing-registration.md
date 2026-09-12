# FE-08 — New App: ManharEvent Marketing + Registration (Surface 0)

| | |
|---|---|
| **Phase ID** | `FE-08` |
| **Depends on** | `FE-00`, `FE-01`, `FE-02` (shared config, `packages/ui`, `packages/domain` + `packages/mock-data`) |
| **Blocks** | `FE-10` (admin panel's tenant-approval screen consumes the same `TenantApplication` mock model this phase creates) |
| **Reference docs** | `02-product/product-spec.md §2, §5.0` (2026-09-12 pivot), `02-product/user-flows.md §0, F0` (2026-09-12 pivot), `04-design/manharevents-screen-specs.md §0` |

---

## Goal

Build the surface that didn't exist before the pivot and is now the actual front door into ManharEvent: a small marketing site for ManharEvent itself, plus the organizer registration flow (phone + OTP → org details → status → provisioned). This is a **new, fourth app** in the monorepo — it is not organizer-scoped and has no tenant context, unlike `apps/web`/`apps/dashboard`/`apps/scanner`.

This phase does not build the internal approval screen (a Manhar-platform-team-only view) — that's `FE-10`, alongside the admin panel work, since it's an internal-ops concern gated by a different role than "organizer." This phase builds everything a prospective organizer sees, ending at a `TenantApplication` record sitting in `status: "under_review"` in the mock store.

---

## Deliverables

1. `apps/marketing` — new Next.js 15 App Router app, using the same `packages/ui`, `packages/domain`, `packages/mock-data`, `packages/i18n` as the other three apps
2. Landing page (`/`), pricing page (`/pricing`), registration flow (`/register` → `/register/verify` → `/register/status`), provisioned handoff (`/register/provisioned`)
3. A new `TenantApplication` type in `packages/domain` (org name, contact person, phone, city, rough capacity, desired domain, status, rejection reason, timestamps) and matching mock-store CRUD in `packages/mock-data`
4. Phone + OTP flow reused from the existing pattern in `apps/web`'s checkout auth (same component if it's already in `packages/ui`/`packages/domain`; do not re-implement OTP logic twice)
5. Status screen that reads live from the mock store — changing a `TenantApplication`'s status in the mock store (as `FE-10`'s approval screen will do) must be reflected here on next load, since both apps share the mock store per `FE-02`

---

## Step-by-step

1. **Scaffold `apps/marketing`.** Follow the same Turborepo app conventions as `apps/web` (Next.js 15, App Router, Tailwind v4 preset from `packages/ui`, `next-intl` wired the same way). Add it to the root `turbo.json`/`pnpm-workspace.yaml` pipeline alongside the existing three apps.
2. **`TenantApplication` domain model.** Add to `packages/domain`: `id, orgName, contactName, phone, city, roughCapacity, desiredDomain, status ("draft" | "submitted" | "under_review" | "approved" | "rejected" | "more_info_needed"), rejectionReason?, submittedAt, decidedAt?, provisionedAt?`. Add CRUD + a `submitApplication`, `approveApplication`, `rejectApplication` set of functions to `packages/mock-data/src/repo.ts` (these are exactly the functions `FE-10`'s approval screen will call, and exactly what `HANDOFF-TO-BACKEND.md` will need a new row for in `FE-11`).
3. **Landing (`/`).** Per `manharevents-screen-specs.md §0.1`: hero with real-feeling Navratri photography placeholder (use a neutral gradient/placeholder image for now — real photography is generated later, by the user, via ChatGPT Desktop, per the product-spec pivot note; do not block this phase on that), one primary CTA ("Register your event"), three value cards, the "what you get after approval" 3-item list mapping to Surfaces 1–3. No search bar, no cross-organizer content anywhere on this app.
4. **Pricing (`/pricing`).** Per `§0.2`: the two-line-item fee template (ManharEvent platform fee vs. payment gateway fee), in plain language, framed against BookMyShow/Insider-style bundled fees. This exact two-line template is what `<FeeBreakdown>` (built in `FE-09`) will visually match at checkout — keep them consistent.
5. **Registration (`/register` → `/register/verify` → `/register/status`).** Per `§0.3`: phone entry → OTP (reuse existing OTP UI/logic, do not fork it) → org details form → submit creates a `TenantApplication` with `status: "submitted"` (then flip to `"under_review"` once submitted, per the domain model) → status screen reads that record and renders exactly one of the five states specified in `§0.3` (submitted/under review, approved+provisioning, approved+ready, more-info-needed, rejected) — never a blank or ambiguous state.
6. **Provisioned handoff (`/register/provisioned`).** Per `§0.4`: only reachable once `status: "approved"` and `provisionedAt` is set on the mock record; shows the three links (event website, admin panel, "issue scanner access from Team → Gate Staff"). In the mock world, "Open" links can point at `apps/web` and `apps/dashboard`'s local dev URLs (or a clearly labelled placeholder if cross-app linking isn't practical in the mock environment) — do not silently dead-end the button.
7. **Empty/loading/error states** on every step of the registration flow, per `ux-principles.md` rules 5–7 (wrong OTP, submission failure, etc.) — same bar as `FE-07` set for the other three apps.
8. **i18n.** Gujarati/Hindi/English on every string, same `next-intl` setup as the other apps — this is a public-facing sales surface, it does not get a lower localisation bar than the rest of the product.

---

## Files created

```
apps/marketing/                      (new Next.js app — app router, mirrors apps/web's conventions)
  app/page.tsx                       Landing
  app/pricing/page.tsx
  app/register/page.tsx
  app/register/verify/page.tsx
  app/register/status/page.tsx
  app/register/provisioned/page.tsx
packages/domain/src/tenant-application.ts     TenantApplication type
packages/mock-data/src/repo.ts                + submitApplication / approveApplication / rejectApplication (additions)
```

---

## Acceptance criteria

- [ ] `apps/marketing` builds, lints, and typechecks green as part of the monorepo pipeline
- [ ] Landing page has exactly one primary action and zero cross-organizer content (no city picker, no "Explore", no event grid)
- [ ] `/pricing` shows the platform-fee and gateway-fee lines as two separate, always-visible items
- [ ] Registration flow: phone → OTP → org details → submitted `TenantApplication` exists in the mock store with `status: "under_review"`
- [ ] `/register/status` renders each of the five specified states correctly when the underlying mock record is manually set to each status (test all five)
- [ ] `/register/provisioned` is unreachable until `status: "approved"` and shows all three next-step links/labels
- [ ] Every string on every screen is translated (Gujarati/Hindi/English) — no hardcoded English
- [ ] Every async action (submit, OTP verify) has a loading state and a specified error state — no bare "Something went wrong"

## Definition of Done

A prospective organizer can go from ManharEvent's own landing page to a submitted registration to (once the mock record is manually approved) a provisioned hand-off screen, entirely within `apps/marketing`, in three languages, with no dead ends — and the `TenantApplication` mock model this phase creates is exactly what `FE-10`'s internal approval screen will read and write.

---

## Claude Code prompt

> Follow `docs/06-frontend-build/FE-08-marketing-registration.md` step by step. Scaffold a new `apps/marketing` app in the monorepo, matching `apps/web`'s conventions (Next.js 15, Tailwind v4 preset, `next-intl`, shared `packages/ui`/`packages/domain`/`packages/mock-data`). Build the landing, pricing, registration (phone/OTP → org details → status), and provisioned-handoff screens per `docs/04-design/manharevents-screen-specs.md §0`. Add the `TenantApplication` type to `packages/domain` and matching CRUD (`submitApplication`, `approveApplication`, `rejectApplication`) to `packages/mock-data/src/repo.ts` — reuse the existing OTP flow rather than re-implementing it. Do not build the internal approval screen here (that's `FE-10`). Every screen needs empty/loading/error states and full i18n, same bar as `FE-07`. End green: `pnpm lint && pnpm typecheck && pnpm build`. Update `docs/PROGRESS.md` honestly with ✅/🔵/🔴.
