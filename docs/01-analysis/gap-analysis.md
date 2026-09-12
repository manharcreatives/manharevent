# 02 · Gap Analysis — Where TICMint Ends and Manhar Begins

> Purpose: enumerate everything the scraped platform **does not do**, and decide which of those gaps we close.
> This document is the source of the feature catalogue and the phase plan.

---

## A. Gaps that are missing *pages/surfaces* entirely

| # | Gap | Evidence | Our decision |
|---|---|---|---|
| A1 | **No public ticket-buying website** | The scraped domain is `dashboard-*`. Every route redirects to signin. There is no attendee-facing surface here at all. | **Build it. This is Surface 1 and the revenue engine.** |
| A2 | **No gate / check-in application** | No scanner route, no offline capability, no PWA manifest found | **Build it. Surface 3. Offline-first.** |
| A3 | **No public event discovery / search** | No SSR, no sitemap, no index pages | **Build it. SSR + ISR + full SEO.** |
| A4 | **No attendee account area** | Only organizer-side org selection exists | **Build it — "My Passes", group management, re-download.** |
| A5 | **No superadmin / platform console** | Multi-org exists, but no platform-owner surface visible | **Build it. Tenant approval, commission config, platform-wide reporting.** |

---

## B. Gaps in Garba / Navratri domain fit

TICMint models a **single event on a single day**. Navratri is a **9-night season with the same crowd returning nightly**. Everything below flows from that mismatch.

| # | Gap | Why it matters in Gujarat | Our decision |
|---|---|---|---|
| B1 | **No season pass concept** | The dominant product is a 9-night pass, not a single ticket | ✅ Build: season / weekend / daily / single-night, all inventory-linked |
| B2 | **No night-wise attendance on a season pass** | Organizers need to know who came which night; sponsors pay for it | ✅ Build: one pass, N check-in records |
| B3 | **No zone-based entry** | VIP / Gold / General / Sponsor Lounge / Media are physically separate at Garba grounds | ✅ Build: zones with independent capacity + gate mapping |
| B4 | **No re-entry / exit-and-return handling** | People leave for food and return; a one-scan-only QR causes gate riots | ✅ Build: in/out scan pairs, configurable re-entry policy |
| B5 | **No anti-passback / pass sharing prevention** | Pass resale and QR screenshot-sharing is rampant | ✅ Build: photo-on-pass, device binding, duplicate-scan lockout, anomaly flags |
| B6 | **No couple / family / group pass semantics** | Couple pass is the single best-selling SKU at Garba | ✅ Build: pass = 1..N admits, per-admit tracking, named holders |
| B7 | **No dress-code / theme-night model** | Every night has a theme; it drives attendance and content | ✅ Build: per-night theme, colour, artist lineup |
| B8 | **No artist / lineup management** | The artist is the reason people buy | ✅ Build: artist profiles, per-night lineup, public display |
| B9 | **No food & beverage cashless wallet** | Cash at food stalls is slow and leaks money | ✅ Build: same QR doubles as a prepaid wallet; vendor terminal |
| B10 | **No parking pass** | Parking is a genuine revenue line and a genuine pain | ✅ Build: parking as an add-on SKU with its own zone/capacity |
| B11 | **No live crowd / capacity meter** | Safety and licensing requirement at scale | ✅ Build: realtime occupancy per zone, threshold alerts |
| B12 | **No Gujarati / Hindi language support** | A large share of buyers cannot comfortably read English | ✅ Build: full i18n — Gujarati, Hindi, English |
| B13 | **No WhatsApp delivery** | In India, email open rates for tickets are poor; WhatsApp is universal | ✅ Build: WhatsApp as the primary pass delivery + reminder channel |
| B14 | **No offline gate operation** | Garba grounds have terrible connectivity by 8 PM | ✅ Build: scanner works fully offline, syncs later, conflict resolution |
| B15 | **No emergency / lost-person announcement** | Real operational need at 20,000-person venues | ✅ Build: broadcast to on-ground staff + ticker on screens |

---

## C. Gaps in commerce & money

| # | Gap | Our decision |
|---|---|---|
| C1 | No visible payment integration | ✅ Razorpay — UPI, cards, netbanking, UPI Intent on mobile |
| C2 | No GST invoicing | ✅ Auto GST invoice per order, organizer GSTIN, HSN/SAC, downloadable |
| C3 | No convenience fee / platform commission engine | ✅ Configurable per tenant: flat, %, or hybrid; absorbed-vs-passed-on toggle |
| C4 | No settlement / payout ledger | ✅ Double-entry ledger, per-event settlement, payout schedule, TDS handling |
| C5 | No refund/cancellation policy engine | ✅ Policy per pass type, time-tiered refund %, partial refunds, audit trail |
| C6 | No dynamic / tiered pricing | ✅ Early bird → regular → last-minute, quantity tiers, time-based auto-switch |
| C7 | No promo / discount engine | ✅ Codes, auto-discounts, group discounts, influencer codes with attribution |
| C8 | No waitlist for sold-out | ✅ Waitlist + notify-on-release + timed release windows |
| C9 | No bulk / corporate booking | ✅ Quote request, bulk allocation, sub-distribution of passes to employees |
| C10 | No payment failure recovery | ✅ Abandoned-cart recovery, retry links, pending-payment reconciliation |

---

## D. Gaps in operations & trust

| # | Gap | Our decision |
|---|---|---|
| D1 | No role model beyond "team" | ✅ Roles: Superadmin, Organizer Owner, Manager, Finance, Gate Staff, Vendor, Artist, Support |
| D2 | No audit log | ✅ Append-only audit of every money and access action |
| D3 | No fraud detection | ✅ Velocity checks, duplicate-device orders, scan anomaly flags |
| D4 | No rate limiting / bot protection visible | ✅ Edge rate limits, Turnstile on checkout, queue for high-demand on-sales |
| D5 | No on-sale / high-traffic queue | ✅ Virtual waiting room for big drops |
| D6 | No accessibility guarantees | ✅ WCAG 2.1 AA as an acceptance criterion, not a nice-to-have |
| D7 | No support workflow | ✅ Ticket lookup by phone, resend pass, transfer pass, manual check-in override |

---

## E. Gaps that make the product *sticky* (differentiators)

These are what turn a ticketing tool into a platform people come back to.

| # | Feature | Why it wins |
|---|---|---|
| E1 | **Event photo gallery + "find my photos"** | Attendees upload/browse; face-match surfaces their own photos. Enormous re-engagement and organic sharing. |
| E2 | **Best-dressed / contest module** | Nightly voting, leaderboard, prizes — free daily engagement loop |
| E3 | **Group invite links** | Buy 6 passes, send 5 links, friends fill in their own details. Removes the worst part of group booking. |
| E4 | **Referral engine** | Attendee-level referral codes with wallet credit |
| E5 | **Sponsor dashboard** | Sponsors see impressions, scans, footfall by zone — justifies higher sponsorship rates |
| E6 | **Vendor/stall portal** | Food stalls see their own sales, settlements, and QR redemptions |
| E7 | **Live venue map** | Zones, stalls, exits, washrooms, first aid — on the phone |
| E8 | **Artist follow + notify** | Follow an artist, get notified when they're playing anywhere on the platform |
| E9 | **Post-event recap** | Auto-generated "your Navratri in numbers" — nights attended, steps, photos. Shareable. |
| E10 | **Organizer templates** | Clone last year's event structure in one click |

---

## F. What we deliberately do **not** build (scope discipline)

Recording these so scope creep is a decision, not an accident.

| Not building | Reason |
|---|---|
| Reserved seat maps | Garba is standing/floor-based. Zones are enough. Revisit only for concert-style events. |
| Native iOS/Android apps at launch | PWA covers scanner + attendee. Native is Phase 2+ if retention justifies it. |
| KaTeX / maths rendering | Dead weight — TICMint ships it by accident |
| Drag-and-drop dashboard widgets | v2 nicety; a well-designed fixed dashboard beats a customisable bad one |
| In-house payment processing | Razorpay handles compliance, PCI, settlement |
| Live video streaming | Different product, different infrastructure |
| Blockchain/NFT tickets | Solves no real problem here |

---

## G. Priority matrix

**Must-have for first Navratri (launch blocking):**
A1, A2, A3, A4, B1, B2, B3, B4, B6, B13, B14, C1, C2, C3, C5, C7, D1, D2, D4, D7

**High value, ship if time allows before launch:**
B5, B7, B8, B9, B11, B12, C4, C6, C8, D3, D5, E3

**Post-launch, before next season:**
A5, B10, B15, C9, C10, D6, E1, E2, E4, E5, E6, E7, E8, E9, E10

The phase plan in `05-execution/` is ordered to deliver the launch-blocking set first, with each later phase additive and independently shippable.
