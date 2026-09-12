# 🪔 Manhar Garba Platform — Documentation

> **Read this file first.** It tells you what everything else is and in what order to use it.

**Created:** 10 September 2026
**Source of analysis:** `../site-clone-audit/` — scrape of `https://dashboard-manhar.ticmint.com/`
**Purpose:** Build a Garba-native, multi-tenant ticketing and event-operations platform that is meaningfully better than the platform we audited.

---

## What was decided

| Question | Answer |
|---|---|
| **What are we building?** | Public booking site + organizer dashboard + offline gate scanner (3 surfaces) |
| **For whom?** | Multi-tenant white-label SaaS — many organizers, each with their own branding and subdomain |
| **Stack** | Next.js 15 · React 19 · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth + Storage + Realtime) |
| **Payments** | Razorpay, with a GST invoice + convenience-fee engine |
| **Languages** | Gujarati · Hindi · English |
| **Design stance** | Advanced underneath, obvious on top |

---

## The documents

Read in this order the first time.

| # | File | What it is |
|---|---|---|
| **1** | [`01-analysis/scrape-analysis.md`](01-analysis/scrape-analysis.md) | What the scrape actually captured, what it couldn't, and the five findings that shape the build |
| **2** | [`01-analysis/gap-analysis.md`](01-analysis/gap-analysis.md) | Everything TICMint doesn't do — including 15 Garba-specific gaps — and which we close |
| **3** | [`02-product/product-spec.md`](02-product/product-spec.md) | Vision, personas, the three surfaces, the full feature catalogue, NFRs |
| **4** | [`02-product/user-flows.md`](02-product/user-flows.md) | Every route, and the six critical flows in detail |
| **5** | [`03-architecture/tech-stack.md`](03-architecture/tech-stack.md) | Locked stack decisions, monorepo layout, env vars, coding conventions |
| **6** | [`03-architecture/data-model.md`](03-architecture/data-model.md) | The complete Postgres schema — the source of truth for all migrations |
| **7** | [`03-architecture/security-and-tenancy.md`](03-architecture/security-and-tenancy.md) | RLS strategy, the offline QR trust model, fraud controls, DPDP compliance |
| **8** | [`04-design/design-system.md`](04-design/design-system.md) | Tokens, typography, motion, component inventory, the `<ScanResult>` spec |
| **9** | [`04-design/ux-principles.md`](04-design/ux-principles.md) | The ten rules that make "advanced but easy" true, and how each is enforced |
| **10** | [`05-execution/README.md`](05-execution/README.md) | Phase index, dependency graph, milestones |
| **11** | [`05-execution/phase-00…21`](05-execution/) | 22 standalone, OpenCode-ready build files |
| **12** | [`PROGRESS.md`](PROGRESS.md) | 📊 **Live status. Update it every session.** |
| **13** | [`04-design/manharevents-screen-specs.md`](04-design/manharevents-screen-specs.md) | Screen-by-screen UI/UX spec — how the design system tokens actually compose into pages, informed by 10 curated reference designs |
| **14** | [`06-frontend-build/`](06-frontend-build/) | 🎨 **A second, leaner track: build the complete UI on mock data first, via Claude Code CLI, before wiring the database.** FE-00…FE-07 built the pre-pivot 3-surface UI; FE-08…FE-11 (added 2026-09-12) build the pivot's registration surface and rescope the rest. Read `06-frontend-build/README.md` first. |

> **Note (2026-09-11):** the product's user-facing name is now **Manharevents**. This folder's internal codename (`manhar-garba`) is unchanged — see the decision log in `PROGRESS.md`.
>
> **Note (2026-09-12) — renamed again.** The real logo arrived and its wordmark reads **ManharEvent** (singular, `.com` baked in) — this supersedes "Manharevents" above everywhere in the docs and copy. See the 🎨 BRAND entry in `PROGRESS.md` and the assets at `04-design/assets/manharevent/`.

> **🔁 Note (2026-09-12) — business-model pivot.** ManharEvent is now B2B SaaS, not a consumer marketplace: no cross-organizer city discovery, each organizer gets their own event website + admin panel + gate-scanner access on their own domain, entered through a new registration surface. Read `02-product/product-spec.md`'s pivot callout (top of that file) before anything else in this folder — it supersedes parts of docs 3, 4, and 13, and `06-frontend-build/` now has 4 additional phases (FE-08…FE-11) beyond what's summarized below. Full reasoning in `PROGRESS.md`'s decision log.

---

## How to build this with OpenCode

**One phase at a time. In order. No skipping.**

```
1. Open docs/PROGRESS.md          → find the next phase
2. Open docs/05-execution/phase-NN-*.md
3. Give OpenCode the "OpenCode prompt" at the bottom of that file
4. OpenCode reads the phase + its reference docs, then builds
5. Verify every acceptance criterion yourself — with evidence, not assumption
6. Update PROGRESS.md
7. Next phase
```

Each phase file contains:

- **Goal** — one paragraph on why this phase exists
- **Depends on / Blocks** — the real dependency chain
- **Deliverables** — what exists at the end
- **Step-by-step** — numbered, ordered, specific
- **Files created** — the exact tree
- **Acceptance criteria** — checkboxes, each independently verifiable
- **Definition of Done** — the honest bar
- **OpenCode prompt** — paste this in

---

## Rules that apply to every phase

1. **Do not reorder phases.** The dependencies are real.
2. **Do not substitute libraries.** The stack in doc 5 is locked. A change is a logged decision, not a preference.
3. **Every phase ends green:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
4. **Money is integer paise.** Never floats. Never `number` for currency.
5. **Every table has RLS.** No exceptions.
6. **Every user-visible string is translated.** No hardcoded English.
7. **Verify acceptance criteria with evidence.** A ticked box that isn't done costs someone else a day.
8. **If a doc is wrong, fix the doc in the same PR.** Documentation that drifts from reality is worse than none.

---

## The four things that make this platform different

Everything else is table stakes. These are the reasons an organizer would switch.

**1. It knows what Navratri is.**
Nine nights, season passes, zones, re-entry, themes, lineups, dress codes. A pass is `N admits × M nights × 1 zone` — one abstraction that covers every SKU a Garba organizer actually sells. Generic platforms model "an event on a date" and force everything else into workarounds.

**2. The gate works with no internet.**
Full offline validation against an encrypted local manifest. Zero network calls on the scan path. Sub-500ms verdicts, twelve scans a minute, on a cheap Android, in the dark. Garba grounds have no usable data by 8 PM — a platform that assumes connectivity fails at the only moment that matters.

**3. It speaks the buyer's language and reaches them where they are.**
Gujarati, Hindi, English. Passes on WhatsApp, not buried in email. Phone-number identity, no passwords. Four taps from event page to payment.

**4. The money is auditable.**
Double-entry ledger, GST invoices with gap-free numbering, reconciliation against Razorpay, settlement statements an accountant will accept, and refunds that invalidate a pass at the gate within seconds.

---

## Effort at a glance

| Scope | Phases | Hours |
|---|---|---|
| Launch-blocking | 00–12, 14–16, 18, 19, 21 | ~300–400 |
| Full v1 | all 22 | ~370–480 |

---

## Open items carried forward

Recorded so nobody assumes they were forgotten.

1. **WhatsApp Business API access** — apply and get templates approved early; approval takes days and is the most common launch blocker.
2. **Apple Wallet certificate** — needed for `.pkpass`; if it isn't ready, P-10 ships without it and says so.
3. **Razorpay live activation** — KYC and settlement account must be complete before P-21.
4. **Face-recognition privacy review** — P-20 ships the gallery with matching disabled if the consent story isn't airtight.
5. **Domain and hosting** — subdomain strategy needs a decision on the apex domain before P-04.
6. **First event choice** — pick a small single-night event for the soft launch, not the nine-night ground.

---

*Everything in this folder was derived from the scraped audit in `../site-clone-audit/` plus the four scoping decisions above. If any of those decisions change, the affected docs change with them — and the change gets logged in `PROGRESS.md`.*
