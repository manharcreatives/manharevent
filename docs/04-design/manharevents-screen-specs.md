# 10 · ManharEvent — Screen-Level UI/UX Design Specification

> **Companion to `design-system.md` and `ux-principles.md`.** Those two files lock the *tokens, components, and rules*. This file locks *what the actual screens look like* — informed by 10 curated reference designs (event ticketing apps, organizer dashboards, gate-scanner apps, and festival websites) analysed against this platform's requirements.
>
> **Product name from this point forward: `ManharEvent`.** The engineering docs (01–03, 05) still say "Manhar Garba Platform" / codename `manhar-garba` — that codename is unchanged internally (repo name, DB name, etc.), but every user-facing surface (site title, app name, PWA manifest, email/WhatsApp sender name, App/Play listing if it ever ships native) reads **ManharEvent**. Logged in `PROGRESS.md` decision log.
>
> **Non-negotiable constraint driving every screen in this file:** ManharEvent is **100% online**. There is no POS terminal, no ticket-printing hardware, no card-swipe machine, no standalone kiosk software. An organizer runs the entire operation from a phone or laptop browser. Gate staff run the scanner from a phone browser (installed as a PWA, not a native app from a store). Every screen below is designed against that constraint — nothing in this document assumes a peripheral, a driver, or an install outside a browser/PWA.

> **🔁 Pivot (2026-09-12) — read `02-product/product-spec.md`'s pivot note first.** ManharEvent is B2B SaaS: each organizer gets their own single-tenant event website, admin panel, and gate-scanner access — not a shared marketplace with cross-organizer city/date discovery. **§1.1 below (Home) is superseded where it shows a city picker, cross-organizer "Browse by city" row, and "42 organizers · 18 cities" trust badge** — kept struck-through for history, replaced by a single-tenant home. **New: §0 below** specs the marketing + registration platform (Surface 0) this pivot adds — the actual front door into ManharEvent now. **New: `<FeeBreakdown>`** is specced under §1.4 — the platform-fee-vs-gateway-fee line items required by the pivot. **New note under §2.4** — gate-scanner access (Surface 3) is issued exclusively from Team → Gate Staff in the admin panel; there is no other way to get it.

---

## 0. Surface 0 — ManharEvent marketing + registration (new)

This is the actual entry point now: a prospective organizer lands here, not on any per-event public site. Two jobs on one small surface — convince, then register — so it reads as a focused sales site, not a SaaS-dashboard-in-disguise.

### 0.1 Landing — `/`

```
┌──────────────────────────────────────────────┐
│  ManharEvent            Pricing  Register ≡  │  ← sticky, dark surface
├──────────────────────────────────────────────┤
│                                                │
│      FULL-BLEED NAVRATRI PHOTOGRAPHY (ref #7) │  ← real, traditional, people-forward
│      "Your own Garba platform.                │     imagery — generated via ChatGPT
│       Not a listing. Yours."                  │     Desktop, done last (see doc header)
│                                                │
│              [ Register your event ]          │  ← the one primary action on this page
│                                                │
├──────────────────────────────────────────────┤
│  Why organizers switch                        │
│  ┌────────┐ ┌────────┐ ┌────────┐             │
│  │Your own│ │Lower fee│ │No queue│            │  ← 3 value cards, not a feature wall
│  │ domain │ │than BMS │ │ at gate│             │
│  └────────┘ └────────┘ └────────┘             │
├──────────────────────────────────────────────┤
│  What you get after approval                  │
│  1 · Your event website   2 · Admin panel     │  ← maps directly to Surfaces 1–3,
│  3 · Gate scanner (issued from your panel)    │     sets accurate expectations pre-signup
├──────────────────────────────────────────────┤
│  Footer: Pricing · Register · Support (WA) · Legal │
└──────────────────────────────────────────────┘
```

No "Explore events" anywhere on this page — a visitor who is not an organizer has nothing to browse here; that's deliberate.

### 0.2 Pricing — `/pricing`

Two line items, always shown together, never merged — this is the visual template `<FeeBreakdown>` (§1.4) reuses inside checkout:

```
ManharEvent platform fee     ₹X per ticket    ← minimal, framed explicitly vs. BookMyShow/Insider
Payment gateway fee           ~2% (Razorpay)   ← pass-through, disclosed as not ManharEvent's to set
                                                 or absorb
```

Plain-language copy explaining *why* both lines exist (one is ManharEvent's fee for the platform, the other is what Razorpay/Stripe charges to move the money) — this is a trust device, not fine print, so it's full-size body text, not a footnote.

### 0.3 Registration — `/register` → `/register/verify` → `/register/status`

```
Step 1  Phone number → OTP (6-digit)         ← identical pattern to attendee checkout (F1) —
                                                one identity mechanism, reused everywhere
Step 2  Org details:  org name · contact person · city · rough scale (capacity) · desired domain
Step 3  Submit → status screen

Status screen states (must always show exactly one, never a blank spinner):
  "Submitted — under review, typically <48h"
  "Approved — setting up your platforms…"
  "Approved — ready" → [ Go to admin panel ]
  "More info needed — <specific reason>" → [ Update & resubmit ]
  "Not approved — <specific reason>"
```

### 0.4 Provisioned — `/register/provisioned`

One screen, one job: hand the organizer their three platforms.

```
🎉 You're live on ManharEvent

Your event website     https://<their-domain>            [ Open ]
Your admin panel        https://admin.<their-domain>      [ Open & set up your event ]
Gate scanner access     Issue from Team → Gate Staff in your admin panel, whenever you're ready

Next: run the event setup wizard (takes ~15 minutes) →
```

This screen is the handoff into F3 (event setup wizard) — from here on, the organizer lives in Surface 2.

---

## Reference map — how the 10 references inform ManharEvent screens

Ten designs were pulled for range: mobile booking apps, an organizer/admin dashboard, a gate/QR scanner app, festival marketing sites, and a premium digital ticket. None is copied wholesale — each contributes one pattern, filtered through the locked dark-festival token set (`design-system.md §2`) and the "advanced underneath, obvious on top" principle.

| # | Reference | What it's good at | Where it lands in ManharEvent |
|---|---|---|---|
| 1 | Dark mobile ticketing app (event feed → artist page → ticket) | Clean 3-screen mobile narrative, bottom tab bar | Public site mobile layout rhythm; confirms bottom-tab nav (Explore · My Passes · Wallet · Account) |
| 2 | Mobile booking with interactive seat/zone map | Turning an abstract inventory choice into a picture | `<ZoneMap>` visual treatment on the pass selector's Zone step |
| 3 | Light, warm-gradient event-discovery cards | Card-based browsing without a carousel | `EventCard` grid treatment — ~~for Home / city discovery~~ superseded (2026-09-12): now used only for a multi-event *organizer's own* event grid, never cross-organizer (carousels are still banned — see UX rule) |
| 4 | Organizer dashboard, dark sidebar, stat tiles + revenue chart + activity feed | Live-ops-at-a-glance layout | Dashboard **Live Overview** screen structure |
| 5 | Organizer dashboard, white sidebar, KPI cards + donut chart + transaction table | Clean data-table + summary-card pairing | Dashboard **Finance** and **Attendees** screen structure |
| 6 | Neon green/black QR gate-scanner app | Full-bleed colour verdict, ticket detail on scan | Confirms `<ScanResult>` full-bleed pattern (already specced); informs the "ticket detail" secondary view |
| 7 | Bold dark festival website hero ("Feel The Sound") | Photography + big display type + pill nav + floating trust badge | Public site **Home** hero, header nav shape |
| 8 | Photo-hero site with inline date/location/category search bar | Search-as-a-hero-element | ~~Home's city/date search block~~ superseded (2026-09-12): that cross-organizer search bar is removed; this pattern now only informs Surface 0's own landing hero (§0.1), which has no search — just a single "Register your event" action |
| 9 | Premium Indian artist-centric digital ticket pass | Portrait card, duotone photo panel, bold name plate, date pill | `<PassCard>` visual redesign |
| 10 | Vibrant purple/magenta nightlife app with map + event detail | Festive glow, gradient panels, map-first discovery | Featured-event card glow treatment; informs an optional venue-map discovery view (post-v1) |

None of the ten used Gujarati/Hindi type, a zone-based standing-crowd model, or an offline scanner — those are ManharEvent-specific and are specified fresh below, using the *patterns*, not the *content*, of the references.

---

## 1. Organizer's own event website (their own domain → branded as **that organizer**, powered by ManharEvent)

### 1.1 Home — `/`

> **Superseded (2026-09-12):** the wireframe below originally showed a ManharEvent-wide home — city picker, cross-organizer "Browse by city" row, and an organizer-count trust badge. That assumed attendees discover events *through* ManharEvent. They don't: each organizer's domain lands attendees directly on that organizer's own event, full stop. Kept struck-through for history.

```
┌──────────────────────────────────────────────┐
│~~ManharEvent logo    Explore  Cities  ≡ Lang~~│  ← superseded nav
│  <Organizer name/logo>          Lineup ≡ Lang │  ← this organizer's own brand, not ManharEvent's
├──────────────────────────────────────────────┤
│                                                │
│        FULL-BLEED PHOTO HERO (ref #7)         │  ← this organizer's own event photography
│        Display headline, 2 lines max          │     (or, pre-event, a themed hero — see
│        "This Navratri, nine nights, one pass" │     image-generation note in doc header)
│                                                │
│   ~~┌──────────────────────────────────────┐~~ │
│   ~~│  📍 City   📅 Dates   🎭 Category  🔍│~~ │  ← superseded: cross-organizer search bar
│   ~~└──────────────────────────────────────┘~~ │     removed — nothing to search across
│                                                │
│   ~~🎉 42 organizers · 18 cities live this year~~│  ← superseded trust badge
│   🔒 Secured by Razorpay · Organized by <name> │  ← replacement: single-organizer trust strip
├──────────────────────────────────────────────┤
│  [ Book Passes ]                               │  ← the one primary action, straight to booking
│  Night-by-night lineup preview                 │     (see §1.2 — Home can simply BE the event
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │     landing page for a single-event organizer;
│  │NightCrd│ │NightCrd│ │NightCrd│ │NightCrd│  │     a multi-event organizer gets a short
│  └────────┘ └────────┘ └────────┘ └────────┘  │     EventCard grid of THEIR OWN events only)
├──────────────────────────────────────────────┤
│~~Browse by city  [Ahmedabad][Surat][Vadodara]~~│  ← superseded: removed entirely
├──────────────────────────────────────────────┤
│  Footer: About <organizer> · Support (WA) · Legal · Language · Powered by ManharEvent │
└──────────────────────────────────────────────┘
```

**EventCard spec** (only relevant for an organizer running more than one event/venue — never cross-organizer):
- 4:5 portrait photo, rounded-lg (`--radius-lg`), gradient scrim bottom 40% for text legibility
- Bottom-left: event name (Bricolage Grotesque, 1.25rem), venue + date range (muted)
- Top-right chip: price-from (`₹499 onwards`) on a `--surface-raised` pill
- On hover/focus (desktop): lift 4px + `--shadow-glow` in `--primary` (ref #10 glow language)
- Tapping anywhere on the card opens the event landing page — no separate "View" button (one primary action)
- ~~Grid of cards representing different organizers~~ — superseded; this grid, when it appears at all, only ever lists events belonging to the one organizer whose domain this is

Mobile: single column, 16px gutters. ~~Hero search bar becomes a full-width tap target that opens a bottom sheet (city → date → category)~~ — superseded; the hero's one tap target is "Book Passes", straight into F1.

### 1.2 Event landing — `/e/[eventSlug]`

```
Cover image (16:9, LCP-priority) with gradient scrim
Title · dates · venue · headline artist          [Share ↗]
Price-from                          [ Book Passes ]  ← the one primary button on this page
─────────────────────────────────────────────────
Trust strip: organizer logo + name · 🔒 Secured by Razorpay · WhatsApp support
─────────────────────────────────────────────────
About this event (2–3 short paragraphs, no jargon)
Night-by-night lineup   → 9 × <NightCard> horizontal-scroll row on mobile, grid on desktop
  <NightCard>: night #, date, theme name, dress-code chip, headline artist thumb
Zones                    → <ZoneCards> — name, what's included, price-from, availability pill
Venue                    → static map embed, "how to reach", parking note
Gallery                  → grid, lightbox, no auto-advancing carousel
FAQ                      → accordion
Refund policy            → plain language, before payment, not link-buried (UX rule)
─────────────────────────────────────────────────
Sticky bottom bar (mobile only): price-from  ·  [ Book Passes ]   ← always in thumb zone
```

`<NightCard>` visual reuses the ref #9 "artist pass" plate language: a colour-duotone photo, night number as a large numeral top-left, theme name bottom, dress-code as a small pill — this is the one place a festive "collectible card" feel is deliberate, because it is marketing, not a transaction.

### 1.3 Pass selector — `/e/[eventSlug]/book` (the conversion surface)

Four steps, one screen, no route change per step (state, not navigation — protects the 4-tap budget):

```
Step 1 — Zone           <ZoneMap> abstract venue diagram (ref #2 pattern, no seats —
                         coloured regions only: VIP / Gold / General), tap a region
                         or its card; both are always in sync.
Step 2 — Pass type       Cards grouped Season / Weekend / Daily / Single-night.
                         Each: name, "Admits 2", nights covered, price, availability pill.
Step 3 — Quantity        Stepper, respects min/max, "{n} left" only when genuinely low.
Step 4 — Add-ons         Parking / F&B wallet / Merch — never pre-checked.

<PriceBreakdown>          Persistent panel, right rail on desktop / bottom sheet on
                          mobile, expanded from the moment step 1 completes.
Sticky footer             Total · [ Continue to Pay ]
```

`<ZoneMap>` is an SVG floor-plan-style abstraction (not a photograph), coloured per `--zone-*` tokens, with a subtle glow (ref #10) on the selected region. It exists to make an invisible decision (which zone) visible in one glance — the same job the seat-map reference does, without pretending Garba has assigned seats.

### 1.4 Checkout & result — `/checkout/[orderId]`, `/checkout/[orderId]/status`

- Single column, max-width 480px, centered — this is the one place the site narrows deliberately, to remove all distraction from payment
- Phone entry → OTP → (first time) name — inline, no route change, progress shown as 3 dots not a stepper bar
- Razorpay opens as their standard checkout (UPI Intent first on mobile) — ManharEvent does not skin Razorpay's own screen
- Result page: **QR renders immediately**, full-bleed `<PassCard>` — do not show a spinner waiting for WhatsApp

**`<FeeBreakdown>` (new, 2026-09-12 pivot)** — appears in the order summary, always fully expanded, never collapsed behind an "other charges" line:

```
Pass (Gold · Season · Couple)                    ₹4,999
Add-ons (Parking)                                  ₹200
─────────────────────────────────────────────────
ManharEvent platform fee                           ₹49   ← ManharEvent's own, kept minimal
Payment gateway fee (Razorpay)                       ₹104  ← pass-through, not ManharEvent's to set
─────────────────────────────────────────────────
Total                                             ₹5,352
```

Rules: the two fee lines are always separate and always both visible before payment — never summed into one "convenience fee", never hidden behind a tooltip. Each has a one-line explainer available on tap ("ManharEvent's fee for running your event platform" / "Razorpay's fee for processing this payment — set by Razorpay, not ManharEvent"). This is the same template as Surface 0's `/pricing` (§0.2), reused verbatim so an organizer who registered because of that pricing page sees it kept true at checkout.

### 1.5 `<PassCard>` — redesigned from reference #9

The most emotionally important screen in the product — this is the thing someone screenshots and shows a friend.

```
┌───────────────────────────────┐
│  MANHAREVENT            Night 5 │  ← wordmark + night badge, top corners
│  ┌───────────────────────┐    │
│  │                       │    │  ← duotone event/venue photo panel,
│  │    (duotone photo)    │    │     tinted with the organizer's --primary
│  │                       │    │     (white-label point of injection)
│  └───────────────────────┘    │
│  RINA & KAUSHIK                │  ← holder name(s), bold, 1.5rem
│  Gold Zone · Admits 2          │  ← zone badge (zone colour) + admits
│  Sat 26 Sep – Sun 4 Oct         │  ← nights covered
│  ┌───────────────────────┐    │
│  │      [ QR CODE ]      │    │  ← renders offline, no re-fetch
│  └───────────────────────┘    │
│  PASS-7F3K-9021        [Copy] │  ← mono, tabular, one-tap copy
└───────────────────────────────┘
```

States: valid (as above), used-tonight (desaturated + "Checked in 8:14 PM" strip), refunded (diagonal "REFUNDED" watermark, QR disabled), transferred-away (shown greyed in the old holder's account only, with a note).

### 1.6 My account (`/me/*`)

Bottom tab bar on mobile (Explore · My Passes · Wallet · Account — ref #1's nav rhythm, capped at 4 per UX budget). Desktop: same four as a top-right menu, no sidebar needed — this surface is too shallow to earn one.

---

## 2. Admin panel (`admin.<domain>`)

Sidebar shell (ref #5's clean white-sidebar structure, reskinned dark): logo + event switcher pinned top, ≤ 8 top-level items, ≤ 2 nesting levels, collapsible to icon-only on tablet width.

### 2.1 Live Overview — `/dashboard`

Layout lifted from reference #4 (stat row → chart + activity feed → list), recoloured to the locked palette:

```
┌─ Sidebar ──┬────────────────────────────────────────────┐
│ ManharEvent│  Live Overview          [Event: Navratri▾] │
│ ▸ Overview  │  ┌────────┐┌────────┐┌────────┐┌────────┐ │
│ ▸ Events    │  │Tickets ││Revenue ││Inside  ││Tonight │ │  ← <StatTile>×4, ≤3 "primary"
│ ▸ Finance   │  │Sold    ││        ││ Now    ││ Gate Q │ │     per UX complexity budget;
│ ▸ Team      │  └────────┘└────────┘└────────┘└────────┘ │     4th is secondary/muted
│ ▸ Vendors   │  ┌───────────────────────┐┌──────────────┐│
│ ▸ Settings  │  │  Sales over time      ││ Live check-in││
│             │  │  <SalesChart>         ││ feed         ││
│             │  └───────────────────────┘└──────────────┘│
│             │  ┌───────────────────────┐┌──────────────┐│
│             │  │ <LiveOccupancyMeter>  ││ Top-selling  ││
│             │  │ per zone, realtime    ││ pass types   ││
│             │  └───────────────────────┘└──────────────┘│
└─────────────┴────────────────────────────────────────────┘
```

Stale-data honesty (UX rule 9): every realtime tile carries a small "updated Ns ago" caption; if the realtime channel drops, the tile shows its last value with a muted "stale" badge — never a spinner standing in for a number.

### 2.2 Finance — `/dashboard/finance`

Reference #5's pairing of summary cards + donut (revenue split) + a real paginated table (never infinite scroll, per UX anti-patterns) for orders/settlements/refund queue. `<DataTable>` from the shared component set, URL-synced filters so a finance person can bookmark or share a filtered view.

### 2.3 Event setup (wizard, venue, passes, promos, policy)

Left-to-right stepper capped at 5 steps (UX budget). Each advanced field (price tiers, re-entry policy, GST) collapsed behind an "Advanced" disclosure with a working default already filled in — this is the literal implementation of UX rule 1, and it is the main way the dashboard avoids looking like the audited TICMint admin (dense forms with no defaults).

### 2.4 Team, vendors, settings/branding

`<RoleGate>`-driven visibility. Branding screen is where `tenant_branding.primary_color` / `accent_color` are set with a live contrast-checked preview of the public site and the `<PassCard>` — the organizer sees their white-label result before publishing, not after.

**Team → Gate Staff (new note, 2026-09-12 pivot):** this screen is the *only* place gate-scanner access (Surface 3) is created. Add staff → generate credentials + bind to a device on first login → assign gate/zone → revoke any time. There is no separate scanner sign-up screen anywhere in the product; `/scan/login` (§3) only ever authenticates a credential that was issued here.

---

## 3. Gate scanner PWA (issued only from the admin panel's Team → Gate Staff screen — §2.4)

One screen. The neon reference (#6) validates the already-locked `<ScanResult>` spec in `design-system.md §6` almost exactly — full-bleed colour, huge verdict, ticket/holder detail beneath it. No changes to that spec; this section adds the surrounding chrome that reference didn't need to show:

```
┌────────────────────────────────┐
│ ● Online · Manifest v482 · 2m  │  ← <SyncStatusBar>, always visible, tiny
├────────────────────────────────┤
│                                 │
│                                 │
│         [ CAMERA VIEWPORT ]    │  ← full-bleed when idle
│                                 │
│                                 │
├────────────────────────────────┤
│  [Torch]   Entry ⇄ Exit   [123]│  ← mode toggle + manual-entry shortcut
└────────────────────────────────┘

        ↓ on scan ↓

┌────────────────────────────────┐
│                                 │
│         ✓  (96px)              │
│      RINA & KAUSHIK             │  ← full-bleed --success, zero animation
│    GOLD · 2 of 2 · Night 5      │
│                                 │
└────────────────────────────────┘
```

Settings (gate/zone assignment, staff logout, onboarding replay) live behind a long-press on the sync bar — deliberately hidden, per the "1 screen, nav is a failure" rule. No hardware dependency anywhere on this surface: camera access is the *only* device capability used, because there is no printer, no card reader, no dedicated scanner gun. If a phone's camera is broken, the fallback is the on-screen manual code keypad — still 100% software.

---

## 4. Cross-surface visual language confirmed by the references

- **Cards, not tables, wherever a human decides; tables, not cards, wherever a human audits.** (References #4/#9 vs. #5's transaction table — both patterns are correct, applied to different jobs.)
- **Full-bleed colour is reserved for verdicts, not decoration.** Only `<ScanResult>` and payment success/failure use a screen-filling colour. Everywhere else, colour lives on small surfaces (badges, tiles, borders).
- **Glow (`--shadow-glow`) marks "this is the primary action or the featured thing"** — used sparingly (hero CTA, featured EventCard on hover, selected zone on `<ZoneMap>`), never on more than one element per screen, so it keeps meaning.
- **No carousels, anywhere**, on any surface, per the existing anti-pattern list — every reference that used one (several of the ten did) had that pattern explicitly rejected in favour of a scrollable grid or a horizontal card row with visible peek.
- **Everything above is a responsive web layout, not a native app.** Even the "app-like" bottom-tab patterns in references #1 and #10 are implemented as a responsive PWA shell — a phone browser, or the same PWA "installed" to a home screen. There is no App Store / Play Store listing in v1, and no screen in this document should be built assuming one.

---

## 5. What this document deliberately does not cover

- Exact SVG/asset production (icons, illustrations) — produced during the phases in `06-frontend-build/`, following this spec.
- Copy — final microcopy in three languages lives in `packages/i18n`, following `ux-principles.md §content-and-tone` and `design-system.md §8`.
- Anything already fully specified in `design-system.md` (tokens, motion, `<ScanResult>` states, accessibility acceptance criteria) — this file adds screen composition on top of that, it does not repeat it.

*Source materials: 10 reference screenshots (event ticketing apps, organizer dashboards, gate-scanner UI, festival marketing sites, digital ticket pass design) reviewed against `02-product/product-spec.md`, `02-product/user-flows.md`, and the locked `04-design/design-system.md`.*
