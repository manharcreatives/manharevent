# TODO — ManharEvent platform (demo → real)

> **Live working file.** Update it as you go. If a session dies mid-task, the next session
> reads this file first and picks up exactly where the last one stopped.
>
> Owner: Utsav (Manhar Creatives) · Working from: `D:\ClientDataBase\garba` (Windows, pnpm 12, Node 24)
> Started: 2026-09-12 · Last updated: 2026-09-12

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done & verified (build passes) · `[!]` blocked

---

## 0. Ground truth — read this before touching anything

Four Next.js 15 apps in one pnpm/turbo monorepo:

| App | Port | Who uses it | Entry URL |
|---|---|---|---|
| `apps/marketing` | 3003 | **Organizers** who don't have an account yet | `/` → `/pricing` → `/register` |
| `apps/web` | 3000 | **Attendees** buying passes | `/en` → `/e/[slug]` → `/checkout` → `/me/passes` |
| `apps/dashboard` | 3001 | **Organizer** (`/dashboard/*`) + **Manhar internal ops** (`/admin/*`) | `/dashboard` |
| `apps/scanner` | 3002 | **Gate staff** at the venue | `/scan` |

Shared: `packages/domain` (types + money/pricing logic), `packages/mock-data` (fixtures + in-memory repo — this is the "database" today), `packages/ui` (design system), `packages/i18n` (en/gu/hi).

**There is no real database yet.** Everything runs on `packages/mock-data`. That is deliberate —
`docs/06-frontend-build/HANDOFF-TO-BACKEND.md` maps every mock function to its future Supabase
replacement. Do not add a DB without reading that file.

**Commands:**
```
pnpm install
pnpm dev            # all 4 apps in parallel
pnpm typecheck      # must be clean before any commit
pnpm build          # must be clean before any commit — stop `pnpm dev` first, they share .next
pnpm verify:demo    # traces the buy loop and the gate-staff loop without a browser
pnpm smoke          # fetches every route in all 4 apps (needs `pnpm dev` running)
```

**Demo logins** — attendee `9876543001` (any OTP). Gate staff `9825011001`…`9825011004`;
get each one's code from `/dashboard/team`. Full walkthrough in `DEMO-SCRIPT.md`.

---

## 1. Phase 0 — Make the repo actually build  `[x]`

Everything in `docs/PROGRESS.md` marked 🔵 (FE-03…FE-11) was written from a cloud environment that
could never run a build. First job was to verify it. Results:

- [x] `pnpm install` — clean
- [x] `pnpm typecheck` — was broken in 3 places, now clean
  - [x] `packages/ui/src/components/fee-breakdown.tsx` — props typed `HTMLDivElement` but rendered `<dl>`
  - [x] `sonner` imported by `apps/scanner` + `apps/dashboard` but only a dep of `packages/ui` → re-exported `toast` from `@manhar-garba/ui`, switched all 3 call sites
  - [x] `apps/web/.../e/[eventSlug]/page.tsx` — `getVenue(event.venue_id)` with a nullable `venue_id`
- [x] `pnpm build` — was broken in 4 files (ESLint `react/no-unescaped-entities`, `no-html-link-for-pages`), now clean on all 4 apps
- [x] Deleted the dead `apps/web/src/app/[locale]/[city]/` route (pivot leftover — it was a
      catch-all that swallowed every unmatched path into a bare `notFound()`)
- [x] Audited every internal `href` literal in all 4 apps against the built route table — **zero broken links**

**→ All 4 apps build clean. This is the baseline; never leave it broken.**

---

## 2. Phase 1 — No dead ends  `[~]`

*Utsav's rule: "koi bhi page ya link ya button pe click karu toh 404 nahi dikhna chahiye —
sab kuch working chahiye."*

### 2.1 Error / empty / loading surfaces  `[~]`
- [x] `apps/web` — branded `not-found.tsx` + `error.tsx`
- [x] `apps/dashboard` — `not-found.tsx` + `error.tsx`
- [x] `apps/scanner` — `not-found.tsx` + `error.tsx`, thumb-sized targets for use at a gate
- [x] `apps/marketing` — `not-found.tsx` + `error.tsx`
- [x] Made `buttonVariants` server-safe (`packages/ui/.../button-variants.ts`) — it was only
      exported from the `"use client"` button module, which crashed prerender of any server
      component that styled a `<Link>` as a button
- [ ] `loading.tsx` for the slow routes (`/dashboard/events/[id]/*`, `/e/[eventSlug]`)
- [x] **Route smoke test** (`pnpm smoke`): every route in all 4 apps fetched live — all 200,
      unknown paths 404 cleanly to the new pages. Found and fixed two real 404s:
      `/artist/[slug]` queried a tenant id (`tenant-manhar-001`) that doesn't exist — the whole
      artist route was dead — and the same stale id was hardcoded in `apps/scanner/src/lib/queue.ts`.

### 2.2 Dead buttons — all 21  `[x]`
The rule held: each one now **does the thing**, **navigates somewhere real**, or was replaced by
something that does. Re-audit any time with `python scripts/find-dead-buttons.py` — the only hits left are
`(dev)/gallery`'s, which is a component showcase and intentionally inert.

- [x] `events/[id]/passes` — rebuilt as a real Garba pass-type editor: kind (season / weekend /
      daily / single-night) × admits × per-night selection × zone × quantity, plus working
      **price tiers** (early bird → regular) with add and remove. Presets fill the form rather
      than saving something behind your back.
- [x] `events/[id]/addons` — add / edit / remove for parking, wallet top-up, merchandise, with
      optional zone restriction and optional quantity cap
- [x] `events/[id]/nights` — per-night editor (theme, dress code, theme colour, gates-open /
      start / end times, internal notes) and a **lineup picker** where pick order = billing order
- [x] `events/[id]/venue` — venue details, per-zone editing, gate direction and naming, and a
      warning when the zone capacities add up to more than the venue holds
- [x] `events/[id]/publish` — rebuilt, see 4.2
- [x] `settings/notifications` — six real preferences, draft-then-save, one audit entry per save
- [x] `settings/payments` — see 4.4
- [x] `sponsors` / `vendors` — full CRUD with a confirmation on delete; the sponsor status chip
      cycles pending → confirmed → declined in place
- [x] `team/gate-staff` — rebuilt, see Phase 2

### 2.3 Settings that don't persist  `[x]`
- [x] Bank account — persists, masked to the last 4 digits everywhere, audit-logged on change
- [x] Notification preferences — persist
- [x] All of it writes through `dashboard-store.ts` (Zustand + `persist`), so it survives a
      reload. The store is **versioned** — bump `version` whenever you change its shape, or a
      browser with stale localStorage will shadow your new defaults and you'll chase a ghost.

---

## 3. Phase 2 — Gate scanner access control  `[x]`

*Utsav: "gate pe jo security guard hote hai unko sab ko scanner ka access nahi de sakte.
Organizer dashboard me team add karenge, unke mobile number wale log hi scanner access kar sakte hai."*

**`apps/scanner` had no login at all** — anyone who opened `localhost:3002` could validate passes.
Closed. The hard part was that the dashboard (:3001) and the scanner (:3002) are separate origins
and share no storage, so a randomly-generated code saved in the dashboard's Zustand was invisible to
the scanner. Solved by **deriving** the code from `(phone, eventId, serial)` with a shared secret, so
the scanner can verify a code the dashboard issued seconds ago with no server in between.

- [x] `packages/domain/src/logic/gate-access.ts` — `normalizePhone`, `isValidIndianPhone`,
      `issueGateCode`, `verifyGateCode`. Code alphabet excludes `O/0/I/1/L` (read aloud at a gate).
      Documented clearly as demo-grade: the secret is in the client bundle, and the real version
      moves both functions server-side against `scanner_login_codes`.
- [x] `packages/mock-data/src/fixtures/gate-staff.ts` — the shared roster both apps read
- [x] `apps/scanner/src/lib/session.ts` — phone **and** code must both check out; knowing someone
      else's code is useless without being on the roster under your own number
- [x] `apps/scanner/login` — on-screen keypad (not the OS keyboard), 64px targets, two steps
- [x] `apps/scanner/scan/layout.tsx` + `GateSessionGuard` — every `/scan/*` route is behind it
- [x] `GateIdentityBar` — who is scanning and at which gate, always on screen, with sign-out
- [x] Gate and zone now come from **who signed in**, not a device setting; `staff_id` is recorded on
      every queued check-in, so a disputed scan traces to a person and not just a phone
- [x] `dashboard/team` — validated add (rejects a bad or duplicate mobile), gate assignment, and a
      `GateAccessPanel` per member: issue / regenerate / revoke, copy code, prefilled WhatsApp send
- [x] **`dashboard/team/gate-staff` rebuilt** — was 100% hardcoded `MOCK_DEVICES` with two dead
      buttons. Now a real gate-coverage view off the same store, warning about unstaffed gates.
      (This was the unresolved FE-10 item in `docs/PROGRESS.md`.)

**Demo credentials** (seeded, work out of the box): `9825011001` … `9825011004`. Get each one's
code from `/dashboard/team` → the member's "Login code".

**Known limit, on purpose:** a stateless derived code cannot be revoked offline. Revoking marks the
credential and locks the device out at its next sync; the UI says exactly that. Real revocation
needs the server lookup described in `HANDOFF-TO-BACKEND.md`.

---

## 4. Phase 3 — Organizer onboarding, links & money  `[~]`

*Utsav: "organizer ko pehle detail bharni hogi jaise BookMyShow me hota hai, phir dashboard milega…
ek link create ho jaye aur QR bhi, jisko woh share kar sake."*

### 4.1 Registration → approval → provisioned  `[ ]`
The flow exists (`marketing/register` → `/verify` → `/status` → `/provisioned`, approved at
`dashboard/admin/tenants/[id]`). Verify it end to end and close the gaps:
- [ ] Click through the whole loop in a browser and fix whatever breaks
- [ ] `/register/provisioned` must hand off to the **real dashboard URL**, not a dead end
- [ ] Organizer detail form: confirm it collects what BookMyShow-grade onboarding needs —
      org legal name, PAN/GSTIN, contact person, **bank account for payouts**, venue/city,
      expected footfall, past events. Add what's missing.
- [ ] Show the applicant a real status timeline (submitted → under review → approved → live)

### 4.2 Shareable event link + QR  `[x]`
**A real bug surfaced here first:** the QR on the attendee's pass page was a CSS-striped
placeholder — a `repeating-linear-gradient`, not a QR code. No camera could ever have read it,
which means the single most important thing in the demo (buy a pass, scan it at the gate) could
not have worked, on any device, ever.

- [x] Added `qrcode` to `packages/ui` and built `<QrCode>` + `<QrDownloadButton>`. Always drawn
      dark-on-white regardless of theme — an inverted QR in dark mode reads as a black square to
      most phone cameras, so the white plate is deliberate.
- [x] `/me/passes/[passId]` renders the pass's actual `qr_payload`, the exact string the gate
      scanner decodes. Downloadable as PNG; greyed out when the pass isn't admissible.
- [x] `events/[id]/publish`: public link with a copy button, the QR on screen, **downloadable at
      1024px with high error correction** so it still scans off a printed poster, prefilled
      WhatsApp share, Instagram caption copy, and "open the page"
- [x] Public / unlisted toggle — unlisted is link-only, for a soft launch to a WhatsApp group

### 4.3 Revenue model  `[~]`
The fee split is the product's stated differentiator: **platform fee and payment-gateway fee are
always two separate visible line items, never one hidden "convenience fee"**.

**It wasn't true.** The fee maths was implemented three separate times with three different
answers: `book-client` used 1% + 2%, the unused `booking-client` used a single 2.5%, and
`checkout-client` had its own copy of 1% + 2%. `/pricing` quoted no number at all, only prose —
so an organizer could read the whole page and never learn what they'd pay.

- [x] `packages/domain/src/logic/fees.ts` — `computeFees` plus `PLATFORM_FEE_BPS`,
      `GATEWAY_FEE_BPS`, `GST_BPS`. One implementation, imported everywhere.
- [x] `book-client` and `checkout-client` both call it; the quote and the charge are the same
      number by construction, not by coincidence
- [x] Deleted `booking-client.tsx` — dead file, imported by nothing, with a fourth fee rate in it
- [x] `/pricing` shows a **worked example on a ₹1,000 pass**, computed with that same function:
      what the buyer pays and what the organizer receives, line by line (en/gu/hi)
- [x] Zone "from ₹X" prices were a hardcoded lookup table keyed on zone code. Replaced with
      `getZoneFromPrice`, which reads the zone's real price tiers — so editing a tier in the
      dashboard moves the public number too.
- [x] `dashboard/finance` rewritten: buyers-paid, net payout, GST, refunds, and a revenue-split
      donut whose slices come from the actual orders. It was previously a **hardcoded
      74 / 14 / 12 gradient that never moved** whatever the data said.
- [ ] `dashboard/finance/payouts`: payout schedule against the bank account

### 4.4 Per-organizer payment account  `[~]`
- [x] `settings/payments` rebuilt: view-then-edit, the account number typed **twice** with paste
      disabled on the confirm field, IFSC validated against the RBI format, a plain warning that
      a wrong digit can't be reversed once a payout is sent, masked to last 4, audit-logged
- [ ] Also capture it at registration (Surface 0), so a new organizer arrives payout-ready
- [ ] Surface it on `finance/payouts`

---

## 5. Phase 4 — Super admin & emergency controls  `[x]`

*Utsav: "super admin emergency."*

- [x] `/admin` is a real overview now — it used to `redirect()` straight to the approvals inbox,
      so the only internal-ops view was a to-do list. Live sales, passes issued, check-ins,
      tenant status, pending registrations, and a red banner when an override is in force.
- [x] **`/admin/emergency`** — every control behind a **typed phrase** (`PAUSE SALES`,
      `REVOKE ALL`, `OFFLINE ALLOW`, `FREEZE`) *and* a written reason. A plain "Are you sure?"
      loses to muscle memory at 10pm on night four; typing the phrase doesn't.
  - [x] Pause ticket sales platform-wide
  - [x] Freeze a tenant (dashboard suspended, public site offline)
  - [x] Revoke every scanner login for an event — deliberately **not** undoable from here, so a
        mass revoke can't be quietly reversed; the organizer re-issues person by person
  - [x] Offline-allow mode at the gates, with the duplicate-pass risk stated plainly in the UI
  - [x] Block / unblock a specific pass code
  - [x] Broadcast a banner to a tenant's public site
- [x] Every action appends to an audit trail with actor, timestamp, reason, and whether it's
      still in force. Lifting an action marks it resolved rather than deleting the record.
- [x] Lives in its own `platform-store.ts`, separate from the organizer's `dashboard-store.ts`,
      so an organizer-side bug can't reach a platform-wide kill switch
- [ ] The super-admin **role** still isn't modelled — the store exists, the auth boundary
      doesn't (open item in `docs/03-architecture/data-model.md` §11)

---

## 6. Phase 5 — Attendee buy path, verified  `[~]`

*Utsav: "platform pe aaunga, events dekhunga, details, kitne person ke hisaab se payment,
payment gateway, ticket + QR, aur scan karke verify ho sake."*

- [x] Every route on the path returns 200 and every unknown path 404s cleanly — checked live,
      81 routes across all 4 apps — `pnpm smoke`
- [x] **The QR was fake.** See 4.2 — this alone would have sunk the demo.
- [x] `pnpm verify:demo` traces the whole loop without a browser: phone → paid order → issued
      pass → that pass's exact QR string is in the gate scanner's manifest. Plus the gate-staff
      half: a dashboard-issued code verifies, a wrong one doesn't, and another person's code
      doesn't work on your phone. 18 checks, all passing.
- [x] Phone normalisation unified — `/auth/start`, checkout, and the scanner sign-in all use
      `normalizePhone`, so `98765 43210`, `098765…` and `+91 98765-43210` resolve the same way
      on all three surfaces. They previously had three near-identical regexes.
- [x] `/me/refunds` was a paragraph of text and a WhatsApp link. Now a real screen: your paid
      orders, days until the first night, the refund tier that applies, the exact amount you'd
      get back, and a request button — with the tiers computed in `quoteRefund` so the buyer and
      the organizer's queue read the same number.
- [ ] Click the path through in a real browser, end to end, by hand (code-traced and
      route-checked so far, not human-clicked)
- [ ] Quantity / "kitne log": the booking UI shows the pass name and `admits N` — verify a
      first-time buyer actually reads it that way
- [ ] Event sub-pages `/gallery`, `/faq` — routes exist and render, content is still thin
- [ ] Hardcoded English strings in client components (flagged in FE-11) → move to `packages/i18n`
- [ ] **Cross-process gap:** each app runs its own in-memory copy of mock-data, so a pass bought
      in `apps/web` never reaches `apps/scanner`'s manifest, and a refund requested in
      `apps/web` never reaches the dashboard's queue. Harmless for a demo (see `DEMO-SCRIPT.md`,
      which scans a seeded pass instead) and it disappears entirely once the database lands.

**Garba-native pass model — already correct, do not "simplify" it:**
`kind: season | weekend | single_night`, `admits: 1 | 2 | 4+`, `night_ids: []`, `zone_id`.
This is what makes it not-BookMyShow. Zone names (VIP / Gold / General) are just this one
organizer's fixture data and are fully configurable per event.

---

## 7. Phase 6 — UI pass  `[~]`

*Utsav: "UI thik kar, kuch jagah button nahi dikhte, kahan click karna hai pata nahi chalta."*
Reference inspiration: aceternity, magicui, shadcnblocks, lightswind, uilib, preblocks, shadcn/blocks.

**The complaint was literally true, and it wasn't a styling problem** — 21 buttons did nothing
when clicked, and the night cards and zone cards looked tappable while going nowhere. Fixing
that came before any visual work, and most of "the UI feels broken" went away with it.

- [x] Home page rebuilt into something that sells: dates and venue in the hero, one
      unmistakable primary CTA with a quieter secondary, **zones with real prices**, the nine
      nights, and a closing CTA. It was previously a headline and a row of cards.
- [x] Night cards navigate to that night's page and now *look* like they do — hover lift,
      border change, focus ring. They were visually identical to buttons and inert.
- [x] Zone cards are one big tappable target each, with the "admits up to N" line that explains
      the Garba pass model in passing, and a proper disabled treatment when nothing is on sale.
- [x] Empty states across the dashboard have a CTA inside them, not a bare "no data"
- [ ] Sweep the remaining dashboard screens for affordance — hover, focus ring, pressed state
- [ ] Scanner: verify at arm's length outdoors at night (can't be checked from a desk)
- [ ] Motion pass: restrained. Card hover and the scan verdict only. Nothing that animates on
      something a person triggers 200 times a night.
- [ ] Mobile sweep — the whole attendee path is a phone, and so is the scanner

---

## 8. Phase 7 — Demo readiness  `[~]`

*"Abhi demo banana hai, par aisa ki baad me real banane ki baari aaye toh kam time lage."*

- [x] One-command demo: `pnpm dev` brings up all 4 apps with seeded, believable data
- [x] **`DEMO-SCRIPT.md`** — the 12-minute click path, in order, with what to say at each step,
      the demo phone numbers, what to do when they ask the hard questions, and the limits to
      name out loud before a client finds them
- [x] `pnpm verify:demo` — run it before every client meeting. If it fails, the demo is broken
      even though every page still renders.
- [x] Reset procedure documented (restart `pnpm dev`, clear site data for :3000–:3003)
- [ ] Update `docs/PROGRESS.md`: flip FE-03…FE-11 from 🔵 to ✅ **only** for what has now been
      verified with a real build, and say plainly what is still unverified
- [ ] Fold this session's new files into `docs/06-frontend-build/HANDOFF-TO-BACKEND.md`:
      `gate-access.ts`, `fees.ts`, `gate-staff.ts`, `platform-store.ts`, and the new repo
      functions (`getZoneFromPrice`, `quoteRefund`, `requestRefund`, `listRefundsByPhone`,
      `listPendingRefunds`)

---

## 9. Known traps

| Trap | Detail |
|---|---|
| `pnpm build` lints | `next build` runs ESLint and **fails** on `react/no-unescaped-entities` and `no-html-link-for-pages`. Use `&rsquo;` / `&ldquo;` in JSX text, and `<Link>` from `@/i18n/navigation` (never `<a href="/...">`) for internal links. |
| Locale routing | `apps/web` and `apps/marketing` are `[locale]`-prefixed. Always import `Link` from `@/i18n/navigation`, never `next/link`, or the locale is lost. |
| `packages/ui` is source, not built | Apps consume it via `transpilePackages`. Inside the package all imports must be **relative** — no `@/` aliases. |
| Tailwind v4 | CSS-first. Tokens in `@layer base { :root {} }`, utilities in `@theme {}`. There is no `tailwind.config.js`. |
| pnpm 12 | `allowBuilds` in `pnpm-workspace.yaml`, not `onlyBuiltDependencies` in `package.json`. |
| Mock data is in-memory | Writes survive navigation, not a server restart. Don't mistake that for a bug. |
| Don't trust 🔵 in PROGRESS.md | Those phases were written without ever being built or run. Verify before believing. |
| Never run `pnpm build` while `pnpm dev` is running | They share `apps/*/.next`. The build overwrites it under the dev server and every route starts 500ing. Stop dev, build, then start dev again. |
| Bump the store `version` | `dashboard-store.ts` and `platform-store.ts` persist to localStorage. Change their shape without bumping `version` and a browser with stale state shadows your new defaults — you'll debug code that's already correct. |
| Each app has its own mock-data copy | Four Next processes, four in-memory stores. A write in one is invisible to the others. Don't design a demo step that crosses that line. |
| Fees live in exactly one place | `packages/domain/src/logic/fees.ts`. Never inline a percentage anywhere else — that's how the three-different-rates bug happened. |

---

## 10. Session log

| Date | Session | What actually got done |
|---|---|---|
| 2026-09-12 | Claude Code (CLI) | Phase 0 complete: fixed 3 typecheck errors + 4 build-blocking lint errors across `packages/ui`, `apps/web`, `apps/dashboard`, `apps/scanner`; deleted the dead `[city]` route; audited all internal links; wrote this file. All 4 apps build clean. |
| 2026-09-12 | Claude Code (CLI) | Revenue model unified (`computeFees` — the maths existed three times with three different rates), worked example added to `/pricing` in all three languages, zone "from" prices read real price tiers instead of a hardcoded table, `finance` overview rebuilt on real numbers (its donut was a fixed gradient), `/me/refunds` built for real with a refund quote + request flow, home page rebuilt to sell, night and zone cards made visibly tappable, phone normalisation unified across three surfaces, `DEMO-SCRIPT.md` written. Final state: `pnpm typecheck` ✅, `pnpm build` ✅ (4/4 apps), `pnpm verify:demo` ✅ (18/18), 81-route smoke test ✅, zero real dead buttons. |
| 2026-09-12 | Claude Code (CLI) | Phases 1.2/1.3, 3.2, 4 and the QR fix: all 21 dead buttons wired; pass-type / add-on / night / venue / zone / gate editors built on real store CRUD; vendors + sponsors CRUD; bank account and notification prefs persist; **real scannable QR** replacing the CSS placeholder on the pass page; share link + print-ready QR on publish; `/admin` overview and `/admin/emergency` with typed confirmations and an audit trail; added `pnpm verify:demo` (18 checks, all passing); 81-route smoke test clean; `pnpm build` clean. |
| 2026-09-12 | Claude Code (CLI) | Phase 1.1 + Phase 2: 404/error pages on all 4 apps; `buttonVariants` made server-safe; 79-route live smoke test (fixed the dead `/artist/[slug]` route); full gate-scanner access control built end to end — shared derived-code logic, scanner login + session guard + identity bar, dashboard issue/regenerate/revoke, gate-staff page rebuilt on real data. Renamed the last "Manharevents" strings to "ManharEvent". |
| 2026-09-13 | opencode (audit) | Wrote **`DEMO-AUDIT-PLAN.md`** — full file-level audit of all 4 apps (dashboard/web/marketing/scanner). Lists every PLACEHOLDER/FAKE/DEAD/i18n gap, a premium-UI plan mapped to 9 inspiration sites, build phases **P-D1…P-D5** with acceptance criteria, demo framing lines, and real-backend conversion refs. Next session: start **P-D1 (dashboard honesty pass)**. |
