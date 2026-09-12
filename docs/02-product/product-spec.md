# 03 · Product Specification — ManharEvent

> **Codename:** `manhar-garba`
> **One-line:** A Garba-native, multi-tenant ticketing and event-operations platform — advanced enough for a 25,000-person ground, simple enough for an aunty buying a couple pass on a 4-year-old Android.

> **🔁 Pivot (2026-09-12) — read this before the rest of the doc.** ManharEvent is **not** a consumer-facing marketplace where attendees browse events across organizers by city (like BookMyShow/Insider). It is a **B2B SaaS sold directly to organizers**, one at a time, through direct outreach/marketing. An organizer is convinced (offline, by the Manhar sales conversation) → registers on ManharEvent's own site → is approved → is provisioned with **their own three platforms** (own event website, own admin panel, and gate-scanner access issued from that admin panel). There is no page anywhere that lists events from multiple organizers side by side. Every mention of "city discovery", "`/[city]`", or cross-tenant browsing later in this document (and in `user-flows.md`, `04-design/manharevents-screen-specs.md`) is **superseded** by this pivot — kept in place with a note rather than deleted, so the reasoning that led here isn't lost. See the decision log in `PROGRESS.md` for the full reasoning, and `04-design/manharevents-screen-specs.md §0` for the new Surface 0 (marketing + registration) this pivot adds.
>
> **Why this is a better business than a marketplace, for this specific product:** Navratri is once a year. A consumer marketplace needs constant year-round traffic to justify the engineering cost of city discovery, search ranking, cross-organizer merchandising, and so on — none of which matters if every organizer's audience already knows and follows *that organizer specifically* (their own WhatsApp groups, their own Instagram, their own loyal crowd from last year). ManharEvent's actual edge over BookMyShow/Insider isn't discovery — it's **giving each organizer their own better-than-BookMyShow platform, on their own domain, for less money per ticket**, without them needing to build or maintain any of it.

---

## 1. Product thesis

Generic event platforms (TICMint, BookMyShow, Insider) treat Navratri as "an event with a date". It isn't. It is:

- **Nine consecutive nights**, same venue, largely the same crowd returning.
- **Season-pass-first economics** — the big money is sold before night one.
- **Zone-based, standing, high-density** — not seat maps.
- **Re-entry heavy** — people leave for food/car and come back.
- **Operationally brutal** — 20,000 people arriving in a 90-minute window, through 6 gates, on a ground with no usable mobile data.
- **Culturally specific** — themes, dress codes, artists, aartis, dandiya vs raas, food stalls.

A vertical product that models all of this natively will beat a horizontal one on every metric that matters: conversion, gate throughput, organizer trust, and per-attendee revenue.

---

## 2. The four surfaces (post-pivot)

> Superseded framing kept below in §2a for history. This is the current model.

ManharEvent is **B2B SaaS**: Manhar Creatives sells directly to organizers, one at a time. An organizer is convinced through direct outreach, registers on ManharEvent's own site, gets approved, and is then provisioned with their own event website, their own admin panel, and gate-scanner access issued from that admin panel. Nothing here is shared or browsable across organizers.

| # | Surface | Who | Device reality | Rendering |
|---|---|---|---|---|
| **0** | **ManharEvent marketing + registration** `manharevent.com` (or similar apex) | Prospective organizers, general public curious about ManharEvent itself | Mixed, mobile-heavy | SSR marketing pages + phone/OTP registration flow |
| **1** | **Organizer's own event website** `<organizer-domain>` (their own domain, not a ManharEvent subdomain) | That organizer's attendees only | Budget Android, 4G, one-handed, often Gujarati-first | SSR + ISR, aggressively optimised |
| **2** | **Admin panel** `admin.<domain>` (or organizer-scoped path) | That organizer's owner, finance, managers | Desktop + tablet, decent connection | Client-heavy SPA behind auth |
| **3** | **Gate scanner** (access issued only from Surface 2) | Gate staff, vendors of that organizer | Cheap Android, **no internet**, one hand, dark, loud | Offline-first PWA |

Key rules that follow from this:

- **One organizer, one tenant, one set of platforms.** An attendee only ever sees the one organizer's event website. There is no page anywhere — not on ManharEvent's own marketing site, not anywhere else — that lists events from multiple organizers side by side.
- **Surface 3 has no independent public entry point.** Gate staff never sign up or log in on their own; the organizer's admin panel (Surface 2) issues scanner access (device binding + credentials) to specific staff. If it isn't issued from the admin panel, it doesn't exist.
- **Each organizer gets their own domain.** ManharEvent provisions and points it; the underlying app is the same shared codebase, tenant-scoped.
- **One shared database, many tenants**, enforced by row-level security — see `03-architecture/security-and-tenancy.md` (unchanged by this pivot).
- **Fees are always shown as two separate line items:** ManharEvent's own platform fee (kept minimal — lower than BookMyShow/Insider/other platforms) and the payment gateway's (Razorpay/Stripe) own per-transaction charge, which is a pass-through ManharEvent does not control and cannot absorb. Never merged into one "convenience fee" number — see the new feature bullet in §5.1 and the `<FeeBreakdown>` component in `manharevents-screen-specs.md`.

### 2a. Superseded — original three-plus-two-surface marketplace model

*(Kept for history per the pivot note at the top of this document. Do not build against this.)*

| # | Surface | Who | Device reality | Rendering |
|---|---|---|---|---|
| 1 | ~~**Public site** `garba.<domain>`~~ | Attendees | Budget Android, 4G, one-handed, often Gujarati-first | SSR + ISR, aggressively optimised |
| 2 | ~~**Organizer dashboard** `dashboard.<domain>`~~ | Organizers, finance, managers | Desktop + tablet, decent connection | Client-heavy SPA behind auth |
| 3 | ~~**Gate scanner** `scan.<domain>`~~ | Gate staff, vendors | Cheap Android, **no internet**, one hand, dark, loud | Offline-first PWA |

Plus two smaller surfaces added later:

| 4 | ~~**Superadmin console** `admin.<domain>`~~ | Manhar platform team | Desktop | SPA |
| 5 | ~~**Partner portals** (sponsor / vendor / artist)~~ | External partners | Mixed | Scoped SPA views |

The reason this doesn't work: it assumes attendees discover events *through ManharEvent* (city/date browsing, cross-organizer search). In reality each organizer brings their own audience — the discovery problem this model solves doesn't exist for this business. A superadmin console for the Manhar platform team may still be worth having operationally (support, tenant approval, billing) but it is an **internal ops tool**, not a numbered public-facing surface — folded into how Surface 0's approval step is operated, not modelled as its own product surface for v1.

---

## 3. Personas

### P1 — Rina, 26, attendee
Buys a couple pass for all 9 nights with her husband. Wants: fast checkout via UPI, pass on WhatsApp, no app download, shows QR at gate, finds her photos next morning. **Fails if:** the site is slow, the pass is only on email, or the QR won't open without internet.

### P2 — Jignesh, 44, organizer owner
Runs a 15,000-capacity ground. Wants: live sales numbers, cash position, how many people are inside right now, and no gate queue. **Fails if:** he cannot answer "how many people are inside zone Gold right now" instantly.

### P3 — Kalpesh, 22, gate staff
Six-hour shift, cheap phone, no data, crowd shouting. Wants: scan, green tick, next. **Fails if:** the scanner needs internet, takes more than 1 second, or shows anything ambiguous.

### P4 — Meena, 38, finance
Wants: reconciled revenue, GST invoices, settlement to bank, refunds handled with an audit trail. **Fails if:** numbers don't tie out.

### P5 — Manhar platform team (internal ops, not a public surface)
Wants: review and approve/reject a new organizer's registration in minutes, set that organizer's platform fee, hand over their domain + admin panel + scanner access, monitor platform health across tenants, never touch production DB manually. **This persona now starts at Surface 0's registration step** (see §2) — they are the human in the loop between an organizer submitting registration and that organizer being provisioned with their three platforms. **Fails if:** approval is slow enough that a convinced organizer cools off, or if provisioning a new tenant requires manual engineering work instead of a repeatable approval action.

### P6 — Rohit, 31, food stall vendor
Wants: accept the same QR as payment, see his day's sales, get paid. **Fails if:** he has to reconcile cash.

### P0 — Sales-convinced organizer, mid-registration
The organizer from P2 (Jignesh), specifically at the moment *after* a Manhar Creatives sales conversation has convinced him and *before* he has any platform access. Wants: a fast, trustworthy registration on ManharEvent's own site (phone + OTP, basic org details), a clear sense of what happens next and how long approval takes, and — once approved — his own domain, admin panel, and event website ready with minimal setup friction. **Fails if:** registration feels like a generic lead form, approval is a black box with no status visibility, or "your own platform" turns out to still look like a shared marketplace listing.

---

## 4. Core domain model (plain English)

```
Tenant (Organizer)
 └── Event                    e.g. "Manhar Navratri 2026"
      ├── EventNight  × 9     each with date, theme, artist lineup, dress code
      ├── Venue
      │    └── Zone × N       VIP / Gold / General / Sponsor — each with capacity
      │         └── Gate × N  physical entry points mapped to zones
      ├── PassType × N        Season / Weekend / Daily / Single Night / Couple / Family / Group
      │    ├── admits         how many people this pass lets in (1, 2, 4, 6...)
      │    ├── nights         which nights it covers
      │    ├── zone           which zone it grants
      │    └── PriceTier × N  early bird → regular → last minute
      ├── AddOn × N           Parking / F&B wallet top-up / Merchandise
      └── PromoCode × N

Order → Payment → Pass × N → PassHolder × N → CheckIn × N
                                            └── WalletTxn × N (F&B)
```

**The critical modelling decision:** a *Pass* is not a *ticket for one person on one night*. A Pass is a **grant**: `N admits × M nights × 1 zone`. A season couple pass is `admits=2, nights=[1..9], zone=Gold`. Every scan creates a `CheckIn` row against that pass. This single abstraction covers every SKU Garba organizers actually sell.

---

## 5. Feature catalogue

### 5.0 ManharEvent marketing + registration (Surface 0 — new)

**Marketing / company site**
- Landing page for ManharEvent itself: what it is, why an organizer would switch, pricing framed around "your own platform, lower fees, no city-listing noise"
- Case studies / testimonials once available (real organizers, not placeholder logos)
- Iconic, traditional-but-modern visual identity (see `manharevents-screen-specs.md §0` for the image-generation direction via ChatGPT Desktop — done separately, last, by the user)

**Organizer registration**
- Phone number + OTP registration (no password) — same OTP identity pattern as attendee checkout, reused for consistency
- Organization details form: org name, contact person, city, expected scale (ground size / rough capacity), desired domain
- Clear "what happens next" status screen (submitted → under review → approved/rejected → provisioned) — an organizer should never wonder what state they're in
- On approval: automated provisioning trigger (domain pointing, tenant creation, initial admin panel access) — the manual part is the approval *decision* (P5), not the setup work that follows it
- On rejection or "more info needed": a clear, non-generic reason and a way to respond

### 5.1 Organizer's own event website (Surface 1)

> **Superseded (2026-09-12):** this surface no longer includes any cross-organizer discovery. The "Discovery" section below described city/date/artist search across all organizers on ManharEvent — that assumed attendees find events *through* ManharEvent. They don't; each organizer brings their own audience. Kept below, struck through, for history — do not build against it. What replaces it: each organizer's site is simply a very good single-event (or single-organizer, multi-event) site, with strong on-page SEO for *that event* rather than a ManharEvent-wide search surface.

~~**Discovery**~~
- ~~City/date/artist search, SSR-rendered, indexable~~
- Event landing page with lineup, venue, gallery, FAQs, map *(kept — this is per-organizer, not cross-organizer)*
- Per-night pages (SEO: "Ahmedabad Garba 5th night 2026") *(kept — SEO for that organizer's own event, not a ManharEvent-wide index)*
- ~~Artist pages with follow~~ *(only relevant if it doesn't imply a cross-organizer artist index — revisit if needed)*
- Schema.org `Event` + `Offer` markup for Google rich results *(kept — helps that organizer's own event rank, not a ManharEvent discovery page)*

**Buying**
- Pass selector: zone → pass type → nights → quantity, with live availability
- Add-ons: parking, F&B wallet, merchandise
- Promo code entry with instant validation
- Guest checkout (phone + OTP only — no forced signup)
- Razorpay: UPI Intent, UPI Collect, cards, netbanking, wallets
- **Fee transparency (new, 2026-09-12 pivot):** every price breakdown always shows the base pass price, ManharEvent's own platform fee (kept minimal/competitive — separate line, never bundled), and the payment gateway's own transaction charge (pass-through, unavoidable, separate line) — never a single opaque "convenience fee". See `<FeeBreakdown>` in `manharevents-screen-specs.md`.
- GST-compliant invoice generated automatically
- Waitlist when sold out
- Virtual waiting room for high-demand on-sales

**Post-purchase**
- Pass delivered on WhatsApp + SMS + email + in-account
- Downloadable PDF pass + Apple/Google Wallet pass
- Group invite links — buyer sends links, each friend fills their own name/photo
- "My Passes" — view, re-download, transfer, request refund
- Night-by-night reminders on WhatsApp
- Post-event recap card

**Localisation & access**
- Gujarati / Hindi / English, full UI + content
- WCAG 2.1 AA
- Works on 4G, < 200 KB critical JS on the buy path

### 5.2 Admin panel (Surface 2)

> **Note (2026-09-12 pivot):** this is where Surface 3 (gate scanner) access is issued — see "People" below. There is no separate scanner sign-up anywhere; gate staff accounts and device binding are created and revoked entirely from here.

**Setup**
- Event wizard (clone last year in one click)
- Venue + zone + gate configuration with capacity
- Night-wise lineup, theme, dress code
- Pass type builder with price tiers and time-based auto-switching
- Refund policy builder
- Promo code manager with attribution
- Branding: logo, colours, domain, favicon (white-label)

**Live operations**
- Realtime dashboard: sales, revenue, footfall, occupancy per zone
- Live gate throughput and queue estimation
- Capacity threshold alerts
- Manual check-in override + guest list
- Broadcast announcements (staff + venue ticker)
- Complimentary pass issuance with approval trail

**Money**
- Sales by pass type, night, zone, channel, promo code
- Settlement ledger, payout schedule, TDS
- GST reports
- Refund queue with approval workflow
- Convenience fee / commission configuration

**People**
- Team members with granular roles
- **Gate staff accounts with device binding — this is the only way scanner access (Surface 3) is ever granted.** Issue, revoke, and see which device is bound to which staff member, all from here.
- Vendor accounts
- Sponsor accounts with their own scoped dashboard

### 5.3 Gate scanner (Surface 3)

> Access to this surface is never self-serve — see the "People" note in §5.2. Everything below describes what the scanner does once a staff member has been issued access.

- **Fully offline.** Full pass manifest synced to device before gates open.
- Camera QR scan, < 500 ms decision, huge green/red result
- Handles: valid, already-used-tonight, wrong zone, wrong night, refunded, blocked
- Re-entry: exit scan then re-entry scan, configurable policy
- Photo verification: shows the holder photo for staff to eyeball
- Multi-admit passes: "2 of 4 entered" counter
- Manual code entry fallback when a QR won't scan
- Background sync with conflict resolution when connectivity returns
- Per-device audit log
- Vendor mode: same app, scans the QR as a wallet payment

---

## 6. Non-functional requirements

| Area | Target |
|---|---|
| Public page LCP (4G, mid-range Android) | < 2.5 s |
| Critical JS on the buy path | < 200 KB gzipped |
| Checkout completion (payment initiated → pass delivered) | < 10 s p95 |
| Scanner decision latency (offline) | < 500 ms p99 |
| Gate throughput per scanner | ≥ 12 scans/minute sustained |
| Concurrent checkout capacity | 5,000 concurrent at on-sale |
| Realtime dashboard lag | < 3 s |
| Uptime during event nights | 99.9% |
| Accessibility | WCAG 2.1 AA |
| Data residency | India region |

---

## 7. Success metrics

| Metric | Target for first season |
|---|---|
| Checkout conversion (pass page → paid) | > 35% |
| WhatsApp pass delivery rate | > 98% |
| Gate scan success on first attempt | > 97% |
| Average gate wait | < 4 minutes |
| Support tickets per 1,000 passes | < 8 |
| Organizer onboarding time | < 30 minutes |
| Payment success rate | > 92% |

---

## 8. Guiding product principle

> **"Advanced underneath, obvious on top."**
>
> Every advanced capability — zones, tiers, re-entry policies, wallets, settlements — must have a default that a first-time organizer never has to touch, and a UI that a 55-year-old attendee can complete in under 90 seconds with one thumb.
>
> Complexity is allowed to exist. It is not allowed to be *visible* until someone asks for it.

See `04-design/ux-principles.md` for how this is enforced concretely.
