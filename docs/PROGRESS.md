# 📊 PROGRESS TRACKER — Manhar Garba Platform

> **This file is the single source of truth for build status.**
> Update it at the end of every work session. Whoever picks this up next reads this file first.

---

## 🔁 BUSINESS-MODEL PIVOT — 2026-09-12

**ManharEvent is now B2B SaaS, not a consumer marketplace.** Full reasoning in `02-product/product-spec.md`'s pivot callout (top of that file) and the decision-log row below. Short version: Navratri is once a year, so cross-organizer city discovery isn't worth its engineering cost — each organizer already brings their own audience. The platform now sells directly to organizers, one at a time; on approval, each gets their own event website, their own admin panel, and gate-scanner access issued only from that admin panel, on their own domain, on one shared database.

**Docs updated for the pivot (2026-09-12):** `02-product/product-spec.md` (§2 four-surface model + §2a superseded history, §3 personas, §5.0 new + §5.1 rescoped), `02-product/user-flows.md` (§0 new Surface-0 routes, §1 rescoped, F0 new flow, superadmin re-framed as internal ops), `04-design/manharevents-screen-specs.md` (§0 new, §1.1 rescoped, `<FeeBreakdown>` under §1.4, scanner-access note under §2.4). Old cross-organizer content is kept struck-through with "superseded" notes, not deleted, so the reasoning trail survives.

**New frontend phases added (additive, do not redo FE-00–FE-07):** `FE-08` (new `apps/marketing` — landing/pricing/registration), `FE-09` (rescope `apps/web`, add `<FeeBreakdown>`), `FE-10` (admin-panel tenant approval + hardened scanner-access issuance), `FE-11` (end-to-end pivot verification + `HANDOFF-TO-BACKEND.md` update). See the Frontend-First Track table below.

---

## 🎨 BRAND — Logo delivered, product renamed to ManharEvent — 2026-09-12

Utsav delivered the real logo (icon + "ManharEvent.com" wordmark + "Powered by Manhar Creatives" tagline). Two things followed:

1. **The product's user-facing name changes from "Manharevents" to "ManharEvent"** (the logo's own wordmark — singular "Event", no trailing s) everywhere in the docs and copy. This supersedes the 2026-09-11 rename below — see the new decision-log row. Internal codename `manhar-garba` (repo, package scope `@manhar-garba/*`, DB name) is still unchanged.
2. **Brand assets saved** to `docs/04-design/assets/manharevent/` (master file + derived icon/lockup/favicon variants — see that folder's `README.md` for exactly what each file is and its known rough edges) and copied into `apps/web/public/brand/`, `apps/dashboard/public/brand/`, `apps/scanner/public/brand/`. **Not done:** actually wiring these into `<head>` favicons, the Next.js `app/icon.png` convention, `manifest.json` icon entries (the scanner's still point at FE-05's placeholder icons), or real `<header>` markup — that's a code change for the next Claude Code CLI session, not done from here.

---

## 🏁 FRONTEND-FIRST TRACK COMPLETE (pre-pivot scope) — 2026-09-12

The full ManharEvent UI (all three surfaces — public site, organizer dashboard, gate scanner PWA) is built, verified, and demable on mock data. The platform looks and behaves like a finished product.

**What was built:**
- **FE-00** — Turborepo + pnpm monorepo with 3 apps (web/dashboard/scanner) and 4 shared packages (domain, ui, mock-data, i18n)
- **FE-01** — ManharEvent design system: Tailwind v4 CSS-first tokens, 19 shadcn primitives re-themed, 12 custom components (PassCard, EventCard, ZoneMap, ScanResult with 8 states, DataTable, etc.), dark-first with light mode, full i18n (en/gu/hi)
- **FE-02** — Domain types (pure TypeScript) + async mock repo (`packages/mock-data`) seeded with a full Navratri 9-night event with 10+ passes covering all 8 scan verdict states
- **FE-03** — Public site: home + city discovery, event landing page, 9-night night cards, zone selector with ZoneMap, 4-tap buy path (event → zone → pass → checkout), My Passes & My Orders, i18n routing, SEO skeleton (sitemap, robots, JSON-LD, OG metadata)
- **FE-04** — Organizer dashboard: full sidebar nav, event wizard (5 steps → publishable), live occupancy page, 12+ event sub-pages (nights, zones/venues, passes, promos, policies, reports, check-ins, live, team, finance), settings, team management, comp passes, audit log
- **FE-05** — Gate scanner PWA: `@zxing/browser` camera scanning, all 8 `<ScanResult>` states, offline-first validation (zero network on scan path), Dexie IndexedDB manifest + queue, Serwist service worker, Web Audio + haptics feedback, manual code entry, session log with CSV export, 3-screen onboarding, PWA manifest + icons
- **FE-06** — Responsive (375/768/1440px fixes), a11y (skip-to-content, touch targets ≥44px, sidebar auto-collapse), `prefers-reduced-motion` (already in globals.css), online-only audit (zero hardware/native deps confirmed), axe e2e test suite
- **FE-07** — Empty states on all list/table screens per UX rule 6, `alert()` → `toast()` on all async actions, `Toaster` added to dashboard and scanner layouts, `HANDOFF-TO-BACKEND.md` written (every mock→real swap with the owning phase)

**What to do next (superseded by the pivot above):** ~~Read `docs/06-frontend-build/HANDOFF-TO-BACKEND.md` and decide where the database goes. Then start at **P-02 (Database)** in the phase table below.~~ The database decision now waits on `FE-08`–`FE-11` (the pivot phases) as well — see the 🔁 pivot section above and the updated Frontend-First Track table below.

**Build status:** `pnpm lint && pnpm typecheck && pnpm build` — ✅ GREEN (all 3 apps, 2026-09-12, pre-pivot scope)

---

**Last updated:** 2026-09-12
**Updated by:** Cowork (pivot documentation pass + brand rename/logo pass + FE-08/FE-09/FE-10/FE-11 builds)
**Current phase:** `FE-08 through FE-11 built directly from Cowork and committed — all 🔵, unverified (see environment-constraints notes below; needs a real pnpm install/lint/typecheck/build pass). FE-09 closed a real gap found while rescoping Home: the entire event→book→checkout→status buy path had no page routes wired despite FE-03 claiming it and the components existing — all 4 routes + a pass-selector + mock order-completion/pass-issuance are now built and click-through end to end. FE-10 added the internal-ops /admin/tenants approval screens (wired to FE-08's approve/reject functions) and real gate-scanner credential issuance on the Team page — but could NOT touch the existing team/gate-staff/page.tsx sub-page because a newly-discovered depth cap blocks reading (not writing) files more than 7 folders below the connected root; that page needs reconciling with the new Team-page UI in a future session. FE-11 reconciled data-model.md and HANDOFF-TO-BACKEND.md against everything FE-08–FE-10 actually built (new tenant_applications + scanner_login_codes tables, a new provision_tenant() function, a new §0/§6a in the handoff map, corrected mock-body descriptions) and re-verified the whole repo's syntax (133 files, zero errors) plus traced the admin-approval loop's wiring end to end — see FE-11's decision-log row. Known remaining gaps (not yet built, flagged honestly rather than silently skipped): /me/* (My Passes, Orders, Wallet, Account — bottom-nav and top-nav both link here), /legal/* (privacy/terms/refund-policy — footer and in-page links both point here), Gallery/FAQ on the event page (deferred deliberately — needs real event photography, which Utsav said to generate via ChatGPT only after all coding is done), hardcoded-English strings in checkout-client.tsx/order-status-client.tsx/auth pages despite i18n infra existing, team/gate-staff/page.tsx (unreadable this session — see FE-10 note), and the design questions data-model.md §11 now flags (no internal-ops role modeled, provision_tenant's profiles-row dependency, scanner_login_codes has no consuming endpoint yet). Product renamed Manharevents → ManharEvent; logo assets saved, not yet wired into <head>/manifest/header code.`
**Overall:** 0 / 22 phases complete (Frontend-First track, pre-pivot: FE-00 ✅, FE-01 ✅, FE-02 ✅, FE-03 🔵, FE-04 🔵, FE-05 🔵, FE-06 🔵, FE-07 🔵 — pivot phases: FE-08 🔵, FE-09 🔵, FE-10 🔵, FE-11 🔵 — all 4 pivot phases built, none yet build-verified)

---

## Status legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🟡 | In progress |
| 🔵 | Built, acceptance criteria not yet verified |
| ✅ | Done — all acceptance criteria verified with evidence |
| 🔴 | Blocked (see Blockers) |
| ⏭️ | Deliberately deferred (see Deferred) |

---

## Overview

| # | Phase | Status | Started | Finished | Owner | Notes |
|---|---|---|---|---|---|---|
| 00 | Foundation & Repo Setup | ⬜ | | | | |
| 01 | Design System & Components | ⬜ | | | | |
| 02 | Database & Multi-Tenancy | ⬜ | | | | |
| 03 | Authentication & Identity | ⬜ | | | | |
| 04 | Tenant Onboarding & White-Label | ⬜ | | | | |
| 05 | Events, Venues, Zones, Lineup | ⬜ | | | | |
| 06 | Ticketing & Inventory Engine | ⬜ | | | | |
| 07 | Pricing, Promo & Policy | ⬜ | | | | |
| 08 | Public Discovery & Event Pages | ⬜ | | | | |
| 09 | Checkout, Payments & GST | ⬜ | | | | |
| 10 | Pass Issuance, QR & Delivery | ⬜ | | | | |
| 11 | Attendee Account & Groups | ⬜ | | | | |
| 12 | Gate Scanner PWA | ⬜ | | | | |
| 13 | Wallet, Parking & Vendors | ⬜ | | | | |
| 14 | Live Ops & Analytics | ⬜ | | | | |
| 15 | Finance, Refunds & Settlements | ⬜ | | | | |
| 16 | Notifications Engine | ⬜ | | | | |
| 17 | Superadmin Console | ⬜ | | | | |
| 18 | Security, Fraud, Perf, A11y | ⬜ | | | | |
| 19 | QA, Deployment & Monitoring | ⬜ | | | | |
| 20 | Gallery, Community & Growth | ⬜ | | | | |
| 21 | Launch & Post-Launch Ops | ⬜ | | | | |

---

## Milestones

| Milestone | Phases | Status | Target date | Actual |
|---|---|---|---|---|
| M1 — Skeleton | 00–03 | ⬜ | | |
| M2 — Organizer can build | 04–07 | ⬜ | | |
| M3 — People can buy | 08–11 | ⬜ | | |
| M4 — The gate works | 12, 14 | ⬜ | | |
| M5 — The books close | 15, 16 | ⬜ | | |
| M6 — Ready | 18, 19 | ⬜ | | |
| M7 — Live | 21 | ⬜ | | |
| M8 — Sticky | 13, 17, 20 | ⬜ | | |

---

## Detailed phase checklists

Tick a sub-step only when it is done **and** its part of the acceptance criteria is verified.

### P-00 · Foundation ⬜
- [ ] 0.1 Monorepo initialised (Turborepo + pnpm)
- [ ] 0.2 `packages/config` — tsconfig, eslint, prettier, tailwind
- [ ] 0.3 Three apps scaffolded and running (3000/3001/3002)
- [ ] 0.4 Shared packages created
- [ ] 0.5 Type-safe env loading, `.env.example` complete
- [ ] 0.6 Vitest + Playwright wired
- [ ] 0.7 CI pipeline green, secret-leak check verified
- [ ] 0.8 Repo hygiene, docs copied in

### P-01 · Design System ✅
- [x] 1.1 Tailwind preset with all tokens (`packages/config/tailwind/preset.ts`, globals.css `@theme {}`)
- [x] 1.2 ThemeProvider + BrandOverride (no theme flash — blocking inline script)
- [x] 1.3 Fonts, per-locale loading (Inter/Bricolage/JetBrains always; Noto Gujarati/Devanagari locale-gated)
- [x] 1.4 shadcn components installed and re-themed (19 primitives in `packages/ui/src/components/ui/`)
- [x] 1.5 Shared custom components (Money, StatTile, EmptyState, ErrorState, Field, PhoneInput, OtpInput, LoadingButton, ConfirmDialog, DataTable, LangSwitcher, CopyableCode)
- [x] 1.6 Component gallery (`apps/dashboard/src/app/(dev)/gallery/page.tsx`)
- [x] 1.7 axe harness in CI (`e2e/a11y.spec.ts` — playwright + axe-core)
- [x] 1.8 Special components: EventCard, PassCard (4 states), ZoneMap, NightCard, ScanResult (8 states)

### P-02 · Database ⬜
- [ ] 2.1 Three Supabase projects, CLI linked
- [ ] 2.2 Enums migration
- [ ] 2.3 All table migrations (0002–0009)
- [ ] 2.4 `updated_at` triggers
- [ ] 2.5 Append-only triggers on ledger + audit
- [ ] 2.6 RLS on every table, anon policies narrow
- [ ] 2.7 JWT auth hook + `switch_tenant`
- [ ] 2.8 Core functions (reserve, confirm, validate, manifest, refund)
- [ ] 2.9 pg_cron jobs
- [ ] 2.10 Generated types + typed clients
- [ ] 2.11 Seed data (2 tenants)
- [ ] 2.12 RLS test suite + concurrency test green

### P-03 · Auth ⬜
- [ ] 3.1 Supabase phone auth configured, MSG91 wired
- [ ] 3.2 Auth state machine in `packages/domain`, unit tested
- [ ] 3.3 Public app auth (start / verify / profile + inline variant)
- [ ] 3.4 Dashboard auth + tenant selection + switcher
- [ ] 3.5 Scanner auth + device binding
- [ ] 3.6 Route protection (middleware + server-side re-check)
- [ ] 3.7 Rate limiting on OTP
- [ ] 3.8 Session refresh, single-flight
- [ ] 3.9 Error copy in all 3 languages

### P-04 · Tenant & White-Label ⬜
- [ ] 4.1 Tenant creation + approval
- [ ] 4.2 Branding editor with contrast validation
- [ ] 4.3 Subdomain routing
- [ ] 4.4 Custom domains + verification
- [ ] 4.5 Brand injection on public site
- [ ] 4.6 Payment & GST configuration
- [ ] 4.7 Team management + roles
- [ ] 4.8 Commission config (read-only to organizer)

### P-05 · Events & Venues ⬜
- [ ] 5.1 Event wizard (≤ 5 steps) + clone
- [ ] 5.2 Event overview
- [ ] 5.3 Nights with themes and dress codes
- [ ] 5.4 Venue, zones, gate↔zone matrix
- [ ] 5.5 Artists & lineup
- [ ] 5.6 Content editor, per-locale
- [ ] 5.7 Pre-publish checklist (blocking + warnings)
- [ ] 5.8 Publish / preview-as-attendee

### P-06 · Ticketing Engine ⬜
- [ ] 6.1 Pass type builder + quick-add presets
- [ ] 6.2 `pass/validity.ts` — 100% branch coverage
- [ ] 6.3 Inventory holds + concurrency test (10 clean runs)
- [ ] 6.4 Availability display (no fake scarcity)
- [ ] 6.5 Add-ons
- [ ] 6.6 Daily-pass per-night inventory
- [ ] 6.7 Complimentary passes with approval
- [ ] 6.8 Bulk / corporate allocation

### P-07 · Pricing & Policy ⬜
- [ ] 7.1 Pricing pipeline in `packages/domain`
- [ ] 7.2 Price tiers with auto-switching
- [ ] 7.3 Promo engine with specific error copy
- [ ] 7.4 Convenience fee
- [ ] 7.5 GST (CGST/SGST vs IGST, rounding)
- [ ] 7.6 Refund policy builder + evaluator + snapshot
- [ ] 7.7 Re-entry policy
- [ ] 7.8 Display components
- [ ] ⚠️ **TS ↔ SQL parity test green (25 scenarios)**

### P-08 · Public Site ⬜
- [ ] 8.1 Rendering strategy (ISR + RSC)
- [ ] 8.2 Home & city discovery
- [ ] 8.3 Event landing page
- [ ] 8.4 Night pages (SEO)
- [ ] 8.5 Artist pages
- [ ] 8.6 Pass selector (≤ 4 taps to Razorpay)
- [ ] 8.7 i18n — gu / hi / en
- [ ] 8.8 SEO — sitemap, robots, JSON-LD, OG images
- [ ] 8.9 Performance — Lighthouse ≥ 90, JS ≤ 200 KB

### P-09 · Checkout & Payments ⬜
- [ ] 9.1 Draft orders + holds
- [ ] 9.2 Checkout page with inline auth
- [ ] 9.3 Razorpay integration (UPI Intent first on mobile)
- [ ] 9.4 Webhook — signature verified, idempotent
- [ ] 9.5 Result page — QR shown immediately
- [ ] 9.6 GST invoices, gap-free numbering
- [ ] 9.7 Failure recovery + reconciliation cron
- [ ] 9.8 Waitlist
- [ ] 9.9 Virtual waiting room
- [ ] ⚠️ **Load test: 500 available / 1,000 attempts → exactly 500 sold**

### P-10 · Pass Delivery ⬜
- [ ] 10.1 Signed QR payload (< 180 chars, no PII)
- [ ] 10.2 Human-readable pass code
- [ ] 10.3 PDF generation (greyscale-legible)
- [ ] 10.4 WhatsApp delivery — **templates approved by Meta**
- [ ] 10.5 SMS & email fallback
- [ ] 10.6 Wallet passes (Apple / Google)
- [ ] 10.7 In-app pass — **works offline**
- [ ] 10.8 Pass transfer (old QR invalidated)
- [ ] 10.9 Group invite fill-in

### P-11 · Attendee Account ⬜
- [ ] 11.1 Account home + bottom tab nav
- [ ] 11.2 Orders + invoices + re-send
- [ ] 11.3 Group / holder management
- [ ] 11.4 Refund requests with exact amount shown first
- [ ] 11.5 Preferences (language, channels)
- [ ] 11.6 Privacy — export, delete, consent history
- [ ] 11.7 Support entry point

### P-12 · Gate Scanner ⬜
- [ ] 12.1 PWA shell, offline cold start
- [ ] 12.2 Encrypted manifest sync, 18h staleness guard
- [ ] 12.3 Camera scanning (zxing), torch, debounce
- [ ] 12.4 Fully offline validation — **zero network calls on scan path**
- [ ] 12.5 `<ScanResult>` — all 8 states, readable at 1m in darkness
- [ ] 12.6 Check-in queue (allow + deny)
- [ ] 12.7 Background sync, idempotent, conflict resolution
- [ ] 12.8 Cross-device anti-passback (non-blocking)
- [ ] 12.9 Exit / re-entry
- [ ] 12.10 Manual code entry
- [ ] 12.11 Device log + CSV export
- [ ] 12.12 60-second onboarding
- [ ] ⚠️ **Tested on a real cheap Android, outdoors, at night**

### P-13 · Wallet & Vendors ⏭️
- [ ] 13.1 Wallet lifecycle (balance derived from ledger)
- [ ] 13.2 Vendor setup
- [ ] 13.3 Vendor terminal mode
- [ ] 13.4 Offline spending + overdraft cap + reconciliation
- [ ] 13.5 Attendee wallet view
- [ ] 13.6 Parking passes
- [ ] 13.7 Vendor dashboard
- [ ] 13.8 Organizer wallet reporting (liability prominent)

### P-14 · Live Ops & Analytics ⬜
- [ ] 14.1 Live console (3 metrics, honest degradation)
- [ ] 14.2 Occupancy + threshold alerts
- [ ] 14.3 Device monitoring
- [ ] 14.4 Sales analytics + night-wise attendance
- [ ] 14.5 Attendee search (< 1s at 50k)
- [ ] 14.6 Manual override (reason required)
- [ ] 14.7 Announcements + venue ticker
- [ ] 14.8 Reports & exports

### P-15 · Finance ⬜
- [ ] 15.1 Double-entry ledger + balance invariant test
- [ ] 15.2 Razorpay reconciliation
- [ ] 15.3 Refund workflow (atomic, 6 side effects)
- [ ] 15.4 Settlements + payout tracking
- [ ] 15.5 GST reporting + gap detection + credit notes
- [ ] 15.6 Finance dashboard
- [ ] 15.7 Vendor settlements
- [ ] 15.8 Role controls + audit

### P-16 · Notifications ⬜
- [ ] 16.1 Template system (channel × locale)
- [ ] 16.2 Queue, retry, channel fallback
- [ ] 16.3 Full transactional catalogue (17 keys × 3 languages)
- [ ] 16.4 Scheduled reminders, IST-correct, quiet hours
- [ ] 16.5 Broadcast campaigns
- [ ] 16.6 Consent enforced at send time
- [ ] 16.7 Delivery analytics

### P-17 · Superadmin ⏭️
- [ ] 17.1 `apps/admin` + platform_admin identity
- [ ] 17.2 Tenant management + read-only impersonation
- [ ] 17.3 Platform finance
- [ ] 17.4 Cross-tenant support lookup
- [ ] 17.5 System health
- [ ] 17.6 Feature flags (< 60s propagation)
- [ ] 17.7 Platform content
- [ ] 17.8 Runbooks written

### P-18 · Security & Performance ⬜
- [ ] 18.1 Security audit (RLS sweep, secrets, actions, headers, deps)
- [ ] 18.2 Fraud detection + review queue
- [ ] 18.3 Performance to budget
- [ ] 18.4 Accessibility — WCAG 2.1 AA
- [ ] 18.5 Privacy compliance verified
- [ ] 18.6 **All 10 pentest attempts made and documented**

### P-19 · QA & Deployment ⬜
- [ ] 19.1 Test suite (unit / integration / E2E / visual / load)
- [ ] 19.2 Three environments, parity checklist
- [ ] 19.3 CI/CD with auto-rollback
- [ ] 19.4 Monitoring + business-metric alerts
- [ ] 19.5 Structured logging, no PII
- [ ] 19.6 Backup + **restore drill actually performed**
- [ ] 19.7 Release process + event-night freeze

### P-20 · Differentiators ⏭️
- [ ] 20.1 Photo gallery
- [ ] 20.2 Find-my-photos (opt-in, precision-tuned) — privacy review passed?
- [ ] 20.3 Best-dressed contest
- [ ] 20.4 Referral engine
- [ ] 20.5 Sponsor dashboard
- [ ] 20.6 Live venue map
- [ ] 20.7 Post-event recap
- [ ] 20.8 Artist following

### P-21 · Launch ⬜
- [ ] 21.1 Pre-launch checklist signed off
- [ ] 21.2 Soft launch (small event first)
- [ ] 21.3 On-sale day
- [ ] 21.4 Event night operations
- [ ] 21.5 Post-event review
- [ ] 21.6 Ongoing cadence established

---

## 🔴 Blockers

| # | Blocker | Phase | Raised | Owner | Status |
|---|---|---|---|---|---|
| | _none yet_ | | | | |

---

## ⏭️ Deferred / descoped

| Item | Phase | Reason | Revisit |
|---|---|---|---|
| Native mobile apps | — | PWA covers v1 needs | After first season, if retention demands it |
| Reserved seat maps | — | Garba is standing; zones suffice | Only for concert-format events |
| RazorpayX auto-payouts | 15 | Manual payouts fine for season 1 | Before season 2 |
| Drag-and-drop dashboard widgets | 14 | A good fixed dashboard beats a bad customisable one | v2 |

---

## 📌 Decision log

Anything that changes a locked decision in `03-architecture/` gets logged here with a reason.

| Date | Decision | Reason | Changed by |
|---|---|---|---|
| 2026-09-10 | Supabase over NextAuth + Prisma | RLS makes the database the security boundary for multi-tenancy | Planning |
| 2026-09-10 | Phone-first identity, email optional | Email is a barrier for a large share of Garba buyers | Planning |
| 2026-09-10 | Dark theme as default | The product is used at night, outdoors | Planning |
| 2026-09-10 | Multi-tenant from day one | Retrofitting tenancy is far more expensive than starting with it | Planning |
| 2026-09-10 | Pass = N admits × M nights × 1 zone | Single abstraction covering every Garba SKU | Planning |
| 2026-09-10 | Webhook is the only order-confirming path | Browser redirects are unreliable | Planning |
| 2026-09-11 | Product renamed to **Manharevents** on every user-facing surface (site title, app name, PWA manifest, sender name) | Chosen brand name for launch; internal codename `manhar-garba` unchanged (repo, DB, package names) | Planning |
| 2026-09-11 | Added a frontend-first execution track (`docs/06-frontend-build/`, phases FE-00…FE-07) that builds the complete UI for all 3 surfaces on mock data before wiring Supabase | Get a demoable, fully-designed product first; decide where/how the database connects afterward, using the track's handoff map | Planning |
| 2026-09-12 | **Pivoted from a consumer-facing, multi-tenant marketplace (cross-organizer city/date discovery) to a B2B SaaS model.** Manhar Creatives sells directly to organizers; each approved organizer gets their own event website, own admin panel, and gate-scanner access (issued only from that admin panel), on their own domain, on one shared database. City-wide discovery is removed. A new marketing + registration surface (Surface 0) is added, with phone/OTP organizer registration and an internal approval step. Platform fee (kept minimal) and payment-gateway fee are always shown as two separate line items. | Navratri is once a year — a marketplace's discovery/search engineering cost doesn't pay off when every organizer already brings their own audience (WhatsApp groups, Instagram, last year's crowd). The real differentiator is giving each organizer their own better-than-BookMyShow platform, not cross-organizer discovery. | Utsav (product owner) |
| 2026-09-12 | Added 4 additive frontend phases for the pivot: `FE-08` (new `apps/marketing` app), `FE-09` (rescope `apps/web`, remove city discovery, add `<FeeBreakdown>`), `FE-10` (admin-panel tenant approval + hardened scanner-access issuance), `FE-11` (end-to-end pivot verification + updated `HANDOFF-TO-BACKEND.md`). FE-00–FE-07 are not redone or renumbered. | Keep the already-completed, working frontend-first build intact; graft the pivot on top rather than restarting it | Planning |
| 2026-09-12 | **Product renamed a second time, from "Manharevents" to "ManharEvent"** (site title, app name, PWA manifest, sender name, all docs) — this supersedes the 2026-09-11 rename row above. Real logo delivered and saved to `docs/04-design/assets/manharevent/` plus copied into each app's `public/brand/`. Internal codename `manhar-garba` (repo, package scope `@manhar-garba/*`, DB name) is still unchanged. | Utsav delivered the actual brand logo, and its wordmark reads "ManharEvent.com" (singular, domain baked in) — matching the docs to the real, final asset rather than the earlier placeholder name | Utsav (product owner) |
| 2026-09-12 | **FE-08 built directly from Cowork** (new `apps/marketing` app: landing, pricing, phone/OTP registration → org-details form → status → provisioned hand-off; new `TenantApplication` domain type + mock CRUD in `packages/mock-data/src/repo.ts`; full en/gu/hi translations added; `Common.appName`/`copyright` in `packages/i18n` fixed to "ManharEvent"). Committed to the repo. **Status is 🔵, not ✅, because this environment could not run `pnpm install`/`lint`/`typecheck`/`build` to verify it** — see the environment-constraints note directly below. Only a TypeScript *syntax* parse (no type resolution) was possible from here. | Utsav asked to execute the pivot phases directly rather than waiting for a Claude Code CLI session, given the platform needs to be ready as soon as possible | Utsav (product owner) |
| 2026-09-12 | **FE-09 built directly from Cowork** (Home rescoped to single-organizer per `manharevents-screen-specs.md §1.1`: organizer-branded hero, single "Book Passes" CTA, single-organizer trust strip, night-lineup preview row; `/[city]` route neutered — `notFound()` — real deletion still needs a working shell; root layout + sitemap/robots metadata fixed to organizer/`manharevent.com` branding; `<FeeBreakdown>` fee-split wired into `apps/web` checkout, same template as Surface 0's `/pricing`). **While rescoping Home, found FE-03 had never actually been wired end-to-end**: `/e/[eventSlug]`, `/e/[eventSlug]/book`, `/checkout/[orderId]`, `/checkout/[orderId]/status` had zero page routes despite PROGRESS.md's FE-03 row claiming a "4-tap buy path" and the components (`checkout-client.tsx`, `order-status-client.tsx`, `trust-strip.tsx`, `zone-cards-section.tsx`, `sticky-book-bar.tsx`) existing and being fully built — they were simply never imported by any `page.tsx`, so the Home page's only call-to-action would have 404'd. Given Utsav's instruction to get the product actually ready, this was treated as in-scope for FE-09 rather than left broken: built all 4 missing routes, plus a `BookClient` pass-selector (zone → pass type → quantity → add-ons, using the real `ZoneMap`/pass-type/price-tier/add-on fixture data) and a `completeMockOrder` mock-data function (+ `payMockOrder` server action) that marks an order paid and issues real `Pass` records on the demo "Pay" click — previously `createOrder` was the only step ever wired, so no order ever reached "paid" or produced a pass. The buy path (Home → event landing → book → checkout → status/QR) is now click-through end to end on mock data. Also caught and fixed: `gu.json`/`hi.json` were missing most of the `Event` and `Book` translation namespaces (only 3–4 of ~20+ keys each) — the new pages would have shown broken/missing text in Gujarati and Hindi; filled in full translations for both. **Status is 🔵, not ✅ — same environment-constraint reason as FE-08 below: none of this has been run, lint-checked, type-checked, or built, only parsed for syntax and carefully hand-checked against each type definition.** | Utsav asked to get the product ready no matter what and fix whatever bugs exist, after this session flagged it could not verify builds; a Home page whose one button 404s is not "ready" | Utsav (product owner) |
| 2026-09-12 | **FE-10 built directly from Cowork** (new `(admin)` route group in `apps/dashboard`: `/admin/tenants` lists organizer registrations with status filter tabs, `/admin/tenants/[id]` shows full application detail with Approve &amp; provision / Ask for more info / Reject actions — wired to FE-08's already-built `approveApplication`/`rejectApplication` mock-data functions via new `apps/dashboard/src/app/actions/tenant-applications.ts` server actions; deliberately its own shell, not the organizer `<Sidebar>`, since this is Manhar Creatives' internal-ops view per `user-flows.md`'s "Internal ops" section, never organizer- or attendee-facing. Also added real gate-scanner credential issuance: `dashboard-store.ts` gained a `ScannerCredential` type + `issueScannerCredential`/`revokeScannerCredential` actions (owner-only, per member, revocable, audit-logged), surfaced directly on the Team page for any `gate_staff` member — previously "gate-staff access issued only from the admin panel" was true only as a role label with nothing behind it.) **Left deliberately untouched: `apps/dashboard/src/app/(dashboard)/dashboard/team/gate-staff/page.tsx`** — a newly-discovered environment constraint (see below) meant this session could not read its current content, and per this project's own rule, a file is never rewritten blind. A future session should reconcile that page with the new Team-page scanner-credential UI (they may now overlap). | Utsav asked to get the product ready no matter what; FE-10's stated scope (tenant approval + hardened scanner-access issuance) was achievable using data/functions FE-08 had already built | Utsav (product owner) |

| 2026-09-12 | **FE-11 built directly from Cowork** (docs reconciliation half of its acceptance criteria — "docs reconciled, `HANDOFF-TO-BACKEND.md` updated"). `03-architecture/data-model.md` gained: a new §1a `tenant_applications` table (resolving that doc's own open question of whether `TenantApplication` needs its own table — yes, modeled from the exact shape FE-08/FE-10 already built and exercised end-to-end), a new `scanner_login_codes` table under §5 for FE-10's scanner-credential feature, a new `provision_tenant(application_id)` function under §9 (flagged as genuinely new backend work, not a mock→real swap, since mock `approveApplication` only flips status/timestamps and creates no actual tenant), and a new §11 "Open items flagged during FE-11 reconciliation" naming three unresolved design questions (no internal-ops/superadmin role modeled yet; `provision_tenant`'s dependency on the applicant already having a `profiles` row; `scanner_login_codes` having no consuming endpoint in `apps/scanner` yet). `06-frontend-build/HANDOFF-TO-BACKEND.md` gained: a new §0 mapping every `TenantApplication` mock function to its real Supabase replacement, a new §6a for the scanner-credential functions (which live in `dashboard-store.ts`, not `repo.ts` — noted explicitly since that's a different file than every other row in the doc), an updated §4 row explicitly warning that FE-09's new `completeMockOrder` must **not** be ported as-is (it's a demo shortcut standing in for the whole Razorpay-webhook flow already documented, not something to swap in directly), a corrected description of `listOrderItems`/`listPayments`'s mock body (they read mutable `_orderItems`/`_payments` copies now, not the old immutable fixture arrays — FE-09's bug fix), and a renumbered swap-order list reflecting where tenant-application provisioning and scanner-login codes now fit. The end-to-end-loop half of FE-11's criteria was verified by code trace rather than a real run (build/lint/typecheck still unavailable this session — see the environment-constraint notes below): re-ran the syntax-only check across all 133 staged `.ts`/`.tsx` files (zero errors), and traced the admin approval loop specifically — confirmed `listApplications`/`getApplication`/`approveApplication`/`rejectApplication`'s real signatures match every call site in the new `/admin/tenants` pages and `tenant-applications.ts` server actions, confirmed every `@manhar-garba/ui` import used by the new admin components (`Badge`, `Textarea`, `Field`, `CopyableCode`) actually exists and that `Badge`'s variant prop accepts every status color used, and confirmed `apps/dashboard`'s root layout carries no sidebar so the new `(admin)` route group's own layout doesn't visually collide with the organizer `(dashboard)` route group. **Status is 🔵, not ✅ — same reason as every phase this session: no real `pnpm install`/`lint`/`typecheck`/`build` has run against any of this.** Remaining known gaps (`/me/*`, `/legal/*`, event-page Gallery/FAQ, hardcoded-English strings in a few client components, the still-unreconciled `team/gate-staff/page.tsx`, and the new open items above) are intentionally left for a future session rather than guessed at. | Utsav (product owner) |

**⚠️ New environment constraint discovered 2026-09-12 (FE-10) — reading existing files, not writing them:** `device_stage_files`/`device_list_dir` refuse a path more than **7 folders below the connected root** (`Manhar_Garba_plateform`) with "too deeply nested to stage" — confirmed by `apps/dashboard/src/app/(dashboard)/dashboard/team/gate-staff/page.tsx` (8 folders deep) failing while its sibling `team/page.tsx` (exactly 7) succeeded. This blocks *reading* several existing dashboard screens from Cowork (anything under `events/[id]/*` is 9 folders deep and worse). It does **not** block `device_commit_files` — every new file this session wrote at 8+ folders deep (the whole `/e/[eventSlug]/book`, `/checkout/[orderId]/status`, `/admin/tenants/[id]` routes) committed with zero rejections. So: new files at any depth are fine to create and commit; editing an *existing* deeply-nested file requires either a working `device_bash` (still broken, see the FE-08 note below) or the user connecting a narrower folder (e.g. `apps/dashboard`) directly from the Claude desktop app — `device_request_folder_access` cannot shorten this itself, a subfolder of an already-connected folder doesn't count as a new grant. If this keeps recurring, ask Utsav to connect `apps/dashboard` (or the specific subfolder needed) as its own linked folder from the Claude desktop app, or resume from a session where the local shell bridge works.

**⚠️ Environment constraint hit 2026-09-12 (read before trusting any 🔵 status set by Cowork on FE-08–FE-11):** this session hit two blockers that prevented real build verification from Cowork: (1) the device-bridge shell to Utsav's Windows machine is broken by a known Windows-update bug (Anthropic is tracking it) — commands can't run there directly; (2) this cloud sandbox's network egress does not allow `registry.npmjs.org`, so `pnpm install` can't fetch packages here either. Work-around used: edit files by staging them into the cloud workspace, then commit the finished files back to the real repo via the device bridge (same mechanism used for the brand-asset delivery earlier). **This means FE-08's code has NOT been run, lint-checked, type-checked, or built** — only parsed for syntax errors and written to match existing file-for-file conventions as closely as possible. Before trusting 🔵→✅ on FE-08 (or any later phase built the same way), run `pnpm install && pnpm lint && pnpm typecheck && pnpm build` from a real terminal (Claude Code CLI, or Utsav's own machine) and fix whatever surfaces.

---

## 🧠 Learnings

Things discovered during the build that future-you needs. Append, never delete.

| Date | Phase | Learning |
|---|---|---|
| 2026-09-12 | FE-01 | pnpm 12 uses `allowBuilds` (key→true map) in `pnpm-workspace.yaml`, not `onlyBuiltDependencies` in `package.json`. |
| 2026-09-12 | FE-01 | Tailwind v4 is CSS-first: tokens go in `@layer base { :root {} }` and utility generation in `@theme {}` — no `tailwind.config.js`. |
| 2026-09-12 | FE-01 | With `transpilePackages`, the apps' `tsc` resolves source files from the ui package directly — all `@/` aliases must be relative paths inside the package, not path-mapped aliases, or else the apps' tsconfig can't resolve them. |
| 2026-09-12 | FE-01 | `next lint` is deprecated in Next.js 15.5.25 — use `eslint .` with `@eslint/eslintrc` FlatCompat wrapping `next/core-web-vitals` and `next/typescript`. |

---

## 📈 Metrics as they become real

| Metric | Target | Current | Measured |
|---|---|---|---|
| Checkout conversion | > 35% | — | |
| Payment success rate | > 92% | — | |
| WhatsApp delivery rate | > 98% | — | |
| Gate scan first-attempt success | > 97% | — | |
| Average gate wait | < 4 min | — | |
| Scan decision latency p99 | < 500 ms | — | |
| Public LCP (4G, mid Android) | < 2.5 s | — | |
| Buy-path first-load JS | ≤ 200 KB | — | |
| Support tickets per 1,000 passes | < 8 | — | |
| Organizer onboarding time | < 30 min | — | |

---

## 🎨 Frontend-First Track (`docs/06-frontend-build/`)

Runs **ahead of** the phase table above, on mock data, so the full ManharEvent UI is demoable before the database-connection decision is made. Informed by `04-design/manharevents-screen-specs.md`. Executed via Claude Code (VS Code CLI) — one phase per "continue".

| Phase | Produces | Status |
|---|---|---|
| FE-00 | App shell bootstrap (no DB) | ✅ |
| FE-01 | ManharEvent design system implementation | ✅ |
| FE-02 | Mock data & domain layer | ✅ |
| FE-03 | Public site UI *(pre-pivot scope — multi-tenant marketplace)* | 🔵 |
| FE-04 | Organizer dashboard UI | 🔵 |
| FE-05 | Gate scanner UI | 🔵 |
| FE-06 | Responsive / accessibility / online-only verification | 🔵 |
| FE-07 | Final polish + `HANDOFF-TO-BACKEND.md` *(pre-pivot version)* | 🔵 |
| **FE-08** | **New** — `apps/marketing`: landing, pricing, phone/OTP organizer registration, status, provisioned hand-off (Surface 0) | 🔵 |
| **FE-09** | **New** — Rescope `apps/web`: remove city discovery, single-tenant Home, `<FeeBreakdown>` in checkout **+ wired the whole buy path** (see decision-log row below — this went beyond FE-09's original acceptance criteria once the gap was found) | 🔵 |
| **FE-10** | **New** — Admin panel: internal tenant-approval area + hardened Team → Gate Staff → scanner-login handshake | 🔵 |
| **FE-11** | **New** — End-to-end pivot verification, doc reconciliation, `HANDOFF-TO-BACKEND.md` finalized | 🔵 |

Once FE-11 is done: use the finalized `06-frontend-build/HANDOFF-TO-BACKEND.md` to decide where the database connects, then resume the main phase table above at P-02 (Database) onward — noting that P-02/P-04's scope will need to account for the new `TenantApplication` model and the registration/approval flow (see FE-11's acceptance criteria on `data-model.md`).

---

## How to update this file

At the end of every session:

1. Update **Last updated**, **Updated by**, **Current phase**.
2. Change the phase's status symbol in the Overview table and in its detail heading.
3. Tick completed sub-steps — **only** those you verified with evidence.
4. Add anything that blocked you to **Blockers**.
5. Log any deviation from the locked architecture in **Decision log**, with the reason.
6. Add anything surprising to **Learnings**.
7. Fill in **Metrics** as soon as a real number exists.

An unticked box is information. A ticked box that isn't actually done is a lie that costs someone else a day.
