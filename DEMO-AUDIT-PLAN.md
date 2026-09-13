# DEMO-AUDIT-PLAN.md — ManharEvent "Proper Working Demo"

> **Purpose of this file:** one place that lists *everything* that is still incomplete,
> half-finished, or fake in the current demo, plus the exact UI-polish plan so the
> platform looks premium. The goal is a demo where an organizer can be shown **the entire
> process working end to end** — register → approval → build event → publish → link/QR →
> buyer buys → pass + QR → gate scan → money math — with every screen connected, nothing
> dead, and the path later convertible to a real backend.
>
> Owner: Utsav (Manhar Creatives) · Repo: `D:\ClientDataBase\garba` · Last audited: 2026-09-13
>
> Companion files: `DEMO-SCRIPT.md` (the 12-min click path), `TODO.md` (live session log),
> `docs/06-frontend-build/HANDOFF-TO-BACKEND.md` (mock → real database map).

---

## 1. The goal (read this first)

A demo is not a real product. For **this** client demo, three rules:

1. **Everything an organizer touches must work.** No dead buttons, no placeholder pages,
   no page that silently does nothing.
2. **The process must be visible as one loop.** Organizer → Manhar approval → event build →
   public site → buyer order → pass QR → gate scan → fee maths. Each step must visibly hand
   off to the next.
3. **Nothing fake may be shown as real.** OTP/Razorpay/WhatsApp stay simulated, but the
   **flow** around them is real. We say what's simulated *before* the client finds it.

The real backend decision already exists: `HANDOFF-TO-BACKEND.md`. Every mock point below
notes where the real version will take over.

---

## 2. Inventory — verified working today (foundation, don't break it)

### Apps (4 Next.js apps, one pnpm/turbo repo)

| App | Port | Who | Entry |
|---|---|---|---|
| `apps/marketing` | 3003 | Organizer (pre-account) | `/` → `/pricing` → `/register` |
| `apps/web` | 3000 | Attendee | `/en` → `/e/[slug]` → `/book` → `/checkout` → `/me/passes` |
| `apps/dashboard` | 3001 | Organizer `/dashboard/*` + Manhar ops `/admin/*` | `/dashboard` |
| `apps/scanner` | 3002 | Gate staff | `/login` → `/scan` |

### Verified working

- `pnpm typecheck` + `pnpm build` clean on all 4 apps; `pnpm verify:demo` 18/18 passes.
- **Organizer side:** event wizard screen, pass-type CRUD with price tiers, add-ons CRUD,
  nights + lineup, venue/zone/gate editor, publish page + **real downloadable QR**,
  comp passes, vendors, sponsors, team + gate scanner credential issue/revoke,
  gate-staff coverage view, settings → branding / payments (real IFSC validation + masking)
  / notifications, audit log, `/admin` overview, `/admin/tenants` approval loop,
  `/admin/emergency` with typed-phrase confirmations + audit trail.
- **Attendee side:** home, event landing (dates/venue/nights/zones/prices), book flow,
  checkout with **one shared fee-math function** (`computeFees`), real order + pass
  issuance, `/me/passes` with a **real scannable QR**, `/me/passes/[passId]`, refunds with
  real quote math, legal pages, auth flow (mock OTP), locale switching (en/gu/hi).
- **Scanner:** gate-staff-only login (phone + derived code), full scan loop with camera,
  torch, beep/haptic verdicts, offline queue (Dexie), session log + CSV, manual entry,
  onboarding, per-person traceability (`staff_id`).
- **No real dead buttons** on the main paths (the component gallery is intentionally inert).
- 81-route smoke test clean; 404/error pages branded on all 4 apps.

---

## 3. The one core problem — no shared database

The four apps are **four separate processes, each with its own in-memory copy** of
`packages/mock-data`. Consequences:

1. A pass bought in `apps/web` (3000) is **not** in the scanner's (3002) manifest.
2. A tenant approved in `apps/dashboard` (3001) is **not** visible as "approved" in
   `apps/marketing`'s (3003) status poll.
3. Refunds / orders written in one app don't reach another app's queues.

**How the demo deals with it today:** `DEMO-SCRIPT.md` scans the *pre-seeded* pass
`MG26-7F3K-9021` instead of the freshly-bought pass, and the approval demo ends on the
`/admin/tenants` screen (the marketing status screen is a separate process).

**Demo rule:** never design a demo step that requires two different apps to see a change
made microseconds apart. Frame it honestly: *"the four apps don't share a database yet —
that's the final wiring step, mapped file-by-file."* When the database lands (P-02), this
gap disappears without a single component change.

---

## 4. Per-app gap list (file-level)

Legend: **PLACEHOLDER** = doesn't persist/do anything · **FAKE** = hardcoded numbers shown as
live · **DEAD** = button/link with no handler · **THIN** = works but content is weak ·
**i18n** = hardcoded English that should be translated.

### 4.1 `apps/dashboard` — organizer + admin (biggest gap surface)

#### 4.1.1 Pages that don't really work (fix first)

| Route | File | Problem |
|---|---|---|
| `/dashboard/events/new` | `events/new/page.tsx` + `event-wizard.tsx` | **Save as draft doesn't create an event** — just writes an audit entry + navigates. `?clone=` ignored, hardcoded `mockEvent`. "Default pass types will be created automatically" **claim is false** — nothing is created. |
| `/dashboard/events/[id]/policy` | `events/[id]/policy/page.tsx` | **PLACEHOLDER.** Save writes one audit entry + fake "Saved!" — **persists nothing**; no policy slice in the store. Refund tiers hardcoded. |
| `/dashboard/events/[id]/publish` | `events/[id]/publish/page.tsx` | **Never updates `event.status` in the store.** Publish/unpublish + unlisted toggle are local `useState` only. Public page would keep showing "not published" behaviour — inconsistent. |
| `/dashboard/finance/refunds` | `finance/refunds/page.tsx` | **PLACEHOLDER.** `MOCK_REFUNDS` hardcoded array (`Rina Kaushik`, `Priya Shah`, `#1001`, `#1002`); approve/reject only appends audit entries, the list never changes. Not connected to the buyer's `/me/refunds` queue. |
| `/dashboard/finance/payouts` | `finance/payouts/page.tsx` | **PLACEHOLDER.** `MOCK_PAYOUTS` hardcoded; stat tiles are literal strings `₹68.2L` / `₹87.6L` / `₹52.9L`. Only the amber "net liability" line reads real orders. |
| `/dashboard/settings/domain` | `settings/domain/page.tsx` | **PLACEHOLDER.** All local state, nothing saved. **"Verify DNS" fakes it** (`verifying → ok` immediately). |
| `/dashboard/events` | `events/page.tsx` | **Clone button has no `onClick` — dead.** |
| `/dashboard/events/[id]` | `events/[id]/page.tsx` | Unknown event id **silently falls back to `events[0]`** (shows wrong event instead of 404). Preview button hardcodes `http://localhost:3000/e/{slug}` (publish page uses env var — inconsistent). |

#### 4.1.2 Fake numbers presented as live

| Where | What's fake | File |
|---|---|---|
| Live Overview & Live Ops | zone occupancy = `capacity × 0.62` (hardcoded multiplier); `NIGHTLY_SALES` chart; `topPassTypes` with fake sold counts | `events/[id]/live/page.tsx`, `dashboard/page.tsx` |
| Reports | `DAILY_SALES` chart + `ZONE_BREAKDOWN` hardcoded | `events/[id]/reports/page.tsx` |
| Finance overview | hardcoded stat tiles | `finance/payouts/page.tsx` |
| Admin overview | **"1" live organizer hardcoded**; a single hardcoded tenant card | `(admin)/admin/page.tsx` |
| Branding preview | preview cards are hardcoded demo content (`Rina & Kaushik`, `PASS-7F3K-9021`) | `settings/branding/page.tsx` |

#### 4.1.3 Dead buttons (no handler)

- Clone event — `events/page.tsx`
- **Export CSV** — `events/[id]/attendees`, `events/[id]/checkins`, `finance/orders`,
  `settings/audit`
- **PDF + Export GSTR-1** — `finance/gst` (invoice numbers `INV-2026-…` synthetic)
- **Verify DNS** — `settings/domain`

#### 4.1.4 Wiring/fidelity gaps

- `finance/gst`: heading "October 2026" hardcoded, invoice numbering synthetic.
- `events/[id]/attendees`: searches **orders** as a proxy — no real pass-holder data;
  "attendees" concept doesn't exist yet.
- `events/[id]/live`: broadcast announcements are local-only (never sent anywhere).
- `team/page.tsx`: role-switcher is an explicit demo shim (`"Demo: viewing as —"`).
- `settings/payments`: Razorpay Key ID + GSTIN hardcoded read-only (accepted demo values).
- `dashboard-store.ts` actor hardcoded `"Jignesh Shah"` for every audit entry.
- **The whole app has zero i18n** — 100% hardcoded English (see 4.6 for a sweep plan).

### 4.2 `apps/web` — attendee

#### 4.2.1 Process-breaking issues (fix before customer)

| Where | Problem | File |
|---|---|---|
| Checkout status | **Fake CSS QR** (repeating gradient → unreadable by camera). Real scannable `QrCode` only exists on `/me/passes/[passId]`. Download-PDF is disabled ("coming soon"). | `components/checkout/order-status-client.tsx`, `checkout/[orderId]/status/page.tsx` |
| Checkout pay with empty cart | If cart is empty (fresh browser deep-link), `handleMockPay` **skips pass issuance** and still shows "passes being generated" | `components/checkout/checkout-client.tsx` |
| Footer WhatsApp | **"Support on WhatsApp" → `/auth/start`** (a sign-in page, not WhatsApp) | `components/layout/site-footer.tsx` |
| `/g/[groupInviteCode]` | Bare code echo, **no data lookup**, hardcoded CTA to `/e/manhar-navratri-2026/book`, ignores existing `GroupInvite` i18n | `[locale]/g/[groupInviteCode]/page.tsx` |

#### 4.2.2 Thin / placeholder content

- **No photography anywhere** — `cover_url`, `og_image_url`, artist `photo_url`, venue
  `map_image_url`, tenant `logo_url` are all `null` in fixtures. Home/event hero is a CSS
  radial gradient. Gallery is 9 grey boxes. Artist page avatar is a letter circle.
- `event.description` is `null` → **About section never renders** on the event landing.
- Venue page literally shows `[Map embed — 23.0225, 72.5714]` placeholder text.
- Night page shows raw ISO date `2026-10-02` (unformatted).
- Lineup page: `artists.slice(0,2)` per night **ignores the real `night_lineup` relation** —
  fixture only maps nights 1/5/9, so most nights show the same two artists.
- FAQ: hardcoded English array (same for every event), WhatsApp number hardcoded.
- Artist "View event" card hardcodes event name/dates/venue.

#### 4.2.3 i18n gaps

- **Bug:** `gu.json`/`hi.json` are missing the 15 `Checkout.*` keys — checkout falls back to
  English on Gujarati/Hindi.
- Zero next-intl: `me/orders`, `me/passes/[passId]`, `me/refunds`, `app/error.tsx`.
- Partial: `checkout-client.tsx` (fee labels + paragraphs raw), `order-status-client.tsx`,
  `book-client.tsx` (fee lines + aria-labels raw), `auth/*`, `me/passes`.
- Server pages fully raw English: night, lineup, venue, gallery, faq, artist, `g/[code]`,
  legal bodies, `not-found.tsx`.
- Existing-but-unused namespaces: `Artist`, `GroupInvite`, `Me.refunds*` keys exist and
  are translated but never consumed.

#### 4.2.4 Other

- Success copy on `/me/passes` shows raw `order.status.replace(/_/g," ")` badge; hardcoded
  `"en-IN"` dates in several places; `me/page.tsx` + `mobile-bottom-nav.tsx` raw aria-labels.
- `robots.ts` `disallow /api/` is aspirational — no API routes exist at all.

### 4.3 `apps/marketing` — organizer acquisition

- Home page is **thin for an acquisition landing**: no trust/stat band ("N organizers" /
  "Lakhs of scans"), no 3-step "how it works" (register → we approve → launch), no pricing
  teaser, no product/gate-scanner visual, no FAQ, no testimonials, no contact/sales form,
  no footer legal links (Terms/Privacy keys exist, unused).
- Pricing page is honest fee-transparency only — no plans/tiers, no feature matrix, no FAQ.
- **OTP send is mocked** (500ms sleep, no SMS) and **OTP verify is mocked** (any 6 digits)
  — fine for demo, frame it.
- `provisioned` page hardcodes `localhost:3000` / `localhost:3001` (+ `?tenant=` query).
- Register flow can only ever reach `under_review` at runtime; `approved`/`provisioned`
  states come from seeded fixtures or the dashboard's approve screen (separate process —
  see §3).
- Single organizer/event in fixtures — the "every organizer gets their own site" pitch
  can't be shown as a contrast. Consider a **second demo event/tenant fixture**.

### 4.4 `apps/scanner` — gate PWA

##### 4.4.1 Security/correctness (demo limits, but never pretend)

- `lib/crypto.ts` **stub**: `verifyQrPayload` accepts **any** `MG26.v1.*.*` as valid. Any
  forged payload in the manifest passes. Real HMAC-SHA256 lands in P-12.
- `lib/realtime.ts` is a no-op — cross-device anti-passback doesn't exist (same pass at two
  gates won't show "already in" until sync).
- Manual entry **exit not possible** — mode hardcoded `"in"` on `scan/manual`.
- Signing secret ships in the client bundle (documented demo-grade).

##### 4.4.2 Branding / PWA

- Manifest icons are **SVG only** (`/icons/icon-192.svg`, `icon-512.svg`); the real PNG brand
  kit in `public/brand/` **is referenced nowhere**; **no favicon**; `apple-touch-icon` points
  to an SVG (unreliable on iPhone).
- Service worker only injects in **production build** — app-shell offline is off in `pnpm dev`
  (the online/offline toggle is a mock).
- **Whole scanner is English-only**, including gate verdict copy.

##### 4.4.3 Field gaps

- No supervisor-authorization override for `CALL SUPERVISOR` cases (only dismiss).
- No night label on the main scan screen (only manual page shows it).
- iOS: no wake-lock handling; camera-fail path is text only; no high-visibility/brightness
  mode for daytime outdoor use.

### 4.5 Cross-cutting

- No `loading.tsx` anywhere — slow routes (`/e/[eventSlug]`, `/dashboard/events/[id]/*`,
  `/checkout/[orderId]`) flash blank.
- No PWA/`manifest.json`/`icon.png` on `apps/web` or `apps/dashboard` (attendee + organizer
  aren't add-to-homescreen).
- `.env` files don't exist; three different URL sources for the web app drift
  (`localhost:3000` in event Preview, `NEXT_PUBLIC_WEB_URL` in publish, `?tenant=` in
  provisioned).
- `apps/` binaries aside: a master **"future demo tenant 2"** fixture doesn't exist
  (see 4.3 and P-D3).

### 4.6 Hardcoded-English sweep (global i18n backlog)

`next-intl` is installed and en/gu/hi message files exist at `packages/i18n/messages/`.
The following files need keys + translations moved in (priority order):

1. `apps/web`: `me/orders`, `me/passes/[passId]`, `me/refunds`, `app/error.tsx`,
   `checkout-client.tsx` fee labels, `order-status-client.tsx`, `book-client.tsx` fee lines.
2. **Fix `gu.json`/`hi.json` missing `Checkout.*` keys.**
3. `apps/scanner`: whole app (verdicts, login, manual, log, onboarding, error/not-found,
   db defaults).
4. `apps/dashboard`: whole app (biggest job — do last, or accept English-only for demo and
   note it).
5. `apps/marketing`: `error.tsx`, `not-found.tsx`, layout metadata.

---

## 5. UI polish plan — premium look

Utsav's bar: *"UI sahi nahi hai, karta nahi dikhta."* Two rules: (1) every interactive thing
must *look* interactive (hover lift, focus ring, pressed state); (2) borrowed sections must
fit the existing design system (`packages/ui`, Tailwind v4 tokens, dark-first) — import the
**idea**, not a conflicting theme.

### 5.1 Reference sites → which sections

| Where to apply | Steal from |
|---|---|
| Marketing hero (organizer homepage): device/screenshot mockup, animated gradient / spotlight bg, big CTA pair | `https://uilib.co/category/hero-sections` · `https://preblocks.com/ui` |
| Marketing: value props, sticky CTA, how-it-works steps | `https://shadcnblocks.com/blocks/free` · `https://lightswind.com/blocks` |
| Marketing & event landing: stats/trust band, marquee of organizers, pricing card | `https://magicui.design` (marquee, count-up, particles, animated number) · `https://blocks.serp.co` |
| Dashboard: cards, tables, forms, stats grid, empty states | `https://ui.shadcn.com/blocks` (dashboard login/table blocks) · `https://ui.aceternity.com/components` |
| Micro-motion (restrained): card hover, count-up stats, scan verdict reveal | `https://ui-incubator.com/catalog` · `https://magicui.design` |
| Event landing: night cards, zone cards, lineup | `https://lightswind.com/blocks` · `https://uilib.co` |

**Motion rule (from TODO Phase 6):** restrained. Card hover + scan verdict only. Nothing
that animates on something a person triggers 200× a night.

### 5.2 Concrete UI gaps worth fixing for a premium feel

1. **Marketing homepage** — add: stats/trust band, 3-step how-it-works, one FAQ block,
   a "this is what your buyers see" screenshot section (use a real render of `/en/e/...`).
2. **Web home & event landing** — real photography placeholders via a curated fixture
   (9 Garba night images, artist avatars, venue map image). Until Utsav/paid stock: use
   generated placeholders, never grey boxes.
3. **Dashboard stat tiles & charts** — replace fake arrays with store-derived numbers or a
   clearly-labelled "sample" legend.
4. **Mobile** — dashboard sidebar hidden below `sm` with no drawer → add a bottom nav or
   hamburger drawer; full mobile sweep on attendee path.
5. **Scanner** — bigger verdict text, night label on main screen, PNG icons + favicon,
   high-visibility toggle.
6. **All dead buttons → working (see 4.1.3).**
7. `loading.tsx` skeletons on slow routes.

---

## 6. Build order (phases, each with acceptance criteria)

### P-D1 · Dashboard honesty pass (fix the "does nothing" pages)
- [ ] `events/new`: actually create an event (draft) in the store + optionally clone the
  selected event's pass types/addons; remove the false "default pass types will be created"
  line or make it true.
- [ ] `policy`: add a `policy` slice to `dashboard-store.ts` + real save/audit.
- [ ] `publish`: write `event.status` (published/unlisted) into the store with audit entry.
- [ ] `finance/refunds`: source from the same refund model the buyer's `/me/refunds` writes
  (seed a couple + approve/reject mutates the list); remove `MOCK_REFUNDS`.
- [ ] `finance/payouts`: compute 3-night tranches from real paid orders + real TDS/GST;
  remove hardcoded tiles.
- [ ] `settings/domain`: persist chosen domain + show a believable "verification pending"
  flow (mock step is fine, but it must be a **declared** step, not an instant fake OK).
- [ ] Dead buttons wired: clone, all Export CSV/PDF, verify DNS.
- [ ] `events/[id]`: `notFound()` on unknown id; Preview uses `NEXT_PUBLIC_WEB_URL`.
- [ ] Remove/replace `×0.62` + hardcoded charts with store-derived values (or labelled sample).
- ✅ **Accept:** no dashboard screen shows a number that isn't derived from the store or
  explicitly labelled "sample"; every button does something real.

### P-D2 · Attendee path polish (the money screens)
- [ ] Checkout `/status`: render the **real `QrCode`** (same as pass page); remove fake CSS QR.
- [ ] Empty-cart pay: guard `handleMockPay` — if cart empty, redirect back to book (no
  silent pass-less "success").
- [ ] Fix footer "Support on WhatsApp" → real `wa.me` link (env var).
- [ ] `g/[groupInviteCode]`: implement a real group lookup (add a `GroupInvite`/holder mock
  function) or hide the route from nav until P-11; use the existing `GroupInvite` i18n.
- [ ] Lineup page joins `night_lineup` (per-night artists, not `slice(0,2)`).
- [ ] Night page: format dates, add the night's lineup row, translate.
- [ ] Gallery + About + FAQ from a real **per-event content fixture** (not page-local constants).
- [ ] Add `Checkout.*` keys to `gu.json`/`hi.json`.
- [ ] Venue: replace `[Map embed…]` with a static map image + real address block.
- ✅ **Accept:** a first-time buyer on any phone can go home → book → pay (mock) → get a
  scannable QR → open My Passes and see it, fully in any of en/gu/hi.

### P-D3 · Marketing premium + second demo tenant
- [ ] Add a **second organizer/event fixture** (different city, theme, price points) so
  "every organizer gets their own site" is demonstrable as a contrast.
- [ ] Marketing homepage: trust/stat band, how-it-works, FAQ, screenshot section, legal
  footer links.
- [ ] Provisioned page: URL sources via env vars (kill `localhost` literals).
- ✅ **Accept:** the homepage reads like a product, and the demo can show two organizer sites.

### P-D4 · Scanner edge fixes
- [ ] Manual entry: allow Entry/Exit mode (remove hardcoded `"in"`).
- [ ] PNG icons + favicon from `public/brand/`; fix `apple-touch-icon`.
- [ ] Night label on the main scan screen.
- [ ] Declare the crypto/realtime stubs clearly in UI-free spots (docs + verify script);
  no behaviour change until P-12.
- ✅ **Accept:** gate log can record both entry and exit manually; branding is sharp on
  iPhone + desktop.

### P-D5 · Full-loop verification
- [ ] Extend `pnpm verify:demo`: also trace organizer creates event → publishes → pass sold
  (same process) → appears in scanner manifest of the *same* process; refund requested
  → appears in dashboard queue of the *same* process (single-process assertions).
- [ ] Rewrite `DEMO-SCRIPT.md` to the connected loop with a second organizer.
- [ ] `loading.tsx` skeletons, mobile sweep, motion pass, affordance sweep.
- [ ] i18n sweep (4.6) for anything on the demo path.
- [ ] Update `TODO.md` + `docs/PROGRESS.md` statuses; fold new files into
  `HANDOFF-TO-BACKEND.md` (§ed new repo functions).
- ✅ **Accept:** `pnpm dev` + `pnpm verify:demo` + the 12-min script run start-to-finish
  without touching a "broken" screen.

---

## 7. What stays simulated — and exactly how to say it (demo framing)

Use these lines before the client finds the gaps. Never pretend.

| Stage | What's simulated | Say (Hinglish-friendly) |
|---|---|---|
| OTP every surface | SMS/OTP provider | "OTP abhi screen pe aata hai — live SMS provider baad me lagta hai, process wahi hai." |
| Registration → approval | provisioning | "Approve karte hi [subdomain + site + panel] create hone ki **process** dikha rahi hai; server par ye poora one-click ho jayega." |
| Buy → pay | Razorpay | "Pay button abhi demo me order + QR bana deta hai. Real me Razorpay window khulegi, jiska design baaki hai" — point at fee split staying identical. |
| QR signing | HMAC | "Abhi demo signature stub hai; real me har QR server-seed signed hoga taaki fake QR na chale." |
| Pass delivery | WhatsApp/SMS | "QR turant on-screen aata hai; WhatsApp/SMS delivery real me lagta hai, same QR." |
| Refund/payout money | real bank payouts | "Refund/Payout **ledger** chalta hai; real bank/UTR settlement pending hai." |
| Check-in sync across apps | shared DB | "Chaaron apps ka data abhi alag process me hai — isliye hum pehle se bana pass scan karte hain. Ye ek hi baar wiring ka kaam hai (HANDOFF-TO-BACKEND)." |

---

## 8. Real conversion — where each mock becomes real

Everything in this file that is "simulated" has a documented real replacement:

- **Database + multi-tenancy:** `HANDOFF-TO-BACKEND.md` §0–§8, `docs/03-architecture/data-model.md`.
- **Auth (OTP, sessions, scanner codes):** P-03 (Supabase phone auth + MSG91); scanner login
  codes → `scanner_login_codes` table (data-model §5).
- **Payments:** P-09 Razorpay + `/api/webhooks/razorpay/route.ts` (doesn't exist yet) —
  replaces `completeMockOrder` (do **not** port that function wholesale).
- **Pass QR + delivery:** P-10 HMAC signing (`scanner/src/lib/crypto.ts`), WhatsApp + SMS/Push.
- **Scanner manifest + check-ins + realtime:** P-12 `build_scan_manifest` RPC, `recordCheckIn`
  upsert, `realtime.ts` → Supabase Realtime.
- **Finance:** P-14/P-15 ledger, refunds (6 side effects), payouts, GST reporting.
- **Notifications:** P-16 template engine (17 keys × 3 languages).

**Golden rule (from TODO):** thread every new number through `packages/domain` logic
(`fees.ts` is the only place percentages live) and swap mock bodies inside
`packages/mock-data/src/repo.ts` — zero component changes.

---

*End of DEMO-AUDIT-PLAN.md · Update this file as screens get fixed in P-D1…P-D5.*