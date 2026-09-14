# ManharEvent — Platform Review & Master TODO
*Compiled 2026-09-14 · 6 parallel agent audits (admin, user, home, stakeholder/money, market research, DB/scale) + direct code verification.*

**This file has two parts:**
- **Part 1 — Executive summary & master TODO** (curated, de-duplicated, actionable)
- **Part 2 — Full raw research from all 6 agents** (nothing cut, for reference/drill-down)

---

# PART 1 — Executive Summary & Master TODO

## 0. TL;DR

1. **Demo UI is good; nothing underneath is real yet.** No auth, no payment gateway, no database — everything is in-memory/localStorage.
2. **Money can't move safely today.** Prices are trusted from the browser, fees/tax math is wrong in several places, and there's no real payout path to organizers.
3. **Season deadline is real:** Sharad Navratri 2026 starts **11 Oct 2026** — ~4 weeks away. A full production backend (real DB + Razorpay Route + KYC) will not be ready in time.
4. **Recommended path:** ship a **2026 bridge** (organizer uses their own Razorpay account, ManharEvent is tech-only, no money custody) for this season; build the **real split-payment model (Razorpay Route) for Navratri 2027**.
5. **Security holes confirmed in code** (not just theory): scanner login secret shipped to browser, no auth middleware on dashboard/admin, client can set its own price at checkout, emergency "kill switches" don't actually reach the attendee site or scanner.
6. **Fee/tax numbers in the code are wrong**: TDS shown at 1% (correct rate since Oct 2024 is 0.1%), GST charged even on ≤₹500 passes that should be exempt, platform fee is 1% in code but docs say 2%.
7. **Database recommendation: keep Supabase Postgres, region `ap-south-1` (Mumbai).** It's already the locked-in stack; the gap is schema quality and server-side enforcement, not the vendor.
8. **Biggest attendee-trust bug:** QR codes are unsigned stubs — a screenshot or hand-typed code gets past the gate scanner today.
9. **Biggest organizer-trust bug:** payouts shown in the dashboard are a projection, not real money movement — labeled as "Paid to you" with no actual transfer behind it.
10. **This file is the merged, de-duplicated backlog** from all 6 reviews — treat it as the single source of truth going forward; update it as items close.

---

## 1. Paisa kaise flow hoga

### 1.1 Decision: two-stage plan

| | **2026 (bridge, ships in time for this season)** | **2027 (target model)** |
|---|---|---|
| Who is merchant of record | **Organizer's own Razorpay/Cashfree account** | ManharEvent, via **Razorpay Route** (split-at-source) |
| ManharEvent's role | Tech-only: shows price, generates invoice/credit note for its own fee, **never touches buyer money** | Payment aggregator-compliant marketplace, escrow held by Razorpay, automatic transfer to organizer's linked account |
| ManharEvent gets paid | Invoice organizer monthly, or prepaid credit pack bought upfront | Fee auto-deducted at time of transfer — no invoicing needed |
| Legal/regulatory load | Low — no RBI Payment Aggregator authorization needed | Requires Route onboarding, organizer KYC, TCS/TDS registration as e-commerce operator |
| Why | No backend/KYC pipeline can be built and legally cleared in 4 weeks | Correct long-term model; matches product promise of one platform holding the money trail |

**Reasoning:** ManharEvent collecting all buyer money into its own account and paying organizers later is **payment aggregation** under RBI's Sep-2025 Payment Aggregator Master Direction — that needs authorization, escrow, and a ₹15–25cr net-worth bar. Not viable in 4 weeks. Route/Easy Split (organizer as sub-merchant, split at source) is the compliant middle path — build it for 2027, not this season.

### 1.2 Fee model — fix the code first

Current code (`packages/domain/src/logic/fees.ts`) has:
```
PLATFORM_FEE_BPS = 100   // 1%
GATEWAY_FEE_BPS  = 200   // 2%
GST charged at 18% on subtotal + both fees, no ≤₹500 exemption
```
Docs (`HANDOFF-TO-BACKEND.md §12`) say 200 bps (2%), fixture data says 2.5% — **three different numbers exist**. Pick one and delete the others.

**Corrected worked example — 2 × ₹1,000 pass (GST-exclusive, buyer pays fee):**

| Line | ₹ |
|---|---|
| 2 × pass @ ₹1,000 | 2,000.00 |
| GST on pass, 18% (organizer's supply — ₹1,000/head > ₹500, so taxable) | 360.00 |
| Booking fee (platform 1.5% + ₹5/pass = ₹35) + gateway ~2.4% (grossed up) | ~89.00 |
| GST on booking fee, 18% (ManharEvent's own supply) | ~16.00 |
| **Buyer pays** | **~2,465** |

Organizer receives ₹2,000 + ₹360 GST minus TCS (0.5%, if Route model) minus TDS (0.1%, if Route model) = **~₹2,348** (Route/2027) or **full ₹2,360 minus their own gateway MDR** (2026 bridge, since it's their own Razorpay account).

**⚠️ A ₹300 single-night pass must NOT get 18% GST** — admission ≤₹500/person to entertainment events is GST-exempt (Notification 12/2017-CT(R)). Code currently taxes it anyway. **(CA to confirm exact application to multi-night/season passes.)**

### 1.3 Recommended pricing (organizer-facing)

| Plan | Fee | Notes |
|---|---|---|
| Starter (default) | 1.5% + ₹5/pass, capped ₹99 | Matches "zero-convenience-fee" competitive pressure from Garba-specific rivals |
| Pro (≥5,000 passes/season) | 0.75% + ₹4/pass, capped ₹60 | Subscription ₹39,999/season |
| Add-ons | Device rental, on-ground staff, WhatsApp broadcast credits, box-office POS | Separate revenue lines beyond ticket fee |

Competitors charge 2–10% all-in (KonfHub 2–3.75%, AllEvents 10%, BookMyShow 10–25% unverified). Undercutting on price alone isn't the pitch — Garba-native features (season passes, offline gate scan, police capacity lock) are.

### 1.4 Compliance checklist before taking real money

- [ ] CA opinion: e-commerce operator status, GST SAC code (999692 in code is likely wrong — verify), ≤₹500 exemption on multi-night/season passes, TDS/TCS applicability
- [ ] Fix TDS rate: **0.1%** (not 1% — code has this wrong, `payouts.ts:18`)
- [ ] Organizer KYC: PAN, GSTIN, entity type, bank account + penny-drop verification, signatory ID
- [ ] Organizer agreement: fee terms, refund liability, chargeback liability, cancellation policy
- [ ] Police permission / capacity cap enforced in system before publish (Ahmedabad 2025 rules: fire NOC, capacity cap, CCTV, gender-separated gates)
- [ ] DPDP consent capture for phone/WhatsApp opt-in (substantive obligations from ~May 2027 — build the habit now)

---

## 2. Database & scaling decision

### 2.1 Choice: **Supabase Postgres, region `ap-south-1` (Mumbai)** — confirmed, keep it

- Already the locked-in stack (`docs/03-architecture/tech-stack.md`).
- Only managed option with Mumbai region + integrated RLS + Realtime + Auth + Storage in one vendor — fewer moving parts for a small team.
- Neon has no India region (nearest Singapore, +50-60ms). Firestore/Mongo lack the transactional/relational guarantees needed for money + inventory. RDS/Aurora is more ops burden for no real gain at this stage.
- **Reconsider Supabase only if:** Auth MAU billing becomes the dominant cost line at scale (~$6k/mo estimated at 200 organizers), or an enterprise client demands VPC/dedicated infra.

### 2.2 What's broken today (must fix before any real load)

- **No DB at all yet** — everything is `packages/mock-data` in-memory + Zustand/localStorage. This is fine for a demo, fatal for production.
- **Client bundle imports the data layer directly** — 17 client-side files (`"use client"`) import `@manhar-garba/mock-data` — confirmed via grep. This must move behind server actions/RPCs before a real DB lands, or all money/PII logic sits in the browser.
- **No region pin** — no `vercel.json`, so serverless functions default to `iad1` (US East). Every DB call would round-trip to the US. **Fix: pin every app to `bom1` (Mumbai) before going live.**
- **Scanner does a full linear manifest scan on every single scan** (`checkin.ts` calls `loadManifest()` then searches) — will not hit the <500ms target at 50k passes on a budget Android phone. Needs an in-memory indexed lookup (Map by pass_id).

### 2.3 Handling scale (Garba flash-sale pattern)

| Scenario | Approach |
|---|---|
| 50k buyers hit "buy" at 10am on-sale | Virtual waiting room (signed ticket + Redis counter + CDN-cached "now serving"), CDN/ISR for static event pages, so only admitted users reach checkout |
| Inventory (don't oversell) | One atomic conditional `UPDATE` per stock bucket (`sold+held+qty <= capacity`) inside a DB transaction — not app-level locking |
| Payment confirmation | Signature-verified webhook only, idempotent on payment ID, processed inside one DB transaction, side-effects (WhatsApp/PDF) via an outbox queue — never synchronous in the request path |
| 20k gate scans/night, offline | Signed (Ed25519) QR + pre-downloaded per-gate manifest in IndexedDB with in-memory Map lookup; zero network calls on the scan path; delta-sync every ~30s when online |
| Duplicate/cross-gate scans | Server-side `admissions` table with a unique constraint per (pass, night, admit slot); first valid scan wins, later ones flagged as fraud, not silently allowed |

### 2.4 Rough monthly infra cost

| Tier | Est. monthly cost |
|---|---|
| Pilot (1 organizer, 10k passes) | ~$170–350 |
| Growth (20 organizers, 300k passes) | ~$2,900–3,500 |
| Scale (200 organizers, 3M passes) | ~$29–33k (WhatsApp/SMS messaging is 45-60% of this — price it into the fee) |

Infra cost stays under ~10% of platform-fee revenue at every tier — not the bottleneck; the money-flow and trust engineering is.

---

## 3. Master TODO (de-duplicated, phased)

Legend: **P0** launch-blocker · **P1** needed for first real paid season · **P2** nice-to-have. Effort: S/M/L.

### Phase 0 — This week: stop shipping false claims / demo-safety
| ID | Task | Source | Pri | Eff |
|---|---|---|---|---|
| P0-1 | Remove/relabel UI claims that are false today: "Pass sent on WhatsApp" (not built), "Paid to you" on payouts (it's a projection), Razorpay "Verified" badge (fake), emergency controls "takes effect immediately" (they don't reach other apps) | USR-16, ADM-13, ADM-29, ADM-32 | P0 | S |
| P0-2 | Replace both dummy WhatsApp support numbers with one real number from config, used everywhere | HOME-11 | P0 | S |
| P0-3 | Remove "Internal ops" link from every organizer's sidebar/mobile nav | ADM-03 | P0 | S |
| P0-4 | Fix TDS rate 1%→0.1% in `payouts.ts`; verify GST SAC code 999692 with a CA | ADM-33, F3 | P0 | S |
| P0-5 | Fix the two duplicate `middleware.ts` files in `apps/web` (root + `src/`) — Next only runs one; confirm which and delete the other | (verified in this session) | P0 | S |

### Phase 1 — Foundation: auth, server boundary, real DB
| ID | Task | Source | Pri | Eff |
|---|---|---|---|---|
| P1-1 | Add `middleware.ts` + real auth (Supabase) to `apps/dashboard` — currently `/dashboard` and `/admin` are open to anyone with the URL | ADM-01, ARCH-08 | P0 | M |
| P1-2 | Real OTP + server session for attendees — today any 6 digits work, "session" is client-only localStorage (account-takeover trivial) | USR-47 | P0 | M |
| P1-3 | Move all mock-data/DB access out of client components into server actions/RPCs (17 files confirmed) | USR-18/19, ARCH-02 | P0 | M |
| P1-4 | Stand up real Postgres schema (Supabase, `ap-south-1`): inventory buckets, idempotency keys, webhook events, ledger, invoices, KYC docs, platform-staff role — see ARCH-03 report for full schema gaps | ARCH-03/04 | P0 | L |
| P1-5 | Pin all Vercel functions to `bom1` (Mumbai region) | ARCH-01 | P0 | S |
| P1-6 | Fix IDOR: server actions trust client-sent phone/orderId with no ownership check (`getMyAccountDataAction`, `payMockOrder`, order status page) | USR-48/49 | P0 | S |
| P1-7 | Model super-admin role properly — separate host/project, MFA, no reliance on organizer-app client state | ADM-04, ARCH-08 | P0 | M |
| P1-8 | Tenant resolution from request host, not hardcoded `"manhar"` (11+ places) | USR-46, HOME-24 | P0 | M |

### Phase 2 — Money: payments, fees/tax, payouts, refunds
| ID | Task | Source | Pri | Eff |
|---|---|---|---|---|
| P2-1 | Real Razorpay integration (2026: organizer's own account; server-side order creation, signature-verified webhook only confirms payment) | USR-01, NEEDS-02/03 | P0 | L |
| P2-2 | Recompute price server-side at checkout — client currently sends its own `unitPricePaise`/total (confirmed in code) | USR-02 (verified) | P0 | M |
| P2-3 | Fix fee engine: one implementation, ≤₹500 GST exemption, correct platform fee %, store platform/gateway/GST as separate columns (not merged into `convenience_fee_paise`) | USR-09, ADM-27, HOME-03/04, NEEDS-07, ARCH-04 (verified) | P0 | M |
| P2-4 | Atomic inventory hold/decrement — today `held_quantity`/`sold_quantity` never actually change, "N left" is fiction | USR-03 | P0 | L |
| P2-5 | Idempotent order confirmation — an order can currently be paid twice | USR-04 | P0 | M |
| P2-6 | Fix empty buyer phone bug — order created before phone is verified, pass never traceable to buyer | USR-05 | P0 | S |
| P2-7 | Add-ons quoted but not charged at checkout — fix or remove add-ons until fixed | USR-06 | P0 | S |
| P2-8 | GST invoice generation for buyer (currently none exists) | USR-10 | P0 | M |
| P2-9 | Refund request should actually block the pass at the gate — today it doesn't | USR-26, ADM-36 | P0 | M |
| P2-10 | Real payout tracking (UTR-based) — replace the projection-only tranche display | ADM-29 | P0 | M |
| P2-11 | Per-tenant fee plan support (wire up unused `TenantCommission` type) instead of one global constant | ADM-20, NEEDS-06 | P0 | M |
| P2-12 | Holdback/reserve % for refunds/chargebacks before final payout | ADM-35, NEEDS-09 | P0 | M |
| P2-13 | Organizer bank account verification (penny-drop + name match) before first payout — today it's saved with no verification | ADM-31 | P0 | M |

### Phase 3 — Gate & passes (trust layer)
| ID | Task | Source | Pri | Eff |
|---|---|---|---|---|
| P3-1 | Replace stub QR signing with real Ed25519 signatures — confirmed: `HMAC_STUB` in code, screenshot/hand-typed codes pass today | USR-15, ARCH-10 (verified) | P0 | M |
| P3-2 | Move scanner login secret server-side — confirmed: `SIGNING_SECRET = "manhar-gate-demo-v1"` ships in the client bundle | ADM-06, ARCH-11 (verified) | P0 | M |
| P3-3 | Fix scanner's hardcoded night (`night-05` confirmed in code) — derive from event schedule/date | USR-52 (verified) | P0 | S |
| P3-4 | Indexed in-memory lookup instead of full manifest scan per check-in | ARCH-12 (verified) | P0 | S |
| P3-5 | Pass detail/orders pages are client components calling the repo directly — broken for freshly bought passes | USR-18/19 | P0 | S |
| P3-6 | Wallet is sold as an add-on but never credited/usable anywhere — hide it until built | USR-29 | P0 | S |
| P3-7 | WhatsApp/SMS pass delivery (real, not just claimed in copy) | USR-16, NEEDS-28 | P0 | M |
| P3-8 | Group invite / pass transfer flows — half-built, no OTP verification per friend | USR-24/25 | P1 | L |
| P3-9 | Photo-on-pass for season/VIP passes (anti-sharing) | USR-23, NEEDS-31 | P1 | M |

### Phase 4 — Admin/ops/support
| ID | Task | Source | Pri | Eff |
|---|---|---|---|---|
| P4-1 | Wire emergency controls (pause sales, freeze, block pass) to actually reach `apps/web` and the scanner — confirmed: 0 references outside dashboard today | ADM-13 (verified) | P0 | M |
| P4-2 | Real tenant provisioning on approval — today "Approve & provision" only flips a status flag, creates nothing | ADM-16 | P0 | L |
| P4-3 | Organizer directory in super-admin (`/admin/organizers/[id]`) — profile, KYC, plan, events, payouts, team | ADM-18 | P0 | L |
| P4-4 | KYC collection + review queue at registration | ADM-17, HOME-16 | P0 | L |
| P4-5 | Oversell protection — quantity can be set below units already sold | ADM-42 | P0 | M |
| P4-6 | Cross-tenant support console: lookup by phone/order/pass, resend pass, refund | ADM-23, NEEDS-21 | P1 | M |
| P4-7 | Dispute/chargeback queue | ADM-24, NEEDS-19 | P1 | M |
| P4-8 | Fraud monitoring (bank-change alerts, refund-rate spikes, comp-pass abuse) | ADM-26, NEEDS-25 | P1 | M |
| P4-9 | Fix live dashboard's simulated fake scans polluting real check-in exports | ADM-47 | P1 | S |

### Phase 5 — Growth: home/marketing/SEO
| ID | Task | Source | Pri | Eff |
|---|---|---|---|---|
| P5-1 | Fix mobile above-the-fold on attendee event home — CTA currently below decorative elements on phone screens | HOME-01/02 | P0 | S |
| P5-2 | Finish registration status/provisioned pages — built keys exist but unused, real approval→dashboard handoff missing | HOME-13/15 | P0 | M |
| P5-3 | Add About/Contact/legal pages (currently missing, blocks Razorpay merchant verification too) | HOME-12 | P0 | M |
| P5-4 | Fix "from ₹X" price shown on home vs actual checkout price mismatch (uses lowest tier incl. expired early-bird) | HOME-11(pricing) | P1 | S |
| P5-5 | Event JSON-LD, OG images per event, sitemap per tenant/locale | HOME-23/24 | P1 | M |
| P5-6 | Social proof: real testimonials, live demo link, WhatsApp/book-a-call CTA on marketing home | HOME-19 | P1 | M |
| P5-7 | i18n sweep — checkout/pass/refund/scanner screens still hardcoded English despite gu/hi infra existing | USR-39, HOME-33-35 | P1 | M |

### Phase 6 — Scale & hardening
| ID | Task | Source | Pri | Eff |
|---|---|---|---|---|
| P6-1 | Virtual waiting room for on-sale flash traffic | ARCH-18 | P1 | M |
| P6-2 | Load testing suite (k6) against prod-sized staging before each season | ARCH-30 | P1 | M |
| P6-3 | Backups: PITR + independent nightly dump to S3 Object Lock | ARCH-17 | P1 | S |
| P6-4 | Rate limiting/bot protection on OTP send, checkout, scanner login | ARCH-15, USR-51 | P1 | M |
| P6-5 | DPDP consent capture, retention/anonymization jobs | ARCH-26, NEEDS-26 | P1 | M |
| P6-6 | Read replica + partitioning for scan_events/notifications at Growth tier | ARCH-34 | P2 | M |

### Backlog (P2 — after first real season is stable)
- Box office/offline cash sale counter with reconciliation (ADM-45, NEEDS-22)
- Sponsor ROI reports, vendor cashless wallet (NEEDS-32/33)
- Rain/cancellation bulk-refund flow, event insurance referral (USR-28, NEEDS-34)
- Rotating/TOTP-style QR for extra anti-screenshot protection (ARCH-36)
- Affiliate/influencer promo codes (NEEDS-24)
- Multi-gateway failover (Cashfree as backup) (ARCH-38)
- Google/Apple Wallet passes (USR-17)

---

## 4. Decisions the owner must take

| # | Decision | Recommendation |
|---|---|---|
| 1 | Money model for Navratri 2026 vs 2027 | 2026: organizer's own Razorpay + ManharEvent invoices its fee. 2027: build Razorpay Route split-payment properly. |
| 2 | Who absorbs the booking fee — buyer or organizer? | Buyer-pays default (matches Garba-specific competitor norm of "0% hidden fee, visible booking fee"), organizer-absorbs as a toggle |
| 3 | Pricing tier structure | Starter (1.5%+₹5/pass) / Pro (0.75%+₹4/pass, ₹39,999/season subscription) — see §1.3 |
| 4 | Realistic 2026 scope | Given 4 weeks: gate-scanner-only pilot, or bridge model with organizer's own gateway. Do NOT attempt full Route/KYC/DB migration before 11 Oct. |
| 5 | Wallet/parking add-ons | Hide from sale until actually built — currently take money for nothing delivered |
| 6 | Super-admin hosting | Separate subdomain/host + MFA, not bundled inside the organizer dashboard app |

---

## 5. Verification notes

Directly confirmed in code this session (not just agent claims):
- `PLATFORM_FEE_BPS = 100` (1%) and `GATEWAY_FEE_BPS = 200` (2%) in `packages/domain/src/logic/fees.ts`
- `TDS_194O_BPS = 100` (1%, should be 0.1%) in `apps/dashboard/src/lib/payouts.ts:18`
- `SAC = "999692"` in `finance/gst/page.tsx:11` — needs CA verification, several sources list this as a gambling-services code
- `SIGNING_SECRET = "manhar-gate-demo-v1"` hardcoded in `packages/domain/src/logic/gate-access.ts:32`
- `night_id: "night-05"` hardcoded in `apps/scanner/src/lib/db.ts:126`
- `unitPricePaise: cart.pricePaise` sent from client in `checkout-client.tsx:107`
- No `middleware.ts` in `apps/dashboard`; **two** `middleware.ts` files exist in `apps/web` (root and `src/`) — needs cleanup, Next.js only runs one
- "Internal ops" link present in both `sidebar.tsx` and `mobile-nav.tsx`, visible to every organizer
- 17 client (`"use client"`) files import `@manhar-garba/mock-data` directly
- `salesPausedGlobally`/`blockedPassCodes` (platform emergency flags): 0 references found outside `apps/dashboard` — confirms emergency controls don't reach other apps
- No `vercel.json` anywhere in repo — confirms no region pin exists

**Note:** the automated cross-agent web fact-checking loop (GST/TCS/TDS rates, RBI rules, competitor pricing) was interrupted by a rate limit before completing all passes. Tax/compliance rates cited in §1 come from each agent's own web research (Part 2 below) and should get a final CA sign-off before going live.

---
---

# PART 2 — Full Raw Research (all 6 agents, unedited)

> Everything below is the complete, unabridged output of each review agent. Part 1 above is a curated summary of this; use this section when you need the full detail, evidence, or reasoning behind any item.

---

## A1. Admin Dashboard Review — `apps/dashboard` (organizer + super-admin)

### A. What exists and works (short)

**Organizer dashboard**
- **Event setup:** create an event in a wizard, or clone one. Cloning copies zones, gates, pass types, price tiers, add-ons and policy (`lib/dashboard-store.ts:630-878`).
- **Editors:** pass types with the Garba model (kind × admits × nights × zone) and price tiers, add-ons, nights and lineup, venue/zones/gates, and refund/re-entry policy with a check that refund tiers don't go up closer to the event.
- **Publishing:** publish/unpublish and unlisted mode are saved. A pre-publish checklist reads real data. The share link and a print-quality QR code work.
- **Team and gate staff:** Indian phone validation; issue, regenerate and revoke gate codes, and send them on WhatsApp. The gate coverage view is built from real data.
- **Finance:**
  - Overview donut, order ledger, refund queue and payout tranches are all calculated.
  - Payout tranches: blocks of 3 nights, settled 2 days later, minus TDS and refunds.
  - GST page: monthly summary, a B2CS-shaped CSV export and a printable invoice.
  - Bank account form: typed twice, IFSC format check, masked, logged.
- **CRUD and exports:** vendors and sponsors have full add/edit/delete. CSV export (safe against formula injection, BOM so Excel reads ₹ correctly) exists on attendees, check-ins, orders, the audit log, payouts and reports.
- **UI:** a mobile drawer nav exists, and most lists have empty states with a call to action.

**Super-admin**
- `/admin` overview.
- `/admin/tenants` list with filters, plus a detail page with approve / reject / ask for more info. These call server actions that write to the in-memory mock store.
- `/admin/emergency`: every control needs a typed phrase and a reason, and there is an audit trail.

### B. Findings

Priority: **P0** = launch blocker, **P1** = needed for the first real season, **P2** = nice to have.

#### B1. Auth, roles and security

| ID | Area | Problem | Evidence | Why it matters | Fix | P | Effort |
|---|---|---|---|---|---|---|---|
| ADM-01 | Auth | No authentication anywhere in the dashboard: no middleware, no session. `/dashboard` and `/admin` are open to anyone with the URL. | `apps/dashboard/src` has no `middleware.ts`; comment at `app/(admin)/admin/layout.tsx:13-16` | Anyone can see every organizer's takings and attendee phone numbers, and press the emergency buttons. | Supabase auth plus `middleware.ts` protecting `/dashboard/*` (tenant member) and `/admin/*` (internal staff). Put internal ops on its own host (e.g. `ops.manharevent.com`). | P0 | M |
| ADM-02 | Authz | The server actions `approveApplicationAction` / `rejectApplicationAction` do no caller check. Server actions are public POST endpoints. | `app/actions/tenant-applications.ts:10-26` | Anyone who finds the action ID can approve or provision a tenant. | Check for a super-admin session inside each action, and record `reviewed_by`. | P0 | S |
| ADM-03 | Role boundary | Every organizer sees an "Internal ops" link to `/admin`, including the emergency page. | `components/dashboard/sidebar.tsx:173-181`, `components/dashboard/mobile-nav.tsx:121-129` | Organizers can reach platform-wide kill switches and other tenants' applications. | Remove the link. Show internal nav only when the session has the internal role. | P0 | S |
| ADM-04 | Super-admin role | There is no internal staff model. Emergency actions are all attributed to one fixed string. | `lib/platform-store.ts:67` (`ACTOR = "Manhar Creatives — platform ops"`); `docs/03-architecture/data-model.md` §11 | You can't tell who froze a tenant or paused sales. | Add `internal_staff (profile_id, role: super_admin \| ops \| finance \| support)` and record the actor id and IP on every action. | P0 | M |
| ADM-05 | Organizer roles are UI-only | Roles are one client-side `currentRole` value, changed with a "Demo: viewing as" dropdown. `RoleGate` only hides buttons. | `components/dashboard/role-gate.tsx:11-14`, `app/(dashboard)/dashboard/team/page.tsx:113-126` | Any user can pick "Owner". Finance screens, payouts and bank change have no gate at all, so a gate_staff login could change the payout account. | Enforce server-side from `tenant_members.role`; derive UI permissions from a permission map. | P0 | M |
| ADM-06 | Secret in client bundle | The gate code signing secret ships to the browser, and codes are computed there. | `packages/domain/src/logic/gate-access.ts:32`, `lib/dashboard-store.ts:562-572` | Anyone can create a working scanner login for any phone number. | Move issuing and checking codes server-side (`scanner_login_codes`, stored as a hash), as HANDOFF §11 already plans. | P0 | M |
| ADM-07 | PII and bank data in localStorage | The whole store (full bank account number, buyer phones and emails, team phones) is saved to localStorage. | `lib/dashboard-store.ts:397-399`, `:442-447`, persist `name: "manhar-dashboard"` at `:1269` | A shared or stolen laptop leaks the payout account and the attendee list. Masking is only visual. | Keep bank and PII server-side only; store just the last 4 digits client-side. | P0 | M |
| ADM-08 | Audit log trustworthiness | The page says entries "cannot be edited or deleted", but they live in localStorage. The actor is whoever the demo dropdown says. | `settings/audit/page.tsx:125`; `lib/dashboard-store.ts:469`, `:948` | Useless as evidence in a refund or payout dispute. | Append-only `audit_log` table written by server functions, with `actor_id`, `actor_role`, before/after values and IP. | P1 | M |
| ADM-09 | Removing a member doesn't revoke scanner access | `removeTeamMember` removes the person but leaves their scanner credential active. There is also no confirmation dialog. | `lib/dashboard-store.ts:499-503`; `team/page.tsx:196-197` | A fired guard's code keeps working; the scanner checks the separate `gateStaff` fixture. | On removal, revoke all of that person's credentials and add a confirm step. | P1 | S |
| ADM-10 | Dev gallery ships in production | The `(dev)/gallery` route is part of the production build. | `app/(dev)/gallery/page.tsx`, `layout.tsx` | Clutter, and it exposes internal components. | Exclude it when `NODE_ENV=production`, or guard it behind a flag. | P2 | S |
| ADM-11 | CSP only reports | The Content Security Policy doesn't enforce anything yet. | `apps/dashboard/next.config.ts:16-35`, `:37` | Weaker protection against XSS on a money dashboard. | Switch to enforcing with a nonce once pages render server-side. | P1 | S |
| ADM-12 | PII export has no permission check | Any role can download attendee name, phone, email and amount as CSV. | `events/[id]/attendees/page.tsx:38-45`; `finance/orders/page.tsx:37-47` | Data leak risk under the DPDP Act. | Allow export only for owner and finance, and log each export in the audit log. | P1 | S |

#### B2. Super-admin

| ID | Area | Problem | Evidence | Why it matters | Fix | P | Effort |
|---|---|---|---|---|---|---|---|
| ADM-13 | Emergency controls do nothing | Pause sales, freeze, block pass, offline-allow and banner only write to the dashboard's own localStorage. No other app reads them. | `lib/platform-store.ts:111-199`; `grep salesPausedGlobally\|frozenTenantIds\|blockedPassCodes\|banners` outside `apps/dashboard` returns **0 matches** | The screen tells the operator the change "takes effect for real attendees immediately" (`emergency/page.tsx:75-76`), which is false. A real incident would go unhandled. | Store flags in a `platform_flags` table. `apps/web` checkout and middleware must check pause/freeze, the scanner manifest must carry blocked passes and the offline-allow flag, and the web layout must render the banner. Until then, label the screen as simulated. | P0 | M |
| ADM-14 | Emergency page is hardcoded to one tenant and event | Freeze, revoke, offline-allow and banner always target the seeded Manhar tenant and event. | `emergency/page.tsx:64-67`, `:166`, `:389` | Can't act on Rajkot or Surat tenants. | Add tenant and event pickers, and put the same actions on a tenant detail page. | P0 | S |
| ADM-15 | Inconsistent confirmations | Resume sales, lift freeze, turn off offline-allow, unblock pass and remove banner run on one click with no reason. Block pass has no typed phrase. | `emergency/page.tsx:96-98`, `:123-126`, `:165-168`, `:207-211`, `:222-226` | Reversals are just as dangerous and need a reason in the log. | Use `DangerConfirm` with a reason on every change of state. | P1 | S |
| ADM-16 | Approving doesn't provision anything | "Approve & provision" only flips status and timestamps. No tenant, owner login, commission record or domain is created, yet the UI says "Approved and provisioned". There's no confirm step, and errors are ignored (`ok:false` is dropped). | `packages/mock-data/src/repo.ts:585-595`; `components/admin/tenant-approval-actions.tsx:30-35`, `:52` | An approved organizer has no dashboard. The claim is misleading. | Build `provision_tenant()` (data-model §9): create the tenant, branding, commission and owner membership, invite by OTP, confirm dialog, error toast, notify the applicant by WhatsApp/SMS. | P0 | L |
| ADM-17 | No KYC in onboarding | The application collects only org name, contact name, phone, city, capacity and desired subdomain. There's no PAN, GSTIN, legal entity type, address, bank, signatory, documents or past events. | `packages/domain/src/entities/tenant.ts:94-109`; `apps/marketing/.../register/verify/page.tsx:192-249`; `admin/tenants/[id]/page.tsx:50-87` | You can't legally pay out or issue tax invoices, and there's no fraud screening. (The seeded "more info needed" reason even mentions PAN/GSTIN, which the form never collects.) | Add KYC fields, document upload (PAN, GST certificate, cancelled cheque, entity proof, event or police permission), a reviewer checklist, and per-document approve/reject with a reason. | P0 | L |
| ADM-18 | No directory of live organizers | `/admin/tenants` lists applications only. The overview hardcodes one tenant card, and approved applications link back to the application page. | `admin/page.tsx:126-141`, `:142-160` | No place to manage a live tenant (plan, fees, status, events, payouts, users). | Add `/admin/organizers` and `/admin/organizers/[id]` with tabs: profile/KYC, plan & fees, events, GMV, payouts, team, audit, danger zone. | P0 | L |
| ADM-19 | Overview numbers are wrong or stale | "Live organizers" = `1 + approved`. "Gross ticket sales" sums `total_paise`, which includes fees and GST. The page is a client component reading the static fixture bundle, so approvals made through the server action never show up here. | `admin/page.tsx:1`, `:7-13`, `:46`, `:49` | The owner's first screen shows wrong figures. | Build it server-side from the database: GMV split into ticket / platform fee / gateway / GST, plus tenant counts by status. | P1 | M |
| ADM-20 | No per-tenant fees or plans | The platform fee is one global constant, and the event wizard says fees have "nothing to configure". `TenantCommission` exists as a type and fixture but is never used. Three different rates appear: code 1%, docs 2%, fixture 2.5% with ₹20 min / ₹500 max. | `packages/domain/src/logic/fees.ts:20`; `HANDOFF-TO-BACKEND.md` §12; `packages/mock-data/src/fixtures/tenant.ts:33-41`; `components/dashboard/event-wizard.tsx:282-285` | The product spec (P5) says ops "set that organizer's platform fee". Negotiated deals can't be honoured. | Let ops set the plan and commission (percent/flat/min/max, absorbed vs passed to buyer) at approval. `computeFees(subtotal, commission)`. Save a fee snapshot on each order. | P0 | M |
| ADM-21 | No lifecycle states | Tenant status (`pending \| active \| suspended`) is modelled but never used. "Freeze" is only an emergency flag, with no suspended-for-non-payment or offboarding states. | `packages/domain/src/entities/tenant.ts:11`; `lib/platform-store.ts:131-148` | No way to suspend for KYC failure, unpaid dues or a contract ending, or to archive. | Add a state machine (applied → KYC pending → active → suspended → offboarded) with a reason and expiry. | P1 | M |
| ADM-22 | No impersonation ("log in as organizer") | Not built. | — | Support can't reproduce organizer problems. | Time-limited, read-only by default, requires a reason, banner shown inside the organizer UI, audit-logged, organizer notified. | P1 | M |
| ADM-23 | No support or order lookup | No cross-tenant search by phone, order number or pass code; no ticket queue. | — | "My pass isn't working" calls at 9pm need a lookup within seconds. | `/admin/support`: global search, order timeline, resend pass, block pass, notes. | P1 | M |
| ADM-24 | No disputes or chargebacks | Nothing handles Razorpay dispute webhooks, evidence or pass blocking tied to disputes. | — | Chargebacks on festival tickets are common. Without holdbacks Manhar absorbs the loss. | Dispute queue with evidence upload, auto-block of affected passes, and deduction from the tenant's holdback. | P1 | M |
| ADM-25 | No feature flags or notification templates | `feature_flags` and `notification_templates` exist in the data model only; there is no admin UI. | `data-model.md` §7 | Can't enable modules per plan or manage DLT/WhatsApp template approvals. | Flags page per tenant; template registry with approval status and language versions. | P2 | M |
| ADM-26 | No fraud monitoring | No alerts for bank-account changes, comp-pass spikes, refund-rate spikes, repeated failed payments, or scans spiking at one gate. | — | Takeover of an account plus a bank change can redirect a season's takings. | Rules engine with an alerts inbox; bank change requires a cooling-off period (see ADM-31). | P1 | M |

#### B3. Money flow and finance

| ID | Area | Problem | Evidence | Why it matters | Fix | P | Effort |
|---|---|---|---|---|---|---|---|
| ADM-27 | Platform fee not recorded separately | Checkout adds platform fee and gateway fee into one `convenience_fee_paise` on the order. | `packages/mock-data/src/repo.ts:314`; `packages/domain/src/entities/order.ts:39` | Afterwards you can't calculate Manhar's revenue per order, tenant or month. It also contradicts the "two separate lines" promise. | Order columns `platform_fee_paise`, `gateway_fee_paise`, `gst_on_fees_paise`, `ticket_gst_paise`, plus a commission snapshot; write ledger entries. | P0 | S |
| ADM-28 | No platform revenue view | Super-admin has no GMV, fee earned, gateway cost, per-tenant commission, invoices or receivables. | `admin/page.tsx` (only gross and passes) | The owner can't see what Manhar earns. | `/admin/revenue` (see below). | P0 | M |
| ADM-29 | Payouts are a projection shown as fact | Tranche gross is `quantity_sold × tier price`, not captured payments. Status flips to "settled" by date alone, so "Paid to you" shows money with no transfer or UTR. | `lib/payouts.ts:52-60`, `:78`; `finance/payouts/page.tsx:52`; the admission is at `metrics.ts:10-13` | An organizer believes money was sent when nothing was. It won't match the bank statement. | Show "Projected" until a real payout exists. Build payouts from ledger and Route transfer webhooks with UTR. | P0 | M |
| ADM-30 | Numbers don't reconcile | Finance overview and payouts use price tiers; orders and GST use order records. Refunds and orders pages aren't filtered by event, while the finance overview is. | `finance/page.tsx:32-35`; `finance/orders/page.tsx:31`; `finance/refunds/page.tsx:31`; `finance/gst/page.tsx:46` | Finance (persona P4 "Meena") fails if the numbers don't tie out. | One ledger as the source of truth, plus a reconciliation report (orders vs payments vs transfers vs refunds). | P0 | M |
| ADM-31 | No bank verification | The account is saved immediately. There's no penny drop, no name match against the account holder, no OTP or re-login, no cooling-off period, no ops approval and no alert to the owner. The seeded holder is "Manhar Creatives Pvt Ltd", the platform's own name. | `settings/payments/page.tsx:133-155`; `lib/dashboard-store.ts:443-444`, `:1226-1232` | The classic payout-fraud path, and payouts to a wrong account can't be reversed. | Razorpay fund-account validation or Cashfree penny drop, name match against PAN, owner OTP, 48–72h hold on the next payout, ops review, WhatsApp and email alert. | P0 | M |
| ADM-32 | Razorpay shown as "Verified" but not integrated | Status badge and `rzp_live_••••` are hardcoded; no Route linked account exists; the GSTIN is hardcoded. | `settings/payments/page.tsx:29-37`, `:107` | False reassurance. The actual collection model is undecided in code. | Replace with the real linked-account activation status. | P0 | M |
| ADM-33 | TDS rate out of date | TDS under section 194-O is hardcoded at 1%. It has been 0.1% since 1 Oct 2024. It is also only relevant if Manhar collects the money as an e-commerce operator. | `lib/payouts.ts:18` | Over-deducting from organizers is a compliance problem. | Make it config (`platform_config.tds_194o_bps = 10`), applied only in the Route model; produce Form 26Q / 16E data. Confirm with a CA. | P0 | S |
| ADM-34 | GST logic is wrong for real use | Several problems (confirm rates with a CA): 18% GST applies to every pass, including the ₹499 starter pass. Admission of ₹500 or less per person to dance or music events is exempt. Platform and gateway fees go on the organizer's invoice under the organizer's SAC and GSTIN. Organizer taxable value includes the fees. Supplier GSTIN is hardcoded and doesn't match the tenant fixture. Place of supply is hardcoded to Gujarat. SAC 999692 here vs 998554 in the data model. "GST (remitted)" on the finance page includes GST on fees the organizer doesn't remit. | `fees.ts:51-52`; `dashboard-store.ts:786`; `finance/gst/page.tsx:12`, `:50`, `:80`, `:86`; `fixtures/tenant.ts:12`; `data-model.md` invoices `hsn_sac`; `finance/page.tsx:44` | Wrong tax invoices for thousands of buyers. The organizer's GSTR-1 would be misfiled. | Two invoices per order: (1) the organizer's admission invoice under the organizer's GSTIN, POS = venue state, with the ≤₹500 exemption; (2) Manhar's platform-fee invoice under Manhar's GSTIN. Tax rules as data. | P0 | M |
| ADM-35 | No holdback or chargeback reserve | Refunds are only taken from not-yet-settled tranches. Once all have settled, what's owed disappears silently. There's no reserve % and no negative balance. | `lib/payouts.ts:82-93` | After the last payout, Manhar pays the refunds and chargebacks itself. | Reserve % per plan held until T+N after the last night, a negative balance carried forward, and a recovery invoice. | P0 | M |
| ADM-36 | Refund approval has no side effects | Approving doesn't invalidate passes, update the scan manifest, call a gateway refund or reverse the Route transfer. There's no maker-checker for large amounts. | `lib/dashboard-store.ts:943-972` | A refunded pass still gets in at the gate. Money isn't returned. | `apply_refund()` (data-model §9): pass status, manifest version bump, Razorpay refund with `reverse_all`, ledger entries, two-person approval above ₹X. | P0 | M |
| ADM-37 | No payout statement or organizer invoices | Only a tranche CSV. No PDF statement with UTR, no monthly platform-fee invoice to the organizer, no TDS certificate download. | `finance/payouts/page.tsx:30-36` | Organizers' accountants need these at year end. | Statement PDF per payout; invoices section; Form 16E / TCS certificate section. | P1 | M |
| ADM-38 | Leakage around the platform fee | Comp passes, offline or box-office sales and vendor revenue carry no platform fee or cap. Comp passes don't even create a pass. | `components/.../comps/page.tsx:17-22`; `lib/dashboard-store.ts:476-480`; vendors seeded revenue `:150-152` | An organizer can issue unlimited comps and sell them for cash, bypassing Manhar's fee. | Free comp quota per plan, fee per comp beyond it, comp approval trail, box-office sales through the ledger with the fee. | P1 | M |
| ADM-39 | Duplicate, unused fee logic | `computePriceBreakdown` (commission model) is exported but used nowhere, alongside `computeFees`. | `packages/domain/src/logic/price-breakdown.ts:29`; `packages/domain/src/index.ts:27-28` | Invites the "three fee rates" bug again. | Merge into one `computeFees(subtotal, commission, taxRules)`. | P1 | S |

#### B4. Organizer dashboard gaps (vs BookMyShow, Insider, District, Eventbrite, KonfHub)

| ID | Area | Problem | Evidence | Why it matters | Fix | P | Effort |
|---|---|---|---|---|---|---|---|
| ADM-40 | Team roles | Only 4 roles (owner, finance, gate_staff, vendor) vs 8 in the domain model. No manager or support role, no per-event scoping, no invite/accept flow, no ownership transfer. | `lib/dashboard-store.ts:39`; `packages/domain/src/entities/tenant.ts:13-21`; `team/page.tsx:36-67` | Real committees have 5–15 people with different access. | Permission matrix, OTP invites, per-event scope, ownership transfer with ops approval. | P1 | M |
| ADM-41 | Gate codes and gates tied to the seeded event | Scanner codes are always derived for the seeded event. Team, gate coverage and vendor zone lists read mock-data gates and zones, not the current event. | `dashboard-store.ts:567-571`; `team/page.tsx:8`, `:151`; `team/gate-staff/page.tsx:6`, `:34`; `vendors/page.tsx:15`, `:224` | A cloned or new event can't be staffed at its own gates. | Scope gates, staff and codes by event id. | P1 | S |
| ADM-42 | No oversell protection | Quantity is only checked to be ≥ 1: it can be set below the number sold, and pass inventory × admits isn't checked against zone capacity. No reservation or hold logic. | `events/[id]/passes/page.tsx:302-306`; `packages/domain/src/logic/capacity.ts:11-19` (display only) | 25,000-person grounds and on-sale rushes oversell. | `reserve_inventory` with row locks; validate qty ≥ sold; warn when Σ(qty × admits) exceeds zone capacity per night. | P0 | M |
| ADM-43 | Promo codes do nothing | Promos are stored globally (no event, validity dates or pass-type limits). `apps/web` never reads them: zero matches for "promo" in `apps/web/src`. The toast says buyers can use the code "straight away". | `lib/dashboard-store.ts:112-120`, `:435-438`; `events/[id]/promos/page.tsx:45`; `repo.ts:212-213` reads a separate fixture | False claim to organizers. | Promo table scoped to event, date window, pass types, per-phone limit, stacking rules; wire into checkout. | P1 | M |
| ADM-44 | Comp passes are just a list | No pass, QR or inventory change, no delivery to the guest, no approval or quota. | `comps/page.tsx:17-22`; `lib/dashboard-store.ts:476-480` | Guests can't get in. | Issue a real pass (₹0 order), send it on WhatsApp, approval above a quota, count against inventory. | P1 | M |
| ADM-45 | No box office | No offline cash/UPI counter sale, no quick-issue at the gate, no end-of-day cash-drawer reconciliation. | — | Garba grounds sell a lot at the gate. Without it that cash is off-platform. | Box-office mode on tablet: sell and print/WhatsApp the pass, cash/UPI tag, reconcile by counter and staff. | P1 | L |
| ADM-46 | No attendee messaging | The gate announcement is only logged. No WhatsApp or SMS broadcast to buyers by event, night, zone or pass type. The notifications page claims templates are "pre-approved" and "DLT-registered". | `events/[id]/live/page.tsx:29-38`, `:102-104`; `settings/notifications/page.tsx:69` | Rain delays and gate changes need to reach attendees. The DLT/WhatsApp claim is untrue. | Broadcast composer with segments and message credits; correct the copy. | P1 | M |
| ADM-47 | Live dashboard polluted by simulated scans | The gate simulation is on by default. It adds fake scans with hardcoded tenant, event and gate ids every 3 seconds while the overview or live page is open. They feed "Inside now" and the check-in CSV export. | `lib/dashboard-store.ts:456`, `:1243-1266`; `components/dashboard/checkin-feed.tsx:54-60` | Fake footfall can reach real exports. | Off by default, clearly labelled, never written to the real check-in log. | P1 | S |
| ADM-48 | "Attendees" means orders | Search and export run on orders; there are no pass holders, no per-pass status, and no resend, transfer or cancel actions. There is also no order detail page. | `events/[id]/attendees/page.tsx:24-32`; `finance/orders/page.tsx` | The top support action ("resend my pass") is impossible. | Attendee and pass table with holder names; order detail with timeline, resend, refund and block. | P1 | M |
| ADM-49 | Checklist sends organizers to dead ends | "Cover image" points to branding, which has no image upload (colours only). "Event description" points to the event overview, which has no description editor (`updateEvent(` has no callers). | `components/dashboard/pre-publish-checklist.tsx:38-39`; `settings/branding/page.tsx:47-51` | Breaks the "no dead ends" rule in TODO. | Event details editor (description, cover, gallery, FAQ) and logo upload. | P1 | S |
| ADM-50 | Vendors and sponsors are CRM stubs | Vendor revenue is seeded and static, with no wallet sales, commission or settlement (the data model has `commission_bps`). Sponsors have no deliverables, invoices or payment tracking. | `lib/dashboard-store.ts:149-159`, `:1190-1224` | Real money flow (F&B wallet, sponsor fees) isn't tracked. | Vendor settlement ledger with commission; sponsor contract, invoice and deliverables. | P2 | M |
| ADM-51 | Missing standard organizer tools | Bulk upload (pass holders or comps via CSV), waitlist, scheduled price-tier switching (dates exist on tiers but aren't editable), sales by channel/UTM, daily sales report by date, onboarding checklist across the account, help/support entry point. | `PriceTier.starts_at/ends_at` are set to null and never edited (`dashboard-store.ts:1115-1117`); order UTM fields unused | Parity with Insider, District, KonfHub. | Add as a P2 backlog. Tier scheduling and a sales-by-day report are P1. | P2 | M |
| ADM-52 | Domain verification is simulated | "Simulate DNS found" button; subdomain uniqueness isn't checked; the custom domain is seeded as verified. | `settings/domain/page.tsx:116-131`; `dashboard-store.ts:420-425` | Clearly labelled, but provisioning is manual. | Vercel/Cloudflare domain API, uniqueness check at approval. | P1 | M |

#### B5. UX

| ID | Area | Problem | Evidence | Why it matters | Fix | P | Effort |
|---|---|---|---|---|---|---|---|
| ADM-53 | Navigation | 13 event tabs in one horizontal scroll strip. Finance, promos and team are scoped to "current event" in some places and global in others. The sidebar event switcher is an invisible `<select>`. | `components/dashboard/event-shell.tsx:10-24`; `sidebar.tsx:63-79` | Organizers lose track of which event they're editing. | Group tabs (Setup / Sell / Operate / Money), always show event context in finance, one scoping rule. | P1 | M |
| ADM-54 | Missing confirmations | Price tier removal, team member removal, publish/unpublish, promo pause, sponsor status cycling, tenant approve: all run on one click. | `passes/page.tsx:528-536`; `team/page.tsx:196-197`; `publish/page.tsx:22-32`; `sponsors/page.tsx:127-131`; `tenant-approval-actions.tsx:76` | Unpublishing mid-sale takes the booking page offline instantly. | ConfirmDialog on destructive or high-impact actions; publishing checks for open orders. | P1 | S |
| ADM-55 | Loading and error states | Most money pages render the bare text "Loading…". Server-action failures are ignored. There's no retry or offline state. | `finance/page.tsx:23`; `finance/payouts/page.tsx:16`; `finance/gst/page.tsx:44`; `tenant-approval-actions.tsx:31-34` | Once a real API is behind these, failures will be silent. | Skeletons, error boundaries per section, toast plus retry. | P1 | S |
| ADM-56 | Mobile | The drawer nav exists (good), but DataTables and the GST invoice list are desktop-shaped. The admin header nav wraps. The comps form is a fixed 2-column grid. | `events/[id]/comps/page.tsx:36`; `admin/layout.tsx:26-42` | Owners check sales on their phones. | Card layout for tables below `sm`; test at 360px. | P2 | S |
| ADM-57 | Docs drift | `HANDOFF-TO-BACKEND.md` §12 says the platform fee is 200 bps (2%) but the code has 100 bps (1%). `DEMO-AUDIT-PLAN.md` §4.1 still lists hardcoded refunds and payouts that are now fixed. | as cited | The next developer builds against the wrong numbers. | Update the docs. | P2 | S |

### C. Money flow: current state vs required

#### C1. How the organizer gets paid

**Current state (what the code does):**
1. The buyer checks out on `apps/web`. `computeFees(subtotal)` adds platform fee 1% + gateway fee 2% + 18% GST on everything (`fees.ts:47-61`).
2. The "Pay" button calls `completeMockOrder`, which marks the order paid and merges platform and gateway fees into `convenience_fee_paise` (`repo.ts:314`). There is no Razorpay, no webhook and no recorded split of who owns what money.
3. The dashboard ignores those orders for payouts. `payoutTranches()` spreads `tier.quantity_sold × price` evenly across nights, groups nights into blocks of 3, sets a settle date 2 days after each block, subtracts 1% TDS and subtracts approved refunds from unsettled blocks only (`lib/payouts.ts`).
4. A tranche's status becomes "settled" when its date passes (`payouts.ts:78`), and the page shows it as "Paid to you".
5. The bank account is a localStorage record with a format check only (`settings/payments/page.tsx`).
6. None of the following exist: KYC, penny drop, Razorpay Route linked accounts, transfers, UTRs, payout records, ledger entries, holdback, chargebacks, negative balances, TDS certificates, platform-fee invoices.

**Required, step by step (Razorpay Route model is recommended for a per-ticket fee business):**

| # | Step | What to build | Who sees it |
|---|---|---|---|
| 1 | **KYC at registration** | Legal entity type, PAN, GSTIN (or a non-registration declaration), registered address, authorised signatory, bank account + cancelled cheque, document uploads (`tenant_kyc`, `tenant_documents`). | Organizer form; admin KYC review queue |
| 2 | **Bank verification** | Penny drop / fund-account validation; name match against PAN; mark the account verified with reference id and timestamp. | Admin sees result; organizer sees "Verified" (real) |
| 3 | **Razorpay Route linked account** | On approval, create the linked account (stakeholder + route product config with bank). Store `razorpay_account_id` and activation status from webhooks. Publishing is blocked until the account is activated. | Admin tenant page; organizer payments page; pre-publish checklist item |
| 4 | **Commission snapshot** | At approval ops set the plan and `tenant_commission` (percent/flat/min/max, passed to buyer or absorbed). Every order stores its fee snapshot. | Admin "Plan & fees" tab, with audit |
| 5 | **Checkout split** | Razorpay order on Manhar's account with a `transfers[]` entry to the linked account: ticket amount (+ ticket GST if the organizer is GST-registered), `on_hold: true`, `on_hold_until` = the settlement rule. Platform fee + its GST stays with Manhar. The gateway fee is absorbed from Manhar's portion or passed through. | — |
| 6 | **Ledger** | `confirm_order()` writes double-entry rows: gross_sales, platform_fee, gateway_fee, gst_payable (split organizer vs Manhar), tds/tcs, refunds, payout. | Both finance screens read only the ledger |
| 7 | **Settlement schedule and holdback** | Per plan: optional pre-event advance (e.g. X% of captured sales at T+7 after KYC, for vendor deposits); night-block releases; reserve Y% held until last night + N days. Stored as `settlement_rules`. | Admin config; organizer sees a projected schedule labelled "Projected" |
| 8 | **Release and UTR** | Cron lifts `on_hold` when due. `transfer.settled` webhook stores UTR in `payouts`. Only then does status become "Paid". | Organizer payouts page with UTR; statement PDF |
| 9 | **Refunds** | `apply_refund()`: Razorpay refund with `reverse_all` on the transfer (or deduct from next release if already settled); pass invalidated; manifest version bumped; ledger updated. Two-person approval above a threshold. | Organizer refund queue; admin cross-tenant refund monitor |
| 10 | **Chargebacks** | Dispute webhooks go to an admin dispute queue: auto-block the pass, freeze the amount from the reserve, upload evidence, record the outcome in the ledger. | Admin disputes; organizer notified |
| 11 | **Negative balance** | If reversals exceed pending funds: carry forward to the next event, or issue a recovery invoice with dunning. Block new payouts until cleared. | Admin collections |
| 12 | **Tax outputs** (confirm with CA) | Organizer admission invoice (organizer GSTIN, POS = venue state, ≤₹500 exemption). Manhar platform-fee invoice. If Manhar is the e-commerce operator collecting money: TDS 194-O at 0.1% and GST TCS under section 52 (0.5%), with Form 16E / GSTR-8 data and downloadable certificates. | Organizer tax documents section; admin compliance exports |
| 13 | **Bank change control** | Owner OTP, re-verification, 48–72h payout hold, ops approval above a GMV threshold, WhatsApp and email alert to the owner and the previous contact. | Organizer payments page; admin fraud alerts |

*The alternative model*, where each organizer uses their own Razorpay account, removes Manhar's TDS/TCS and e-commerce operator obligations. But Manhar could then only collect its fee through invoices or subscriptions, which means collections risk and fees that are no longer visible to buyers. Decide this before P-09.

#### C2. How Manhar earns

**Current state:**
- The only revenue concept is `PLATFORM_FEE_BPS = 100` (1%), one global constant, added on top of the buyer's price (`fees.ts:20`). The docs and the tenant fixture say 2% and 2.5%.
- The fee isn't stored separately on orders (`repo.ts:314`), so it can't be summed.
- The super-admin sees only "Gross ticket sales", computed from `total_paise` (`admin/page.tsx:49`).
- There is no subscription, setup fee, message credits, add-on billing, Manhar invoice, GSTIN, receivables or per-tenant commission.
- Comp passes, box office and vendor/F&B sales earn Manhar nothing.

**Required:**

| Revenue line | Mechanism | Where the super-admin sees it |
|---|---|---|
| Per-ticket platform fee (core) | `tenant_commission` per tenant, snapshot per order, kept via Route | Revenue dashboard: by day, tenant and event; effective take rate |
| Setup / onboarding fee (optional, per plan) | Invoice at approval, payable before publish or deducted from the first release | Collections: invoiced / paid / overdue |
| Plan subscription (e.g. Pro: custom domain, lower %, more comps) | `plans` + `tenant_subscriptions`; yearly per season | MRR/ARR, plan mix |
| WhatsApp / SMS credits | Prepaid wallet per tenant; each send debits it at cost + margin | Credits sold vs provider cost |
| Comp passes beyond quota / box-office fee | Flat ₹ per comp or offline ticket beyond the free quota | Leakage report: comps as a share of sold, box-office volume |
| Add-ons (custom domain, photo gallery / face search, vendor wallet commission) | Feature flags tied to plan or one-off purchase | Add-on revenue by tenant |
| Gateway margin (if negotiated below the rate charged) | Difference between charged gateway fee and actual Razorpay MDR | Gateway P&L line |

**Super-admin revenue screens to build:**
- `/admin/revenue`: GMV, ticket value, platform fee earned, gateway cost, GST on fees, net revenue, refunds reversed, chargeback losses; filter by date, tenant or event.
- `/admin/organizers/[id]/billing`: plan, commission history, invoices issued by Manhar, credits balance, receivables, negative balance.
- `/admin/payouts`: every release across tenants (scheduled / on hold / released / failed, UTR, holdback held); a manual hold or release override with reason and two approvers.
- `/admin/compliance`: TDS 194-O / TCS registers, Manhar's GSTR-1 for platform-fee invoices, export per quarter.

### D. Top 10 things to build next for the admin side, in order

1. **Auth and role boundary (ADM-01 to 05).** Supabase auth, `middleware.ts`, an `internal_staff` table with super_admin / ops / finance / support roles, server-side checks in every server action, remove the "Internal ops" link from the organizer nav, put ops on its own host.
2. **Real provisioning and an organizer directory (ADM-16, 18, 21).** `provision_tenant()`, tenant lifecycle states, `/admin/organizers/[id]` with profile, events, team, status and audit. Approval sends an OTP invite to the owner.
3. **KYC and bank verification pipeline (ADM-17, 31).** Extend the registration form (PAN, GSTIN, entity type, bank, documents), an admin KYC review queue with per-document decisions, penny drop with name match, and bank-change controls.
4. **Plans and per-tenant commission (ADM-20, 27, 39).** `tenant_commission` + `plans` editable by ops with audit; `computeFees(subtotal, commission, taxRules)`; separate fee columns and a commission snapshot on every order; delete `computePriceBreakdown`.
5. **Razorpay Route plus ledger plus settlement engine (ADM-29, 30, 32, 35).** Linked account creation and activation webhooks, transfers held until due, settlement rules with reserve %, append-only `ledger_entries`, `payouts` with UTR. Relabel the current tranche UI as "Projected" until this lands.
6. **Platform revenue and collections dashboard (ADM-28, C2).** GMV and fee earned by tenant, event and day; Manhar invoices (own GSTIN); receivables and negative balances; message-credit wallet.
7. **Refunds, chargebacks and disputes console (ADM-24, 36).** `apply_refund()` with transfer reversal and pass/manifest invalidation, maker-checker above a threshold, a dispute queue fed by Razorpay webhooks, automatic pass blocking and reserve deduction.
8. **Emergency controls that actually work (ADM-13 to 15).** Flags in a DB table read by `apps/web` (pause, freeze, banner) and the scanner manifest (blocked passes, offline-allow); tenant and event pickers; a reason on every reversal; server-side append-only audit with real actor and IP.
9. **Tax compliance engine (ADM-33, 34, 37).** Organizer admission invoices under the organizer's GSTIN with the ≤₹500 exemption and venue-state place of supply; Manhar platform-fee invoices; TDS 194-O (0.1%) and TCS (0.5%) registers and certificates if Route is chosen; payout statement PDFs. Validate every rate with a CA before go-live.
10. **Support, impersonation and fraud tooling (ADM-22, 23, 25, 26, 38).** Global search by phone, order or pass code with resend/block; audited, time-limited "log in as organizer"; feature flags per plan; WhatsApp/DLT template registry; fraud alerts (bank change, comp or refund spikes, payment-failure velocity); comp quota and fee rules to close the fee leakage.

Organizer-side items that should run in parallel before the first season: oversell protection (ADM-42), real comp passes and promos wired to checkout (ADM-43, 44), refund side effects (ADM-36), and turning off the fake scan simulation (ADM-47).

---

## A2. Attendee/User Side Review — `apps/web` (and `apps/scanner` from the gate's side)

### A. What exists and works

- **Event site:** home, event page, lineup (per night), night pages, venue (OpenStreetMap embed, how to reach, gates), FAQ (refund answer built from the shared tiers), gallery (drawn art, no photos), artist pages. All are server components built from fixtures.
- **Booking (`/e/[slug]/book`):**
  - Four steps: zone, pass type, quantity, add-ons.
  - Sold-out and low-stock states, and a live fee summary on desktop (side panel) and mobile (sticky bar).
  - The price shown is the tier that is on sale now (`lib/pricing.ts`).
- **Fees:** calculated in one place (`packages/domain/src/logic/fees.ts`). Platform fee and gateway fee are separate lines.
- **Checkout:** phone → OTP (any code accepted) → pay button. The mock payment marks the order paid and issues one pass per unit, each with a real, scannable QR image you can download as PNG.
- **My account:**
  - `/me/passes` loads through a server action.
  - `/me/refunds` shows the refund tier, the amount, and a request button.
  - `/me/wallet` is an honest empty state.
- **Group invites (`/g/[code]`):** real lookup, a progress bar, and a form for a friend to add their name and phone.
- **i18n:** en/gu/hi message files have identical keys (0 missing). Security headers are set, but CSP is report-only.
- **Scanner:**
  - Sign-in needs a phone on the roster plus a derived code.
  - Pass list cached offline (IndexedDB), with 8 verdicts including partial admits, wrong night and wrong zone.
  - Manual code entry with entry/exit mode.
  - Check-in queue keyed on `client_uuid`, and `staff_id` recorded on every scan.

### B. Findings

#### Buy flow, money and inventory

| ID | Area | Problem | Evidence | Why it matters | Fix | Pri | Eff |
|---|---|---|---|---|---|---|---|
| USR-01 | Payment | No payment gateway. "Pay" calls `completeMockOrder` from the browser: no Razorpay order, no UPI intent, no webhook, no signature check. | `checkout-client.tsx:85-117`, `actions/order.ts:28-31`, `repo.ts:305-384` | Nothing can be sold. | Create a Razorpay order on the server, open Checkout.js / UPI intent on mobile, and add `/api/webhooks/razorpay`. Only a verified webhook may confirm the order and issue passes. | P0 | L |
| USR-02 | Payment | Prices come from the client. `payMockOrder` accepts `unitPricePaise`, `subtotalPaise`, `totalPaise` and `quantity` from the localStorage cart, with no check against the server. | `checkout-client.tsx:100-113`, `cart-store.ts:16,95` | Anyone can edit localStorage and buy a ₹8,999 pass for ₹1. | Recompute totals on the server from `pass_type_id`, tier, quantity, add-ons and promo. Ignore client amounts. | P0 | M |
| USR-03 | Inventory | No stock hold and no oversell protection. `held_quantity` and `sold_quantity` are never changed. `expires_at` (15 min) is set but never enforced. The UI promises a 10-minute hold, which never happens. | `repo.ts:270` (only `expires_at` write); `en.json Book.holdNote` | "N left" never moves. Two buyers can take the last VIP pass during the on-sale rush. | Hold stock atomically when the order is created (row lock or conditional update), release it on expiry via cron, and turn the hold into a sale on webhook. Show a countdown at checkout. | P0 | L |
| USR-04 | Checkout | An order can be paid twice. Neither the checkout page nor `completeMockOrder` checks `order.status`; paying again appends more passes. | `checkout/[orderId]/page.tsx:17-22`, `repo.ts:308-318` | Duplicate charges and passes. The same problem appears with webhook retries. | Redirect a paid order to its status page. Make confirmation idempotent on `provider_payment_id`, with a unique constraint on passes per order item. | P0 | M |
| USR-05 | Checkout | **Bug:** a first-time buyer's order has an empty phone. The order is created with `buyerPhone: phone ?? ""` before sign-in, and the phone entered at checkout is never written back to the order. | `book-client.tsx:161-166`, `checkout-client.tsx:55-76` (phone only goes to the auth store); `repo.ts:311-318` | The pass never shows in My Passes and can't be refunded, because both look orders up by phone. | Set `buyer_phone` and `buyer_name` on the server from the verified session when paying. Better: require the verified phone before creating the order. | P0 | S |
| USR-06 | Checkout | **Bug:** add-ons are in the quoted total but not in the charged total. Book adds `addonsTotal`; checkout uses `pricePaise × quantity` only. Add-ons are never stored as order items. | `book-client.tsx:133` vs `checkout-client.tsx:37`; `repo.ts:322-335` (`addon_id: null`) | Contradicts the "same number by construction" claim. Parking and wallet add-ons are "sold" but never charged or delivered. | Build the order lines on the server, including add-on order items. | P0 | S |
| USR-07 | Checkout | OTP can be skipped. The checkout opens straight on the pay step if any phone is in the store, and `/auth/start` stores the phone before OTP. | `checkout-client.tsx:30`, `auth/start/page.tsx:29` | Anyone can buy on someone else's number. | Decide the step from a verified server session, not the stored phone. | P0 | S |
| USR-08 | Checkout | There are no pending, failed or retry states. The status page always says "Payment successful!", even for an unpaid order. | `order-status-client.tsx:26-28`, `status/page.tsx:17-24` | A UPI payment that is still pending, or that failed, is shown as success. | Status page reads the order status: pending (poll or realtime), failed (retry with the same order and cart), expired (start again). Also show "Payment received, pass is being issued". | P0 | M |
| USR-09 | Fees | GST isn't shown as its own line at checkout ("included" text only), while the booking page does show it. Fee labels are English literals. The order stores platform and gateway fees merged into `convenience_fee_paise`. | `checkout-client.tsx:227-242`, `repo.ts:314` | Breaks the promise of fully itemised fees. Storing them merged makes a correct invoice impossible. | Add a GST line to `FeeBreakdown`. Store `platform_fee_paise` and `gateway_fee_paise` separately. Move labels to i18n. | P1 | S |
| USR-10 | Invoice | No GST invoice for the buyer. The `Invoice` entity exists, but nothing generates one, there's no download in `/me/orders`, no order detail page, and no way to enter a GSTIN for business buyers. | `domain/entities/order.ts:104-120`; `me/orders/page.tsx` (list only) | India needs a tax invoice with GSTIN, SAC, CGST/SGST/IGST and place of supply. | Generate a numbered PDF invoice per order on confirmation (per-tenant series). Add an order detail page with download and an optional GSTIN field at checkout. | P0 | M |
| USR-11 | Pricing | The event page's "from ₹X" uses the lowest price of all tiers, including the closed Early Bird, so it disagrees with booking. `lib/pricing.ts` was written to fix exactly this. | `e/[eventSlug]/page.tsx:85-88,115-118,191` | Shows ₹6,999, then charges ₹8,999. Bad for trust. | Use `eventFromPricePaise()` and `<Money>`. | P1 | S |
| USR-12 | Pricing | A tier change after selection isn't picked up: `pricePaise` is saved in the cart when you choose. There's no re-check of stock or `max_per_order` on the server. | `cart-store.ts:74-75`, `book-client.tsx:152-156` | You can be charged a stale price or buy beyond limits. | Re-price and re-validate on the server when creating the order. | P0 | S |
| USR-13 | Promo | The cart has promo fields and `getPromoCode` exists, but there's no promo input and no discount logic. | `cart-store.ts:19-20,86-87`, `repo.ts:212` | A standard sales lever (sponsor and college codes) is missing. | Add a promo input with server-side checks (usage cap, validity window, zone/pass scope). | P1 | M |
| USR-14 | Errors | "Continue to Pay" has `try/finally` with no `catch`, so a failure just resets the button with no message. | `book-client.tsx:158-171` | The buyer is stuck with no explanation. | Add a toast and a retry. | P1 | S |

#### Pass delivery and QR security

| ID | Area | Problem | Evidence | Why it matters | Fix | Pri | Eff |
|---|---|---|---|---|---|---|---|
| USR-15 | QR | The QR is static and unsigned: `MG26.v1.<passId>.HMAC_STUB`, with guessable pass IDs. The scanner only checks the shape. | `repo.ts:358,368`; `scanner/lib/crypto.ts:35-47` | A screenshot or a hand-typed payload works. The only defence is the manifest match. | Sign the QR on the server (HMAC or Ed25519, verify key in the manifest) with non-sequential IDs. For season passes, consider a rotating QR (TOTP-style, 30–60s) in the app or wallet pass. | P0 | M |
| USR-16 | Delivery | No WhatsApp, SMS or email delivery, yet the UI claims it: "Pass also sent on WhatsApp and SMS". | `en.json Status.whatsappNote`, `Checkout.whatsappDelivery`; `order-status-client.tsx:33-36` | A false claim. People lose the pass tab and there's no fallback. | WhatsApp template (Gupshup/Interakt/Meta) with QR image and pass link, SMS fallback, delivery log, and a "Resend pass" button. Remove the claim until then. | P0 | M |
| USR-17 | Delivery | No Apple or Google Wallet pass and no PDF (`pdf_url`/`wallet_pass_url` always null). | `repo.ts:373-374` | Wallet passes work offline at gates with bad network. | Generate PKPass / Google Wallet objects plus a PDF on confirmation. | P1 | M |
| USR-18 | Pass page | **Bug:** the pass detail page is a client component that calls `getPass()` in the browser. The browser has its own fresh fixture copy, so a pass bought this session isn't found and shows 404. It also bundles the whole mock-data package, including the gate-staff roster, into client JS. | `me/passes/[passId]/page.tsx:1,8,36-38,56-57` | "Open pass" from the confirmation screen breaks, and data leaks into the bundle. | Make it a server component (or server action) that checks ownership, and remove mock-data imports from client files. | P0 | S |
| USR-19 | Orders page | Same pattern: `me/orders` calls `listOrdersByPhone` in the browser, so it never shows new orders. | `me/orders/page.tsx:1,8,22` | A broken screen. | Use a server action or server component, like `/me/passes`. | P0 | S |
| USR-20 | My Passes | Pass cards aren't links. There is no way from My Passes to the QR or detail page. | `me/passes/page.tsx:113-126` | At the gate the holder can't find their QR. | Wrap each card in a Link, or show the QR inline. | P0 | S |
| USR-21 | Pass page | No name on the pass: the detail page hardcodes `holderName={t("guest")}`. The status page shows `buyer_name ?? "Guest"`, which renders blank because the name is `""`. | `[passId]/page.tsx:76,80`; `order-status-client.tsx:47`; `book-client.tsx:165` | Guards can't match a person to a pass. | Show holder names from `pass_holders` and a formatted night range. | P1 | S |
| USR-22 | Offline | The pass isn't available offline. There's no service worker or manifest on web, and `layout.tsx` points to `/manifest.webmanifest`, which doesn't exist (404). | `[locale]/layout.tsx:64`; `apps/web/public` has only `brand/` | Venues have poor connectivity, and the QR fetch happens client-side at the gate. | Add a PWA with cached "My passes", or push people to wallet or WhatsApp image delivery. | P1 | M |
| USR-23 | Anti-fraud | Nothing stops a screenshot or a shared pass: `requires_photo` is false on every pass type, joiners get `photo_url: null`, and cross-device anti-passback only works between tabs on one phone (`BroadcastChannel`). | `pass-types.ts:38…213`, `repo.ts:770`, `scanner/lib/realtime.ts:38-45` | Season passes (₹9k) will be shared on night 1. | Photo capture for season/VIP passes, photo shown on the scanner, realtime check-in sync plus a server-side fraud flag. | P1 | L |
| USR-24 | Group | Group splitting is half-built. The buyer has no UI to create or share an invite (only 2 seeded codes). Joining only adds a name, with no OTP on the friend's number and no separate QR per friend. Codes are guessable (`RAJESH-4E5F` embeds the pass code). | `group-invites.ts:13-26`, `actions/group.ts:6-15`, `repo.ts:755-777` | The documented differentiator (flow F4) doesn't exist. A 4-admit family pass means everyone must arrive together. | "Share spots" on the pass page that mints random invite codes, OTP-verified join, one sub-QR per holder (admit index), and a progress view for the buyer. | P1 | L |
| USR-25 | Transfer | Transfer to a friend isn't built. `transferred` status and `is_transferable` exist, but there's no action or UI. | `domain/entities/pass.ts:7`, `pass-types.ts:39`, `scanner/lib/validate.ts:216-224` | The most common attendee request ("I can't come, give it to my cousin"). | Transfer with OTP from both sides, old QR revoked, new QR issued, audit log, per-pass-type limits and cut-off. | P1 | M |

#### After purchase

| ID | Area | Problem | Evidence | Why it matters | Fix | Pri | Eff |
|---|---|---|---|---|---|---|---|
| USR-26 | Refunds | A refund request doesn't mark passes `refund_pending`, so they still scan. Only whole orders can be refunded (no per-pass partial). The buyer can't cancel a request. | `repo.ts:679-707`; `me/refunds/page.tsx:172-175` | Someone can get a refund and still enter. You can't refund one pass of four. | Mark passes pending or blocked in the manifest on request, allow per-pass selection and a free-text reason, and let the buyer withdraw. | P0 | M |
| USR-27 | Refunds | The quote measures from the event's first night, but the legal page says "first night the pass covers". A weekend pass (nights 6–9) gets a lower percentage than it should. | `repo.ts:645-654` vs `legal/refund-policy/page.tsx:36-38,54` | Wrong money plus an inconsistent policy means disputes and chargebacks. | Compute from `min(pass.night_ids)` and snapshot the event's own policy. | P1 | S |
| USR-28 | Refunds | There is no event cancellation or rain flow. The legal page promises a full refund including fees if an organizer cancels, but no bulk refund, per-night cancellation credit, or notice exists. | `legal/refund-policy/page.tsx:7-14,77-84` | Rain-outs on Navratri nights happen. Without a flow, support floods WhatsApp. | Organizer "cancel night" that notifies everyone, chosen compensation (credit, extra night, pro-rata refund), and a bulk refund job. | P1 | L |
| USR-29 | Wallet | The F&B wallet is sold as a ₹500 add-on but never credited. The wallet page shows a hardcoded ₹0 and says "Top up at checkout". | `pass-types.ts:264-265`, `me/wallet/page.tsx:40` | Money is taken for something that doesn't exist. | Remove the wallet add-on until it's built, or build it: ledger, top-up, vendor scan, history, auto-refund of unused balance. | P0 (hide) / P2 (build) | S / L |
| USR-30 | Parking | The parking add-on creates no parking pass or QR, and the scanner has no parking gate mode. | `pass-types.ts:248-249`, `repo.ts:322-335` | You'd pay for parking and get nothing to show. | Issue add-on entitlements with their own QR or scan type. | P1 | M |
| USR-31 | Upgrades | No zone upgrade or add-nights. A single-night pass is hardcoded to night 5 with no night picker. | `scanner/lib/validate.ts:244`; `pass-types.ts:205`; `night/[n]/page.tsx:143-145` | Single-night buyers can't choose their night, which is Garba's biggest-volume ticket. | Night picker for single-night/weekend kinds, then upgrade and add-night flows that pay the difference. | P0 (night picker) / P1 (upgrades) | M |
| USR-32 | Support | Support is a hardcoded wa.me number that differs from the tenant's support phone. | `trust-strip.tsx:15`, `me/refunds/page.tsx:194` (919876500000) vs `tenant.ts:14` (+919876543210) | Messages go to the wrong number. | Use the tenant setting, pre-fill the order number, add a help page. | P1 | S |
| USR-33 | Notifications | No reminders (D-7, D-1, gates open), no lineup or night-theme alerts, no rain or change notices. | No banner component in apps/web | This is what drives turnout and cuts gate chaos. | Template engine (WhatsApp) with opt-in capture (DPDP), per-event schedule, and a site banner from the database. | P1 | M |
| USR-34 | Lost pass | The only recovery is signing in again with the phone. There's no change-of-number flow, no help-desk lookup with ID check. | `auth-store.ts` (phone is the only identity) | Lost or stolen phones during a 9-night season are common. | Support tool: verify identity, reissue QR (new signature), block old QR. | P1 | M |

#### Attendee needs vs BookMyShow / District / Paytm Insider, and Garba-specific

| ID | Area | Problem | Evidence | Why it matters | Fix | Pri | Eff |
|---|---|---|---|---|---|---|---|
| USR-35 | Entry rules | No structured entry rules: couple/stag entry, ladies-only zones or nights, age limits, ID proof for season passes, prohibited items, re-entry policy. | `event-content.ts:59-64`, `en.json Me.gateHint` | These are the most-asked Garba questions and gate-dispute triggers. | Per-pass-type rules (gender mix, age band, ID required, re-entry), shown on booking and pass. | P1 | M |
| USR-36 | Venue | No venue map linking zone to gate to parking. No live crowd or gate-queue status. | `venue/page.tsx:90-103` | Crowd flow at 20k-person grounds. | Illustrated venue map, "Your gate: Gate 2", live gate load from check-in data. | P2 | M |
| USR-37 | Content | No photos at all (hero, gallery, artists as initial letters). | `artist/[artistSlug]/page.tsx:43-45,81-85`; `gallery/page.tsx:59` | Premium feel and conversion. | Media upload in the dashboard, `next/image` with sizes, artist-to-event join. | P1 | M |
| USR-38 | Discovery | Nothing to follow or remind: no "remind me when on sale", no add-to-calendar, no share with a WhatsApp preview. | — | WhatsApp is the whole growth channel. | Share buttons with OG images, .ics download, waitlist for sold-out zones. | P2 | S |

#### UX, i18n, accessibility, performance, SEO

| ID | Area | Problem | Evidence | Why it matters | Fix | Pri | Eff |
|---|---|---|---|---|---|---|---|
| USR-39 | i18n | Many attendee files have no translation calls at all (all English): artist, faq, gallery, lineup, night, venue, `me/refunds`, error pages. Partial: `order-status-client`, `checkout-client`. | grep of files without `useTranslations`/`getTranslations` | Gujarati and Hindi buyers hit English exactly on the money and gate screens. | Sweep into `packages/i18n`, and make legal bodies and FAQ content per-locale. | P1 | M |
| USR-40 | i18n | Dates and money are forced to English: `toLocaleDateString("en-IN")`. | `me/orders/page.tsx:57,62`; `me/passes/page.tsx:143` | Inconsistent in gu/hi. | Use the active locale, and store content per language. | P2 | M |
| USR-41 | Navigation | The header always shows "Sign in" (even when signed in). Sign-in always lands on `/me/passes` with no return to checkout. | `site-header.tsx:31-33`; `me/layout.tsx:25-31` | Confusing on mobile. Signing in mid-purchase loses context. | Header aware of the session, active tab, `returnTo` parameter. | P1 | S |
| USR-42 | Accessibility | Tabs on `/me/passes` are plain buttons (no `role="tab"`). English aria-labels. | `me/passes/page.tsx:69-83` | Screen readers and WCAG. | Proper ARIA tab pattern and labels via i18n. | P2 | S |
| USR-43 | Performance | All `/me/*` pages are client components with fetch waterfalls. | `me/*/page.tsx` line 1 `"use client"` | Slow pass load at the gate on 3G. | Server components with streaming. | P1 | M |
| USR-44 | SEO | Event pages have no OG image, no hreflang alternates, and no schema.org `Event` JSON-LD. | `e/[eventSlug]/page.tsx:25-37`; `lib/seo.ts:26` | Google event rich results and WhatsApp previews are free traffic. | Per-event `generateMetadata` with OG image, `Event` + `Offer` JSON-LD. | P1 | S |
| USR-45 | SEO | The sitemap hardcodes one event, three artists and no locale variants. | `app/sitemap.ts:6-24`; `app/robots.ts:11` | Private order URLs could be indexed. | Build the sitemap from the database per tenant and locale. | P1 | S |
| USR-46 | Multi-tenant | The tenant is hardcoded as `getTenantBySlug("manhar")` in 5+ places. | `[locale]/layout.tsx:37`; `site-header.tsx:13` | The second organizer's site will show Manhar's brand. | Resolve the tenant from the host in middleware. | P0 | M |

#### Security

| ID | Area | Problem | Evidence | Why it matters | Fix | Pri | Eff |
|---|---|---|---|---|---|---|---|
| USR-47 | Auth | No real OTP and no server session. Any 6 digits pass. The "session" is a Zustand localStorage flag that anyone can set. | `auth/verify/page.tsx:43-51,95-102`; `auth-store.ts:28-40` | Account takeover is trivial: set the victim's phone in localStorage. | Supabase phone auth or MSG91 OTP, HttpOnly session cookie, per-phone and per-IP limits, backoff, Turnstile. | P0 | M |
| USR-48 | IDOR | Server actions trust a phone or order ID sent by the client, with no session check. | `actions/me.ts:61`; `actions/refunds.ts:40,85`; `actions/order.ts:28` | A pass code alone admits at the gate via manual entry, so enumerating phones steals entries. | Get the phone from the session on the server and check ownership in every action. | P0 | S |
| USR-49 | IDOR | `/checkout/[orderId]/status` shows the QR for any order ID, with no ownership check. | `status/page.tsx:17-33` | Walk the IDs and screenshot other people's QRs. | Random IDs (UUIDv4 or ULID), ownership check or a signed short-lived view token. | P0 | S |
| USR-50 | Secrets | The gate-code secret and the full fixture data (gate-staff phones, all pass payloads) end up in client bundles. | `domain/logic/gate-access.ts:32`; `me/passes/[passId]/page.tsx:8` | Anyone can mint scanner logins and read the roster. | Move code issue and verify to the server, keep `mock-data`/`repo` server-only. | P0 | S |
| USR-51 | Abuse | No bot protection or queue for the on-sale spike, no Turnstile, no rate limits on server actions. | `next.config.ts:19-43` | Scalpers and bulk bookers on Early Bird day. | Turnstile at order creation, per-phone purchase caps, waiting room for drops. | P1 | M |

#### Scanner problems that affect the attendee's pass

| ID | Area | Problem | Evidence | Why it matters | Fix | Pri | Eff |
|---|---|---|---|---|---|---|---|
| USR-52 | Gate | The scanner's night is fixed at `night-05`. It isn't derived from today's date. | `scanner/lib/db.ts:126-127`; `scanner/lib/manifest.ts:5` | On Oct 2 every night-specific pass reads "NOT VALID TONIGHT". | Derive the active night from the event schedule in IST. | P0 | S |
| USR-53 | Gate | A pass bought online never reaches the scanner's pass list (separate process). | `scanner/lib/manifest.ts:14-17` | A buyer who pays at 8pm outside the gate is rejected. | Real database, incremental pass-list updates, online lookup fallback. | P0 | M |
| USR-54 | Gate | No supervisor override. | `domain/entities/pass.ts:11`; `scanner/lib/validate.ts:206-214` | Real disputes at the gate have no recorded resolution. | Supervisor PIN override with a reason. | P1 | S |

#### Legal

| ID | Area | Problem | Evidence | Why it matters | Fix | Pri | Eff |
|---|---|---|---|---|---|---|---|
| USR-55 | Legal | Terms, privacy and refund pages are placeholder text in English only. No DPDP consent checkbox for WhatsApp/SMS. | `legal/privacy/page.tsx:8-11`; `legal/terms/page.tsx:7-8` | Legally required before taking money. | Lawyer review, organizer-specific terms, consent capture, `/me/account/delete`. | P0 | M |

### C. Ideal attendee journey, and what's missing at each step

1. **WhatsApp link or poster QR → event page.** Missing: per-event OG image and JSON-LD, correct "from" price, tenant not hardcoded, no photos.
2. **Read the rules.** Missing: structured entry rules, venue/gate/parking map, per-event refund policy, gu/hi content.
3. **Choose passes.** Missing: night picker, promo input, real stock numbers, add-ons carried into checkout.
4. **Verify phone (OTP).** Currently any code works and session is client-only; OTP can be skipped; no return to where you were; order never gets the phone.
5. **Hold and pay.** Missing: everything — gateway, server-side pricing, holds.
6. **Confirmation.** Status always "success"; duplicate payment possible; no invoice.
7. **Delivery.** None of WhatsApp/SMS/Wallet exists, UI falsely claims it.
8. **Share spots and transfer.** Invites are seed-only with no per-friend QR; no transfer.
9. **Before the event.** No reminders, no cancellation flow.
10. **At the gate.** Pass detail broken for new passes; no link from My Passes; no offline support; unsigned QR; no photo/name; scanner fixed on Night 5; new passes missing from pass list.
11. **During the season.** Add nights, upgrade zone, wallet top-up, parking QR, live crowd, help chat, lost-phone recovery — all missing.
12. **Refund or cancellation.** Request doesn't block passes; wrong starting night for quote; no cancellation flow; no wallet refund; no ownership check on actions.

### D. Top 10 to build next for the user side

1. **Real identity and access control** — OTP provider, HttpOnly session, rate limits, ownership checks everywhere, random IDs, secrets out of client bundles.
2. **Server-side order engine** — re-price on server, atomic stock hold with expiry, night picker.
3. **Razorpay integration** — server order, UPI intent, signature-verified webhook, idempotent, pending/failed/retry/expired screens.
4. **Signed QR and correct gate** — HMAC/Ed25519 QR, scanner night from schedule, incremental pass-list sync, refund/transfer blocks pushed fast.
5. **Pass delivery** — WhatsApp template + SMS fallback, resend, PDF, then wallet passes.
6. **My Passes that works at the gate** — server-rendered, linked cards, holder name, offline cache.
7. **GST invoice and fee integrity** — separate fee storage, itemised GST, invoice PDF, optional GSTIN.
8. **Refunds done properly** — per-pass partial, correct quote basis, passes blocked on request, per-event policy, hide wallet/parking until they deliver.
9. **Group sharing and transfer** — invite links, OTP-verified joiners with sub-QR, OTP transfer, photo capture for season passes.
10. **Launch hygiene** — tenant from host, legal pages + DPDP consent, gu/hi sweep, per-event OG/JSON-LD, noindex on private routes, WhatsApp reminders.

---

## A3. Home Pages Review — `apps/marketing` and `apps/web` home

### A. What exists and works

**Marketing (`apps/marketing`)**
- **Home** has a hero with one main CTA (Register) and a second one (Pricing). The cost reassurance sits next to the CTA.
- **Rest of home:** a band of honest product facts, how-it-works in 3 steps, value props, a 4-question FAQ and a closing CTA.
- **Language and SEO:** everything is translated to en/gu/hi with 0 missing keys. Hreflang, canonical and x-default are correct. One JSON-LD `@graph`, sitemap and robots.txt.
- **Pricing** is honest and checkable. Shows a worked ₹1,000 example and a 3-price table, both calculated by the same `computeFees` that checkout uses.
- **Register** is 3 steps (phone → OTP → details) with a step indicator. Demo shortcuts labelled, fields validate, OTP auto-advances, tap targets 44px+, skip link, self-hosted fonts.

**Attendee home (`apps/web/[locale]/page.tsx`)**
- Single-organizer landing: dates and venue in the hero, a clear "Book Passes" CTA, zone cards with correct "from" price.
- A 9-night lineup where each night links to its own page, closing CTA with WhatsApp button.

### B. Findings

| ID | Page | Problem | Evidence | Why it matters | Fix | P | E |
|---|---|---|---|---|---|---|---|
| HOME-01 | Attendee home | On phones the 340px night wheel is `order-first`, so it sits above the H1, dates and Book button. | `apps/web/.../[locale]/page.tsx:165-166`, `hero-night-wheel.tsx:57` | Visitors arrive from Instagram/WhatsApp and have to scroll past decoration before they can buy. | Drop `order-first` below `lg` and move the wheel under the CTA. | P0 | S |
| HOME-02 | Attendee home | No sticky mobile Book bar on home. | `mobile-bottom-nav.tsx:10-15`; `e/[eventSlug]/page.tsx:191` | Once the hero scrolls away there is nothing to tap to buy. | Render `StickyBookBar` on home. | P0 | S |
| HOME-03 | Pricing / fees | GST of 18% is charged on the ticket and both fees, on top of the price. A ₹1,000 pass costs the buyer ₹1,215.40. | `packages/domain/src/logic/fees.ts:47-61`; `pricing/page.tsx:120-161` | Buyers see 21.5% on top at checkout. | Support GST-inclusive display, let organizer choose how fees show. | P0 | M |
| HOME-04 | Pricing / fees | GST is modelled wrongly: admission of ₹500 or less is generally GST-exempt, yet the ₹300 row charges GST; who owes GST is never addressed. | `fees.ts:47-61`; `pricing/page.tsx:37,164-199` | The pricing page publishes tax figures that may be wrong. | Get a CA to confirm. Add "organizer GST-registered?" flag and the ≤₹500 exemption. | P0 | M |
| HOME-05 | Pricing | No "who pays the fee" toggle and no calculator. | `en.json:445`; `pricing/page.tsx:120-199` | Organizer's first question is "what do I take home on 5,000 passes?" | Add a calculator: price, passes, buyer-pays vs absorb, GST inclusive/exclusive. | P1 | M |
| HOME-06 | Pricing / fees | The gateway fee is 2% of the ticket price, but Razorpay charges on the full amount captured. Gap unowned. | `fees.ts:50-52` | Adds up to a real, unowned loss across a season. | Calculate gateway fee on the total (solve for gross). | P1 | S |
| HOME-07 | Pricing / payouts | How payouts work is unclear — whose merchant account, what KYC, holdback for refunds. | `en.json:443`; TODO.md §4.3–4.4 | "How and when do I get paid" is the deciding question for an organizer. | Add payout timeline section and KYC checklist. | P1 | M |
| HOME-08 | Home / pricing copy | Copy contradicts itself: hero says "your own site"; FAQ/form say subdomain. "Start selling the same day" ignores payout KYC. | `en.json:387,405,407`; `v/:313-332` | Careful readers find promises that don't match. | Pick one answer, change "same day" to "once KYC verified". | P1 | S |
| HOME-09 | Pricing | Only one plan and no add-on list. | `pricing/page.tsx` (whole file) | Big grounds expect managed service; unpriced items become arguments later. | Offer Standard/Managed/Enterprise + add-on table. | P2 | M |
| HOME-10 | Pricing | Competitor claims are unsourced and dated. | `en.json:414`; `pricing/page.tsx:217-220` | Comparative advertising risk. | Dated comparison table with sources. | P2 | S |
| HOME-11 | Marketing (all) | The WhatsApp support number is dummy `919876543210`, used in footer + status screen + fixtures. Trust strip uses another dummy, `919876500000`. | `marketing-footer.tsx:9`; `s/:133`; `tenant.ts:14` | Anyone who taps it messages a stranger. | Put one real number in env/config. | P0 | S |
| HOME-12 | Marketing footer | Legal links point to the attendee app, fall back to `http://localhost:3000`. No About, Contact, business address, organizer agreement, DPDP notice. | `marketing-footer.tsx:6,54-56` | Razorpay's website check needs Contact, Terms, Privacy and Refund pages. | Add marketing `/about`, `/contact`, `/legal/*`, localized. | P0 | M |
| HOME-13 | Register status | The demo funnel stops at "Under review". Translated keys for summary/timeline/demo-approve exist but the page uses none of them. | `s/:85-91`; en `RegisterStatus.*` (unused) | AUDIT-2026-09-13 says this journey completes, it doesn't. | Build the timeline, summary and demo approve button with the existing keys. | P0 | M |
| HOME-14 | Register status | The error-state retry button is labelled "Checking..." and calls `router.refresh()`, which does nothing. | `s/:60` | Anyone who hits an error is stuck. | Use `t("retry")` and re-run the fetch. | P1 | S |
| HOME-15 | Provisioned | The handoff isn't real — website button opens the generic demo, dashboard opens with no sign-in token, no `.catch`. | `p/:15-17,34,68,76,83-87` | "What happens after approval" is where onboarding stalls. | Add a one-time sign-in link, real tenant URLs, error handling. | P1 | M |
| HOME-16 | Register details | The form is too thin for approval and payouts — no email, event dates, venue, entity type, GST flag. | `v/:15-21,84-96`; TODO.md §4.1 | Team can't verify "the event is real" and payouts can't be set up. | Two stages: apply (thin) then KYC in dashboard after approval. | P1 | M |
| HOME-17 | Register | Weak validation: phone checked for length only, not shared normalizePhone; subdomain not checked live; opening `/verify` directly skips OTP. | `register/page.tsx:21`; `v/:108,111` | Bad/spoofed applications, subdomain clashes. | Shared zod schema client+server, guard on `otpVerifiedAt`, live slug check. | P1 | M |
| HOME-18 | Register | No consent to Terms before collecting personal data. Draft isn't saved, refresh loses the form. | `v/:164-170`; `registration-store.ts:37-38` | DPDP requires notice and consent. | Add consent checkbox, save draft, 30s resend timer. | P1 | S |
| HOME-19 | Marketing home | No social proof: no testimonials, organizer logos, dashboard/scanner screenshots, or live demo link. | `page.tsx:121-236` | Garba committees decide over WhatsApp/calls, want to see it working. | Add "Open a live sample site", scanner video, WhatsApp CTA, pilot testimonial. | P1 | M |
| HOME-20 | Marketing header | On mobile, How it works and Pricing are hidden with no hamburger. | `marketing-header.tsx:31` | Most traffic is mobile; Pricing is the 2nd most important page. | Add a sheet menu or text link. | P1 | S |
| HOME-21 | Marketing home / pricing | Page-level `openGraph` replaces layout's, losing images/siteName. | `page.tsx:60`; `pricing/page.tsx:54` | WhatsApp/LinkedIn shares show no image. | Use shared `ogDefaults()` or per-page `opengraph-image.tsx`. | P1 | S |
| HOME-22 | Both apps | OG image is 1600×1497, 1.97MB but declared 1600×900. No per-event image. | `[locale]/layout.tsx:49` (marketing) | WhatsApp commonly drops large images. | Make 1200×630 WebP/PNG under 300KB; per-event opengraph-image. | P1 | M |
| HOME-23 | Attendee home / event page | No `Event` JSON-LD anywhere in `apps/web`. | grep finds nothing | Google event rich results are free traffic. | Add Event/Organization/FAQPage nodes. | P1 | M |
| HOME-24 | Attendee site SEO | `BASE_URL` defaults same as marketing — canonicals collide. Tenant hardcoded as "manhar" in 11 places. `/manifest.webmanifest` 404s. | `apps/web/src/lib/seo.ts:3`; `apps/web/src/app/sitemap.ts:8-24` | Multi-tenant SEO won't work. | Resolve tenant/base URL from host, generate sitemap per tenant. | P1 | M |
| HOME-25 | Attendee home | Hero copy is generic, event name only in metadata. | `en.json:12-13`; `page.tsx:111-114,169` | Buyers check "is this the event I saw on Instagram?" first. | H1 = event.title + organizer. | P1 | S |
| HOME-26 | Attendee home | No price in hero, no urgency, even though tier windows exist. | `page.tsx:116-146`; `zone-cards-section.tsx:63` | Scarcity/price anchors drive Navratri sales before night 1. | Hero shows "from ₹599 · price rises on {date}". | P1 | M |
| HOME-27 | Attendee home / event page | Zone cards link to `/book` without the zone, extra step. | `zone-cards-section.tsx:47` | Extra step on the most important path. | Link to `/book?zone={id}` and preselect. | P1 | S |
| HOME-28 | Attendee home | Payment trust is weak — "Secured by Razorpay" is text only, no UPI/GPay logos. | `page.tsx:149-162` | First-time UPI buyers look for familiar logos before paying. | Add a logo row. | P1 | S |
| HOME-29 | Attendee home | Missing sections: FAQ, venue/parking/map, organizer credibility, artist photos. | `page.tsx` (whole file) | Unanswered questions become WhatsApp messages or lost sales. | Reuse existing `event-content.ts` fixtures. | P1 | M |
| HOME-30 | Attendee header / branding | Demo organizer called "ManharEvent Ahmedabad" — undercuts "your brand, not ours" pitch. | `tenant.ts:10`; `site-header.tsx:13,19-20` | Undercuts the platform pitch. | Rename fixture, render real branding logo. | P1 | S |
| HOME-31 | Event page | The "from" price is the minimum over all tiers, including expired/sold-out ones. | `e/[eventSlug]/page.tsx:85-88,117,143-155` | Sticky bar can quote a price nobody can buy. | Use `zoneFromPricePaise`/`currentPricePaise`. | P1 | S |
| HOME-32 | Marketing hero | The hero QR is a real, admissible seeded pass payload, published on a public page. | `page.tsx:95,211` | Harmless in demo; in production would be a valid entry QR. | Use a clearly fake, non-admissible sample payload. | P2 | S |
| HOME-33 | Marketing home | Hard-coded English in hero preview ("Rina & Kaushik", "Gold Zone"). | `page.tsx:160,198,204,207` | Gujarati/Hindi pages show English in hero. | Move to i18n keys. | P2 | S |
| HOME-34 | Marketing 404/error | Hard-coded English even though translation keys exist. 404 uses next/link (drops locale). | `[locale]/not-found.tsx:1,18-30` | Gujarati visitors get English error pages. | Use existing namespaces and locale-aware Link. | P2 | S |
| HOME-35 | Both apps | Hard-coded English aria-labels; legal page bodies English only. | `marketing-header.tsx:31` | Screen readers in gu/hi get English. | Translate labels. | P2 | S |
| HOME-36 | Register pages | Client components export no metadata, aren't noindex. | `register/page.tsx:1` | Wrong canonical/titles on funnel pages. | Add layout with metadata + noindex. | P2 | S |
| HOME-37 | Marketing SEO | Only 2 indexable URLs — no content targeting "Navratri ticketing software" etc. | `sitemap.ts:7` | Zero organic acquisition before season. | Add guides/city/comparison content. | P2 | L |
| HOME-38 | Register status | Raw Tailwind colors instead of tokens. | `s/:103,114` | Contrast drifts in dark mode. | Use success/warning tokens. | P2 | S |
| HOME-39 | Both apps | No theme toggle in the UI. | `ThemeProvider.tsx:52` | Minor polish. | Add toggle. | P2 | S |
| HOME-40 | Marketing performance | Header logo is 1024px, 678KB PNG marked priority. | `marketing-header.tsx:~20-27` | Slightly heavier LCP. | Use SVG logo. | P2 | S |
| HOME-41 | Marketing claims | Feature claims need to match the build: "sub-500ms verdicts", "gap-free invoices" — scanner QR check is still a stub. | `en.json:365,367,407` | Overclaiming to a B2B buyer who will check on event night. | Soften copy or add "coming in 2026 season". | P2 | S |
| HOME-42 | Pricing | Only CTA is at the very bottom. | `pricing/page.tsx:234-241` | Visitors ready to act after the example scroll to end. | Add CTA after fee cards and calculator. | P2 | S |

### C. Recommended structure

**(a) Marketing home:** Sticky header (logo, how-it-works, pricing, sample site, WhatsApp, register, hamburger) → Hero (clear value prop + fee + CTAs + payment logos) → Trust bar → Problem→solution → How it works → Product tour → Garba-native features grid → Money teaser/calculator → Reliability/security → Case study → Comparison table → FAQ (8-10) → Final CTA → Footer (with About/Contact/legal) → Mobile sticky bar.

**(b) Pricing:** H1 with fee + CTAs → Three fee cards (platform/gateway/GST) → Interactive calculator → Worked example + price table → Plans (Standard/Managed/Enterprise) → Add-ons price list → Payouts timeline/KYC → What you never pay → Comparison table → Money FAQ → CTA band.

**(c) Attendee event home:** Slim header with Book button always visible → Mobile-first hero with CTA above fold (name, dates, from-price, trust row) → Announcement strip → Pass chooser with deep links → Pass types at a glance → 9 nights → How entry works → Social proof → Venue/parking → FAQ → Final CTA → Footer → Sticky mobile bottom bar.

### D. Top 10 improvements, in order
1. Fix attendee home above-the-fold (HOME-01/02/25/27)
2. Fix the fee/GST model before it's published, CA check (HOME-03/04/06/05)
3. Remove placeholders, add legally required pages (HOME-11/12)
4. Finish the registration loop (HOME-13/14/15)
5. Make registration trustworthy — KYC, validation, consent (HOME-16/17/18)
6. Explain payouts (HOME-07/08)
7. Organizer social proof and demo path (HOME-19/20)
8. Social previews / OG images (HOME-21/22)
9. Attendee urgency and trust — pricing, badges, FAQ, branding (HOME-26/28/29/30/31)
10. SEO foundations and polish (HOME-23/24/37/33-36)

---

## A4. Stakeholder & Money Flow Design (full)

### 0. The owner's two questions, answered

**"Admin ko paisa kaise milega?" (How does the organizer get the ticket money?)**
- The buyer pays through ManharEvent's checkout into a Razorpay Route marketplace account.
- Razorpay is the licensed payment aggregator and holds the money in its escrow; Manhar never holds it.
- On every payment the platform automatically creates a transfer to the organizer's own linked account.
- The organizer's bank receives it on Razorpay's cycle (T+2 working days by default).
- A configurable share is held back until the event night is over, to cover refunds and chargebacks.

**"Hamko kaise milega?" (How does Manhar make money?)**
- Manhar's booking fee never leaves Manhar's own Razorpay balance, so it is kept at the moment of sale.
- On top of that come optional paid add-ons: WhatsApp credits, scanner device rental, on-ground staff, box-office POS, vendor wallet, sponsor reports, and a Pro season plan.

**Timing.** Navratri 2026 starts 11 Oct 2026, 27 days out at time of writing, no backend yet. Live Route payments for 2026 are not realistic. First real-money season should be Navratri 2027; smaller events (Diwali, New Year) as rehearsals before it. A 2026 pilot should be gate scanner only, or use the organizer's own gateway.

### 1. What the codebase does with money today

| # | File | Problem |
|---|---|---|
| F1 | `packages/domain/src/logic/fees.ts` | Taxes are mixed together. 18% GST charged on pass + platform fee + gateway fee together. The ₹500-per-person GST exemption is ignored. Gateway fee is 2% of subtotal, but Razorpay charges MDR on the full captured amount. |
| F2 | `apps/dashboard/src/lib/payouts.ts` | `TDS_194O_BPS = 100` (1%). Rate has been 0.1% since 1 Oct 2024. No GST TCS (0.5%), no gateway/transfer fee, no holdback, no chargeback reserve. |
| F3 | `dashboard/finance/gst/page.tsx` | `SAC = "999692"` — several sources list this as "Gambling and betting services" (verify). Tax invoice puts "Platform and payment gateway fees" on the organizer's invoice, but that is Manhar's supply. |
| F4 | UI and copy | Three incompatible money models appear at once: (a) fees "come off at the transaction itself" (split at source); (b) `settings/payments` shows a per-organizer "Razorpay Key ID" (own gateway); (c) `finance/payouts` shows Manhar paying out in blocks (platform holds the money). |
| F5 | pricing FAQ vs refund-policy | FAQ says platform fee is returned on refund; policy file says fees are never refunded. |
| F6 | pricing FAQ | "18% GST applies to the pass and to both fees" — wrong for passes ≤₹500/person. |
| F7 | marketing/register/verify | No PAN, GSTIN, entity type, bank account, KYC. |
| F8 | `TenantCommission` in tenant.ts | Per-tenant fee model exists but isn't used. |
| F9 | `price-breakdown.ts` | A second fee/GST implementation still exists, same drift risk as before. |
| F10 | `apps/scanner/src/lib/crypto.ts` | QR signatures are `HMAC_STUB` — only payload shape is checked. A photographed or screenshotted QR passes. |
| F11 | — | No cash box office, agents/resellers, affiliate commission, chargebacks, DPDP consent, permission capacity caps, support console, Manhar finance console. |

### 2. Stakeholder map

**2.1 Attendee** — Goals: buy fast with UPI, pass on WhatsApp, offline QR, clear refunds. Pain: paper passes lost/forged, cash queues, no refunds. Missing: real payment/WhatsApp delivery, correct tax invoice, consent notice, grievance contact, pass transfer.

**2.2 Group booker/family head** — Goals: buy for 4-10, each own entry. Missing: split pay/per-member links, per-member refund UI, minor handling (DPDP parental consent).

**2.3 Organizer owner** — Goals: sell out, cash early, no gate chaos, trust the numbers. Missing: KYC onboarding, written agreement, visibility of fee plan, real settlement, permission upload/capacity lock, advance/holdback view.

**2.4 Organizer finance person** — Goals: reconcile every rupee, file GSTR-1/3B, claim TCS/TDS credits. Missing: server-side role enforcement, correct tax engine, credit notes, TCS/TDS certificates matched to GSTR-8/AIS, Tally export.

**2.5 Organizer gate manager** — Goals: throughput, no crushes, staffed gates, instant revocation. Missing: gender/emergency gate types, staffing ratio check, incident log, device health, supervisor override PIN.

**2.6 Gate staff/security** — Goals: scan, green tick, next. Missing: real signature check, holder photo, cross-device duplicate detection while offline.

**2.7 Food/merch vendor** — Goals: sell fast, no cash reconciliation, paid next day. Missing: vendor portal, POS mode, wallet top-up, vendor settlement, stall-rent billing.

**2.8 Sponsor** — Goals: proof of reach, justify renewal. Missing: sponsor portal, ROI report, deliverable tracking, GST invoicing of sponsorship.

**2.9 Artist/singer** — Goals: fee paid on time, correct billing. Missing: contract/fee tracker, guest-list quota.

**2.10 Venue owner** — Goals: rent/revenue share paid, capacity respected. Missing: venue-partner view, revenue-share settlement.

**2.11 Police/permissions** — Ahmedabad 2025 rules: fire NOC mandatory, CCTV at entries/exits/parking, watchtowers, 1 guard per 100 attendees, separate men/women entries + emergency exit, metal detectors, music until midnight. Missing: permission/NOC upload, capacity lock, police report export, compliance checklist.

**2.12 Manhar super-admin/ops** — Goals: approve fast, set commercial terms, contain incidents. Missing: fee plan at approval, KYC review, risk tiering, super-admin role/auth boundary.

**2.13 Manhar support** — Missing: entire support console (cross-tenant lookup, resend/transfer/refund, grievance SLA).

**2.14 Manhar finance/accountant** — Missing: platform ledger, Razorpay reconciliation, monthly GSTR-8/TDS return, Manhar's own invoice series, receivables/dunning.

**2.15 CA/GST auditor** — Missing: auditor role, GSTR-1 (B2CS exempt/taxable split), HSN/SAC summary, credit-note register, TCS/TDS matching, Tally export.

### 3. Money flow design

**3.1 Options compared:**

| | A. Manhar collects all, pays out | B. Split at source (Route/Easy Split) | C. Organizer's own gateway | D. Hybrid |
|---|---|---|---|---|
| RBI PA status | Needs authorization under Sep-2025 PA Master Direction — **not viable** | Razorpay/Cashfree is the authorised PA — clean | Clean, organizer is merchant | Clean |
| Manhar gets paid | Whenever Manhar pays — trust issue | At source, automatic | Chase invoices/prepaid credits | Both |
| Verdict | **Reject** | **MVP/2027 target** | **2026 bridge / enterprise** | **Scale** |

**Recommendation:** MVP (first real-money season) = Route. Scale = Hybrid (Route default + Partner OAuth for large organizers + Cashfree failover).

**3.2 Corrected worked example — 2 × ₹1,000 pass, card, Route, buyer pays fees:**
Buyer pays ~₹2,465.39 (2,000 pass + 360 GST + 89.31 booking fee + 16.08 GST on fee). Organizer receives ~₹2,348 (net of TCS ₹10, TDS ₹2). Manhar retains ~₹34-59 net.

**3.3 Refund reversal example:** 75% refund tier → buyer gets ₹1,770 (pass+GST, fee not refunded), Route reversal ₹1,762.50 (adjusted for TCS), organizer issues credit note, pass blocked in manifest.

**3.4 Chargeback example:** Razorpay debits Manhar's balance (merchant of record under Route); Manhar builds evidence pack from check-in logs, OTP, delivery receipts; lost dispute → Manhar recovers from organizer's reserve/next transfers.

### 4. Manhar revenue model

| Option | Verdict |
|---|---|
| Per-ticket % fee | Core |
| Flat per-ticket fee | Core, as a floor (needed for ₹300 passes) |
| Buyer pays vs organizer absorbs | Toggle, buyer-pays default |
| SaaS subscription tiers | Pro season plan, optional |
| WhatsApp/SMS credits resale | Yes |
| Scanner device rental | Yes |
| On-ground staff service | Yes, high margin in season |
| Vendor wallet commission | Later (P2), PPI regulation risk |
| Box office POS fee | Yes |
| Sponsorship marketplace | P2, success fee |
| Float interest | **No** — money sits in PA escrow under Route, illegal under option A |

**Recommended pricing:** Starter (1.5%+₹5/pass, capped ₹99) / Pro (0.75%+₹4/pass, capped ₹60, ₹39,999/season subscription) / Enterprise (custom).

**Sample organizer, 10,000 passes/season:** Gross ticket value ₹89L. Manhar gross revenue (ex-GST) ≈ ₹1.8-2.4L (Starter/Pro). Contribution after messaging/staff costs ≈ ₹1.2-1.8L.

### 5. Legal and compliance

- Manhar (under Route): GSTIN, likely registered as ECO for TCS (monthly GSTR-8, 0.5%), TAN, TDS 0.1% under s.393(1) Sl.8(v), Razorpay Route marketplace approval.
- Organizer KYC: entity type, PAN, GSTIN (optional if turnover ≤₹20L), bank + penny-drop, Razorpay linked account signatory KYC, police permission + fire NOC before publish.
- Agreements: Organizer MSA (fee plan, holdback, refund/cancellation liability, chargeback liability, set-off rights), buyer terms, per-event refund policy, trilingual privacy notice.
- Invoices: organizer issues admission invoice (their GSTIN, exempt if ≤₹500/person); Manhar issues booking-fee invoice (own GSTIN); place of supply = event location (CGST+SGST in Gujarat).
- DPDP: consent notice at OTP/checkout in 3 languages, separate opt-in for marketing WhatsApp, verifiable parental consent for minors on family passes, retention/erasure schedule. Substantive obligations from ~14 May 2027 — build habits now.
- Police permission capacity: hard cap sellable+comps+box-office+agents ≤ permitted capacity per night; live occupancy alert at 90%; staffing check 1:100.

### 6. Other gaps a product strategist would flag
1. Fraud: screenshots/photographed QR (fix with real signature+photo), duplicate QR across gates offline, fake UPI screenshots at box office, insider abuse (comp quotas+2nd approver), velocity/scalping caps.
2. Cash box office: POS mode with cash+dynamic UPI, per-agent drawer float, shift-close variance report.
3. Offline agents/resellers: inventory allocation, prepaid wallet or credit limit, commission ledger, TDS 194H equivalent.
4. Affiliate/influencer codes: owner attribution, commission, payout, creator view.
5. Season pass photo ID: selfie capture per holder, shown on scanner verdict, consent+retention limits.
6. Rain/cancellation: bulk partial refund, credit-to-another-night, organizer insurance referral, licensed-partner attendee cover only.
7. Sponsor ROI reports: footfall by night/zone, peak occupancy, sponsor-zone dwell, sampling redemptions.
8. Post-event reports: settlement statement, GST pack, police attendance report, refund/chargeback summary, "clone for next year".
9. Pass transfer/resale controls to kill WhatsApp black-market resale.
10. Uptime on on-sale day: second gateway for failover.

### NEEDS list (39 items) — key highlights beyond what's already in Part 1's Master TODO
- NEEDS-01: Pick one money model in writing, remove UI contradictions
- NEEDS-02: Decide Navratri 2026 scope explicitly (gate-scanner-only pilot or bridge model)
- NEEDS-03: Apply for Razorpay Route, negotiate MDR/transfer fee/reserve
- NEEDS-04: Manhar statutory setup (GSTIN, ECO TCS registration, TAN, CA opinion)
- NEEDS-05 through 39: KYC, fee plans, tax engine rewrite, payouts rewrite, holdback policy, invoice series, ledger, refund-on-Route flow, agreements, QR signing, permission capacity lock, super-admin roles, pricing copy fixes, chargeback workflow, finance console, support console, box office POS, agents/resellers, affiliate codes, fraud controls, DPDP implementation, tiers/add-ons productization, WhatsApp BSP integration, police/safety pack, post-event reports, season pass holder capture, sponsor portal, vendor portal, rain/cancellation flow, group split payments, artist/venue payables tracker, enterprise gateway path, second gateway failover, year-round event templates.

---

## A5. Market & Competitor Research (full)

**Timing:** Sharad Navratri 2026 runs 11–19 Oct 2026, Dussehra 20 Oct.

### 1. Competitors

| Player | Fees | Payout | Notable | Weaknesses |
|---|---|---|---|---|
| **TICMint** | 2%+, subscriptions from ₹249/mo, enterprise 1.5-7% | Instant payouts claimed | Sept 2026: single "Service Fee" line, auto group discounts, Products module | No Garba-specific model |
| **BookMyShow** | Commission 10-25% (unverified blog); buyer convenience fee 10-15%+GST | Typically post-event | Dominant distribution, HostMyShow self-serve | Trustpilot 1.4/5, convenience fee not refunded on cancellation, FIR over Coldplay scalping |
| **District (absorbed Paytm Insider)** | Not public, can change on 45 days notice | Net settlement | Sells major Ahmedabad Garba events | Hidden-fee complaints (unverified) |
| **Skillbox** | Not public | Not public | DIY listing, cashless product | Trustpilot 2.9, undercut early-bird buyers |
| **KonfHub** | Lite 2%+GST, Silver 3.75%+GST | Weekly (Thursday) | Check-in app, webhooks | Built for conferences |
| **Townscript** | 1.99%+₹10, 4 fee-allocation options | Daily/weekly/post-event | | Stacked fees ~8.2% if buyer pays all |
| **Eventbrite India** | 3.7%+₹30/ticket (USD) | – | Global | Currency exposure |
| **AllEvents** | 10%+₹10 | – | Discovery traffic | Most expensive |
| **Wowsly** (Gujarat) | 4%/ticket | T+2 | QR passes, check-in | – |
| **Mepass** (Ahmedabad) | Not public | – | Digital/printed/RFID passes, 1M customers claimed | – |
| **NavratriGarba/Locality/Showmates** | 0% buyer fee advertised | – | Garba discovery marketplaces (old model) | — |
| **FacePass** | ₹999+ | – | Face-recognition Garba entry | DPDP/biometric risk |

**Takeaway:** Zero buyer convenience fee is table stakes among Garba-specific players. Organizer fees cluster 2-4%+gateway.

### 2. Payments in India

**Razorpay:** Standard 2% domestic incl. UPI, +18% GST. Instant settlement extra. Route: transfer fee unclear (pricing page says 0.1%+platform fees; docs say 0.25%+GST — negotiate). T+2 working days for linked accounts. Bank verified by penny test.

**Cashfree:** 1.95% standard, Easy Split 0.20-0.25%, instant settlement 0.30%, T+1.

**PhonePe PG:** UPI 0%, cards 1.95% standard (currently promo free, unverified).

**PayU:** Split settlements supported, pricing not public.

**UPI MDR changing:** Aug 2026 PSS Act amendment allows UPI MDR again; proposals discussed 0.3-0.5% above ₹2,000 transactions (not final).

**RBI Payment Aggregator rules:** Sep 2025 Master Direction — escrow required, ₹15cr net worth at application (₹25cr by year 3), marketplaces barred from accepting payment for non-onboarded sellers. Practical reading: ManharEvent collecting-then-paying-out is exposed; safe patterns are organizer-as-merchant OR licensed PA's split product with each organizer KYC'd as sub-merchant. **(Needs legal opinion.)**

**Chargebacks:** 7-30 days to respond, 30-90 day process, merchant bears loss.

### 3. Tax

**GST on ticket:** 18% above ₹500, exempt at ₹500 or below (Notification 12/2017-CT(R)). GST 2.0 reform (Sep 2025) created 40% slab for IPL/casino-type events only; ordinary entertainment stays 18% above ₹500. Unverified how ₹500 test applies to couple/season passes — get CA view.

**GST on platform/convenience fee:** 18%, SAC 998554 (reservation services) per most sources — code's 999692 likely wrong.

**TCS under GST s.52:** 0.5% since 10 Jul 2024 (was 1%). Filed on GSTR-8.

**TDS s.194-O:** **0.1% from 1 Oct 2024** (was 1%). Broad e-commerce operator definition likely covers ticket platforms. Under new Income-tax Act 2025 (from Apr 2026), renumbered to s.393(1) Table Sl.8(v).

**Is ManharEvent an e-commerce operator?** Likely yes if buyer money flows through ManharEvent's account (Route model). Arguably no if organizer is merchant of record (bridge model). **CA confirmation needed.**

### 4. Messaging

**WhatsApp (Meta):** Per-message pricing since 1 Jul 2025. Utility/auth templates in open 24h window are free. India list prices (secondary): marketing ₹0.86, utility ₹0.115, authentication ₹0.115, all +18% GST.

**Providers (BSPs):** AiSensy from ₹1,500/mo (₹1.09 marketing, ₹0.145 utility); Interakt ₹999-2,499/mo + ~25% markup; typical BSP markup 10-30%. Meta Cloud API direct avoids markup.

**SMS OTP/DLT:** DLT registration ₹5,900/year + ₹590/sender header. Since 1 Oct 2024, SMS with non-whitelisted URLs is blocked.

**OTP cost:** MSG91 ₹0.25→₹0.13 at volume+GST; Twilio Verify ~₹0.45; Firebase unclear (₹0.5-6, sources conflict).

### 5. Event-tech practices worth copying

**Rotating QR (Ticketmaster SafeTix):** Refreshes ~every 15s (TOTP-based PDF417 barcode). Reverse-engineering shows weaknesses: token exposed in browser console, no photo match. Lesson: needs the pass app to have been online once to fetch the secret — pair with photo/name.

**Waiting rooms:** Cloudflare Waiting Room needs Business plan ($200/mo)+, Enterprise for randomized queues. Queue-it pricing not public. Cloudflare Turnstile is free.

**Wallet passes:** Google Wallet API opened to India developers 16 May 2024, supports rotating barcodes+NFC.

**Cashless/RFID:** UPI QR is the Indian norm; RFID less common. A prepaid balance spendable at third-party vendors likely needs RBI PPI authorization (unverified) — closed-loop (organizer's own stalls only) avoids this.

**Face entry:** DPDP Rules notified 14 Nov 2025 — consent must be specific/withdrawable, parental consent for minors, penalties up to ₹250cr. Face recognition less accurate for women/age extremes.

**Resale/name-on-ticket:** Scalping illegal but weakly enforced. Maharashtra Cyber directed BMS/Zomato to print buyer names + require ID at entry (Feb 2025) — relevant precedent.

### 6. Garba market insight

**Ahmedabad 2025 prices:** Mirchi Rock ₹499-2,799-18,999 (single/season/group); Rang Morla ₹1,947-10,824; Mandli ₹1,299-10,000; Sheri Garba ₹535-4,818. Most sales through BMS/District.

**Vadodara:** United Way season pass ₹2,500-3,500, ~40,000+/night, Limca record largest Garba ground.

**Mumbai:** Falguni Pathak season pass ₹15,652 (2025) vs ₹4,800 (2024).

**Rain/refunds 2025:** United Way crowds chanted "refund" over muddy ground; United Way/LVP/VNF/VVN cancelled consecutive nights; 6 Vadodara organizers bought ₹30.18cr insurance covering 3 lakh+ players.

**Fraud:** Mumbai ₹30 lakh fake season-pass racket (1,000+ victims); Borivali fake-pass scam (6 arrested); Thane 99 duplicate tickets; Surat engineer lost ₹2 lakh; fake police officer gatecrashed via VIP gate.

**Ahmedabad police rules 2025:** Music 10PM-midnight only; no passes beyond venue capacity; ID proof (Aadhaar/voter ID) must be collected from pass holders; CCTV at gates/parking; separate men/women gates; pandal stability certificate; 84 applications, only 29 approved as of 21 Sep.

### Recommendations (RES-01 to RES-17)
1. **RES-01 (P0):** Don't hold buyer money — organizer as merchant of record for launch, or licensed PA split for a Route model. Get legal/CA opinion.
2. **RES-02 (P0):** Tax engine per line — 18% GST above ₹500, 0% at/below, separate invoices per GSTIN, TCS/TDS config flag.
3. **RES-03 (P0):** Hard capacity caps + ID capture per Ahmedabad police rules.
4. **RES-04 (P0):** Signed, rotating QR + name/photo on pass.
5. **RES-05 (P0):** OTP stack — WhatsApp auth templates + MSG91 SMS fallback, DLT registration now.
6. **RES-06 (P0):** Scope for Navratri 2026 — freeze to buy→pay→WhatsApp pass→offline scan→settlement report only.
7. **RES-07 (P1):** Pricing — zero buyer convenience fee or two-line breakdown, 1.5-2% or flat fee, T+1/T+2 payout.
8. **RES-08 (P1):** Rain/cancellation policy engine with per-night pro-rata refund.
9. **RES-09 (P1):** Chargeback/payout reserve — hold % or Route transfers until after season.
10. **RES-10 (P1):** Flash-sale protection — Turnstile + rate limits + lightweight queue.
11. **RES-11 (P1):** Anti-scam trust layer — organizer-domain verification badge, name-bound tickets.
12. **RES-12 (P1):** UPI MDR readiness — fee engine handles it without code changes.
13. **RES-13 (P1):** Match TICMint's group-discount and add-on-product features.
14. **RES-14 (P2):** Google Wallet passes with rotating barcode.
15. **RES-15 (P2):** Cashless wallet — get RBI PPI legal check first, closed-loop only.
16. **RES-16 (P2):** Don't build face entry — DPDP risk, accuracy bias.
17. **RES-17 (P2):** UPI AutoPay for organizer subscriptions if SaaS plan added.

---

## A6. Database & Scaling Architecture (full)

### 0. Summary

1. Keep Supabase Postgres in `ap-south-1` (Mumbai). Neon has no India region. Risks are in schema/enforcement, not the vendor.
2. The data model is a good start but not production-ready — missing double-entry journal, idempotency/webhook-event tables, marketplace-aware tax model, proper inventory model, Route-based payouts, platform-staff role, device registry with keys, consent records, transactional outbox.
3. Three things would break production: (a) "zero call sites change" claim is wrong — 17 client components import mock-data directly; (b) scanner reloads entire manifest and searches linearly per scan; (c) Vercel Functions default to `iad1` (Washington DC), not Mumbai.
4. Flash sale handling: CDN serves pages, waiting room meters entry, conditional UPDATE handles reservations, webhook processed in one transaction with outbox for side effects. ~100 admissions/sec → ~400-600 DB transactions/sec, handled by XL/2XL instance.
5. Scanner trust: replace demo HMAC stub with Ed25519-signed QR (private key server-side, devices hold public keys only), per-device keys, signed manifests with change feeds.

### 1. Data model — critical correctness problems (P0)

| # | Problem | Fix |
|---|---|---|
| D1 | "Double-entry" ledger isn't double-entry — each row carries its own direction, nothing forces balance | Real `journal_transactions`/`journal_entries` with deferred constraint trigger enforcing Σdebit=Σcredit |
| D2 | Three different fee models across code/docs/fixtures, columns throw the split away | Store platform_fee/gateway_fee/GST as separate columns, one `compute_order_totals()` function |
| D3 | Tax model is single-supplier but this is a marketplace | `tax_profiles`, per-GSTIN invoice series, two invoices per order |
| D4 | Money flow assumes Manhar collects-then-pays (RBI PA exposure), no bank-account/settlement/chargeback model | Razorpay Route linked accounts, `route_transfers`, `tenant_bank_accounts`, `gateway_settlements`, `disputes` |
| D5 | Payments aren't idempotent at schema level — no unique constraints, no webhook event log | `unique(provider, provider_payment_id)`, `webhook_events` table, `idempotency_keys` table |
| D6 | Inventory has two sources of truth, ignores venue capacity across nights | One `inventory_buckets` table with `check(sold+held<=capacity)` |
| D7 | HANDOFF §8 manifest SQL multiplies rows (LEFT JOIN + GROUP BY bug) | Aggregate in separate subqueries/LATERALs |
| D8 | Check-in model contradicts scanner code — no real unique constraint, upsert overwrites on replay | Split into `scan_events` (append-only) + `admissions` (unique per pass/night/admit_seq) |
| D9 | No super-admin/platform-staff model | `platform_staff`, `platform_audit_log`, `support_access_grants` |

**Missing tables (30+):** inventory_buckets, idempotency_keys, webhook_events, outbox_events, journal_transactions/entries/ledger_accounts, invoice_series, tax_profiles, route_transfers, tenant_bank_accounts, gateway_settlements, disputes, payout_items, tenant_kyc_documents, platform_staff/audit_log/support_access_grants, tenant_invitations, scanner_devices v2, scanner_login_codes v2, scan_events/admissions/fraud_flags, manifest_changes, signing_keys, consents, guardian_consents, data_subject_requests, event_counters, pass_transfers, refund_items, order_number_sequences, rate_limit_events, feature_flags.

**Errors found in HANDOFF-TO-BACKEND.md queries:** `listPublishedEvents` orders by wrong column name; `getZoneFromPrice` selects from wrong table; `listRefundsByPhone` compares uuid column to phone string; table names mismatch (`devices` vs `scanner_devices`, `team_members` vs `tenant_members`); `listOrdersByPhone` as a real endpoint is an IDOR.

### 2. Which database?

**Comparison:** Supabase Postgres (Mumbai region, integrated RLS/Realtime/Auth/Storage) vs Neon (no India region) vs RDS/Aurora (more ops burden) vs PlanetScale vs Firestore/MongoDB (lack transactional/relational guarantees for money+inventory).

**Recommendation: Supabase Postgres, `ap-south-1`, used as plain Postgres behind a server boundary.**

**Rules to keep migration cheap later:** raw SQL migrations, no ORM; no browser writes to money/inventory/check-in tables; use Realtime Broadcast not Postgres Changes for scanners; keep Auth behind a small adapter.

**Reconsider when:** Supabase Auth MAU billing becomes dominant cost (~$6k/mo at 200-organizer scale); load exceeds 16XL; enterprise customer needs VPC/residency contract; DB spend passes ~$4k/mo steady-state.

**Rough monthly cost by tier (database layer alone):**
- Pilot (1 org, 10k passes): ~$30-130
- Growth (20 orgs, 300k passes): ~$650-750 (includes MAU overage)
- Scale (200 orgs, 3M passes): ~$2.3k + ~$6.2k MAU overage = ~$8.5k for DB alone

### 3. Traffic and scale plan

**Architecture:** CDN/ISR for static pages → middleware (tenant-by-host, waiting-room check, rate limit) → Vercel Functions pinned to `bom1` → Supabase Postgres (primary + read replica) + Realtime Broadcast + Storage + Auth → Upstash Redis (queue/rate-limit) → Inngest/QStash workers → WhatsApp/SMS/Email/Razorpay.

**Hosting:** Vercel Pro with every function pinned to `bom1` (functions default to `iad1` — not pinned today, confirmed no `vercel.json` exists). Self-host (OpenNext on AWS Mumbai) when Vercel usage passes ~$2k/mo.

**Caching:** CDN static (immutable), ISR for event pages (`revalidateTag`), availability API cached 2s at CDN, no live stock numbers in HTML.

**Connection pooling:** Supavisor transaction mode, prepared statements off, max 1-3 connections per function.

**Inventory reservation:** One atomic conditional UPDATE per bucket in ascending-id order inside a transaction — avoids deadlocks, sub-microsecond lock hold. Redis shadow counter optional (Growth+) to filter losers before hitting Postgres; Postgres stays source of truth.

**Waiting room:** Upstash Redis INCR for position + signed ticket cookie + CDN-cached "now serving" endpoint (2s TTL) + middleware gate on checkout routes.

**Rate limiting:** Per-endpoint limits table (OTP send 3/10min per phone, reserve 5/min per session, scanner login 5 attempts per code, etc.) via `@upstash/ratelimit` + Turnstile before OTP/reserve.

**Idempotent checkout:** Client generates idempotency key; webhook route verifies HMAC over raw body → insert into `webhook_events` on conflict do nothing → process inline in one DB transaction → return 200 (or 5xx to trigger retry).

**Background jobs:** Outbox pattern written in same transaction as `confirm_order`, dispatched via Inngest/QStash with per-tenant flow control (WhatsApp throttled ~60/s globally).

**Capacity estimate — 50k buyers at 10am on-sale:** CDN/ISR handles page load (0 origin traffic). Reserve endpoint: ~100 rps → ~400-600 DB transactions/sec, ~2.5-3k row writes/sec — needs XL (4 core) minimum, 2XL for the on-sale window.

**Without waiting room:** 50k clicks in 60s = ~800 reserve rps → pooler saturation + Razorpay API overload + 5xx spike. Waiting room exists specifically to prevent this.

**Event nights — 20k scans:** peak ~10 scans/sec, at least 14 lanes needed at 12 scans/min/lane. Ingest via batched requests (50 scans/5s). Realtime channel per event/night/zone, batched 1 msg/device/sec.

### 4. Offline gate scanner at scale

**What's broken now:** `crypto.ts` only checks payload shape (HMAC_STUB). `gate-access.ts` ships `SIGNING_SECRET` in client bundle using FNV-1a — anyone can mint gate codes. Every scan loads the full manifest and searches linearly. Docs disagree on QR format across 3 places.

**Fix — signed QR (Ed25519):**
```
ME2.<base64url(payload)>.<base64url(sig64)>
payload: ver|kid|pass_id(16B)|zone_idx|nights_mask|admits|pass_version|issued_at
```
~140 chars total. One Ed25519 keypair per tenant per season, private key in Vault/KMS, devices get only public keys via signed manifest header.

**Manifest v2:** Built server-side, gzip JSON in Storage, signed with platform key, scoped to gate's zones+night only (not the whole event). ~40 bytes/entry → 50k entries ≈ 600KB gzipped. Stored in Dexie keyed by pass_id + held in-memory Map for O(1) lookup (fixes the linear-scan bug).

**Device authentication:** Replace client-bundle secret with server-issued hashed login codes + device-generated ECDSA P-256 keypair (WebCrypto, non-extractable) + signed request tokens (DPoP-style).

**Sync/conflict resolution:** `scan_events` (append-only, all scans incl. forged) + `admissions` (unique per pass/night/admit_seq) via advisory lock; duplicate/over-admit scans flagged as fraud, not silently dropped.

### 5. Security

**RLS policy set:** Tenant members checked via live membership function (not just JWT claim, to avoid stale-token access after removal). Money tables read-only for everyone, writes only through SECURITY DEFINER RPCs. Attendees scoped to `auth.uid()`, never phone lookup. Anonymous access only through whitelisted catalog views/RPCs.

**Super-admin boundary:** Separate host (`admin.manharevent.com`), separate Vercel project, MFA (WebAuthn/TOTP) required, no RLS bypass — every action goes through audited `admin_*` RPCs.

**Secrets:** Vercel env vars marked Sensitive, DB-side secrets in Supabase Vault, Ed25519 private keys wrapped by KMS, quarterly rotation, CI grep for leaked secrets in build output.

**OTP abuse:** Turnstile before send, +91-only allowlist, per-phone/IP/subnet limits with backoff, daily budget alarm.

**DPDP:** Substantive obligations from ~13-14 May 2027 (sources cite both dates — resolve before that date). Consent table, minors handling (guardian consent, no photo without it), minimization (initials in manifests), retention job (anonymize 18mo post-event), Sentry/PostHog PII scrubbing.

**Backups:** PITR 7 days (14 during season) + independent nightly pg_dump to S3 Object Lock (Mumbai) + quarterly restore drills, target RTO <1h.

**Audit immutability:** REVOKE UPDATE/DELETE on audit tables + hash-chain rows + hourly anchor to S3 Object Lock (proves tampering even against privileged DB users).

### 6. Observability and operations

**Tooling:** Sentry (errors/tracing), Better Stack/Axiom (logs), Grafana Cloud (DB metrics), Better Stack/Checkly (uptime from India), PostHog (product funnel).

**Business SLOs:** checkout success ≥97%, webhook-to-pass lag p95 <5s, oversell invariant checked every minute (sold+held≤capacity), outbox depth <1000, WhatsApp delivery ≥95%.

**Load testing (k6, 9 scenarios L1-L9):** on-sale browse (50k VUs), waiting room admission accuracy, inventory race (exactly N sold, zero oversell), webhook storm with duplicates/late-captures, full funnel at 2x peak, scanner ingest (60 devices flushing 500 queued scans), manifest download timing, 2h soak test, real low-end Android device test.

**Event-night runbook:** T-7 days load tests green + WhatsApp templates approved; T-24h deploy freeze + compute scaled up; T-3h device checks + canary passes; incident playbook table (venue internet down, mass wrong-night error, Supabase/Vercel/Razorpay outage, WhatsApp backlog, lost phone, fraud spike, scanner bug).

### 7. Monthly cost estimate (peak season month, USD)

| Line | Pilot | Growth | Scale |
|---|---|---|---|
| Supabase | $30-130 | ~$650-750 | ~$2.3k + $6.2k MAU |
| Vercel | $40-60 | $300-500 | $2-4k or self-host $1-1.5k |
| WhatsApp | ~$40 | ~$1,150 | ~$11,500 |
| SMS OTP | ~$20 | ~$560 | ~$5,600 |
| Sentry/logs/etc | ~$50 | ~$250 | ~$1,500 |
| **Total** | **~$170-350/mo** | **~$2,900-3,500/mo** | **~$29-33k/mo** |

Messaging is 45-60% of the bill at Growth/Scale — price it into the platform fee. Infra stays <10% of platform-fee revenue at every tier.

### 8. Migration plan (mock-data → real DB, 10 milestones M0-M10)

M0 Server boundary (split mock-data behind an interface, move client imports to server actions) → M1 Schema v1 (revised data model, seeded from mock fixtures via deterministic UUIDv5) → M2 Onboarding (KYC, provisioning) → M3 Auth (real phone OTP) → M4 Catalog (events/pass types/tiers via server) → M5 Money path (Razorpay integration, `completeMockOrder` becomes a simulated-payment mode calling the same real confirm RPC) → M6 Pass issuance (Ed25519 signing, WhatsApp delivery) → M7 Scanner (device registration, manifest v2, admissions/fraud) → M8 Ops/finance (real payouts via Route) → M9 Notifications/DPDP → M10 Hardening (load tests, backups, audit chain, runbook).

**Key principle:** demo continuity is maintained throughout — mock and Supabase implementations sit behind the same interface, selected per-module via env flags, so `verify:demo` keeps passing against both backends until the final cutover.

### ARCH to-do list (39 items) — highlights beyond Part 1
- ARCH-01 through 17: region pinning, server boundary, schema v2, fee/tax engine, Route integration, reserve_order with conditional UPDATE, webhook route, platform-staff model, RLS v2, Ed25519 QR v2, secret removal, scanner hot-path fix, manifest v2, scan_events/admissions/fraud_flags, OTP protection, CI secret sweep, backups.
- ARCH-18 through 33: waiting room, cache design, outbox workers, inventory buckets, state-machine triggers, HANDOFF error fixes, tenant_invitations, KYC pipeline, DPDP implementation, audit hash chain, event_counters/Realtime, observability stack, k6 suite, event-night runbook, simulated-payment demo mode, seed generator from fixtures.
- ARCH-34 through 39 (P2): read replica + partitioning, Redis shadow counters, rotating per-session QR, attendee-auth cost redesign (MAU billing), offline wallet spend model, exit plan to RDS/Aurora if needed.

---

*End of full research. Source: 6 parallel review agents (admin dashboard, attendee/user side, marketing home pages, stakeholder & money-flow strategy, competitor/payments/tax research, database & scaling architecture) + direct maintainer code verification, 2026-09-14.*
