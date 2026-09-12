# 04 · User Flows & Information Architecture

> **🔁 Pivot (2026-09-12) — read `02-product/product-spec.md`'s pivot note first.** ManharEvent is B2B SaaS: one organizer, one tenant, their own event website — not a cross-organizer marketplace. Anywhere below that still shows `/[city]` or other cross-tenant browsing is **superseded**, kept with a note rather than deleted. A new Surface 0 (marketing + registration) and a new F0 flow (organizer registration → approval → provisioning) are added below to reflect the actual entry point into the platform now.

---

## 0. Route map — Surface 0 (new): ManharEvent marketing + registration

```
/                                   ManharEvent landing — what it is, why switch, pricing framing
/pricing                            Platform fee vs. gateway fee explained, side-by-side vs. status quo
/register                           Organizer registration — org details form
/register/verify                    Phone entry → OTP
/register/status                    "Submitted · Under review · Approved / Rejected" status screen
/register/provisioned               Success screen: domain, admin panel link, next steps

/legal/terms  /legal/privacy        ManharEvent's own (company-level, distinct from an organizer's own legal pages)
```

This is the true front door now — an organizer arrives here, not at any per-event public site, and Surfaces 1–3 below don't exist for them until they're approved and provisioned here.

---

## 1. Route map

### Surface 1 — Organizer's own event website (SSR/ISR, indexable)

> **Superseded (2026-09-12):** `/` and `/[city]` below described a ManharEvent-wide home with a city picker across all organizers. That's gone — each organizer's site *is* their home page, scoped to that one organizer/event. Struck through, kept for history.

```
~~/                                   Home — city picker, featured events~~
/                                   Home — this organizer's event(s) directly, no city picker, no cross-organizer listing
~~/[city]                             City listing            (ISR)~~
/e/[eventSlug]                      Event landing           (ISR, 60s)
/e/[eventSlug]/lineup               Artists, night-by-night (ISR)
/e/[eventSlug]/night/[n]            Single-night page       (ISR, SEO)
/e/[eventSlug]/venue                Venue, map, how to reach(ISR)
/e/[eventSlug]/gallery              Photo gallery           (ISR)
/e/[eventSlug]/faq                  FAQ                     (ISR)
/e/[eventSlug]/book                 Pass selector           (dynamic)
/checkout/[orderId]                 Checkout                (dynamic, no-index)
/checkout/[orderId]/status          Payment result          (dynamic, no-index)
/artist/[artistSlug]                Artist profile          (ISR)
/g/[groupInviteCode]                Group invite fill-in    (dynamic, no-index)

/me                                 My account
/me/passes                          My passes
/me/passes/[passId]                 Pass detail + QR
/me/orders                          Order history + invoices
/me/wallet                          F&B wallet
/me/refunds                         Refund requests

/auth/start                         Phone entry (single field)
/auth/verify                        OTP
/auth/profile                       First-time name capture

/legal/terms  /legal/privacy  /legal/refund-policy
/sitemap.xml  /robots.txt  /opensearch.xml
```

### Surface 2 — Organizer dashboard (auth-gated SPA)

```
/dashboard                          Live overview
/dashboard/events                   Event list
/dashboard/events/new               Create / clone wizard
/dashboard/events/[id]              Event overview
/dashboard/events/[id]/nights       Nights, themes, lineup
/dashboard/events/[id]/venue        Venue, zones, gates
/dashboard/events/[id]/passes       Pass types + price tiers
/dashboard/events/[id]/addons       Parking, F&B, merch
/dashboard/events/[id]/promos       Promo codes
/dashboard/events/[id]/policy       Refund + re-entry policy
/dashboard/events/[id]/publish      Pre-publish checklist
/dashboard/events/[id]/live         Live ops console
/dashboard/events/[id]/attendees    Attendee list + search
/dashboard/events/[id]/checkins     Check-in log
/dashboard/events/[id]/reports      Analytics
/dashboard/events/[id]/comps        Complimentary passes

/dashboard/finance                  Revenue, settlements
/dashboard/finance/orders           Order ledger
/dashboard/finance/refunds          Refund queue
/dashboard/finance/payouts          Payouts
/dashboard/finance/gst              GST reports + invoices

/dashboard/team                     Team + roles
/dashboard/team/gate-staff          Gate staff + device binding
/dashboard/vendors                  F&B / stall vendors
/dashboard/sponsors                 Sponsors

/dashboard/settings/branding        White-label
/dashboard/settings/domain          Custom domain
/dashboard/settings/payments        Razorpay, bank, GSTIN
/dashboard/settings/notifications   WhatsApp/SMS/email templates
/dashboard/settings/audit           Audit log
```

### Surface 3 — Gate scanner PWA

> **Note (2026-09-12 pivot):** nothing under `/scan` is reachable by anyone who wasn't first issued access from the admin panel's Team → Gate Staff screen (Surface 2). `/scan/login` authenticates staff *credentials already created there* — it is not a self-registration screen.

```
/scan                               Scanner (default)
/scan/login                         Staff login + device bind (credentials issued from admin panel only)
/scan/sync                          Manifest sync status
/scan/manual                        Manual code entry
/scan/exit                          Exit scan mode
/scan/vendor                        Vendor wallet-redemption mode
/scan/log                           This device's scan log
/scan/settings                      Gate + zone assignment
```

### Internal ops — Manhar platform team (not a numbered public surface)

> **Note (2026-09-12 pivot):** this was originally "Surface 4 — Superadmin", numbered alongside the attendee/organizer/gate surfaces. Per the pivot it's re-framed as an internal ops tool, not a fourth product surface — its most important job now is operating Surface 0's registration approval step (`/admin/tenants` is where an organizer registration submitted at `/register` gets reviewed and approved/rejected, triggering provisioning of Surfaces 1–3 for that tenant).

```
/admin                              Platform overview
/admin/tenants                      Organizer registrations — review, approve, reject, provisioning status
/admin/tenants/[id]                 Tenant detail, platform-fee config for that tenant
/admin/events                       All events across tenants (internal visibility only — never attendee-facing)
/admin/finance                      Platform revenue (platform fees collected — kept separate from gateway fees)
/admin/health                       System health, error rates, queues
/admin/support                      Pass lookup, manual interventions
/admin/flags                        Feature flags
```

---

## 2. Critical flows

### F0 — Organizer registers, gets approved, gets provisioned (new, 2026-09-12 pivot — the entry point into the whole platform)

```
ManharEvent landing (Surface 0, /)
  → "Register your event"
  → Phone number → OTP                    ← same identity pattern as attendee checkout
  → Org details form   [org name, contact person, city, rough scale, desired domain]
  → Submit → /register/status shows "Submitted · under review"

Manhar platform team (/admin/tenants)
  → Reviews submission
  → Approve (sets that tenant's platform fee) OR Reject/request-more-info (with a real reason)

On approval:
  → Automated provisioning: tenant created, domain pointed, admin panel access created
  → Organizer sees /register/provisioned → link to their new admin panel
  → Organizer logs into admin panel (Surface 2) → event wizard (F3) → builds their event website (Surface 1)
  → Organizer issues gate-staff scanner access from Team → Gate Staff whenever they're ready (Surface 3)

On rejection:
  → Organizer sees the reason on /register/status
  → Can resubmit
```

**Design rules for this flow:**
- Status must never be a black box — "submitted" alone with no next-step estimate is a failure state
- Approval is a human decision (P5); everything after approval is automated, not a second manual step
- The organizer should reach a *usable* admin panel + a *live* event website with as little additional friction as F3 already provides for year-2 setup

### F1 — Attendee buys a season couple pass (the money flow)

```
Event page
  → "Book Passes"
  → Zone select        [Gold / General / VIP]   live availability shown
  → Pass type select   [Season Couple ₹X]       price tier auto-applied
  → Quantity           [1 pass = 2 admits]
  → Add-ons            [Parking +₹Y] [F&B ₹500 wallet]
  → Promo code         (optional, validates inline)
  → Phone number       → OTP (6 digit)          ← this IS the signup
  → Name capture       (first time only)
  → Order summary      base + fees + GST clearly itemised
  → Razorpay           UPI Intent opens GPay/PhonePe directly on mobile
  → Success page       QR shown immediately, do not make them wait for WhatsApp
  → WhatsApp + SMS     pass delivered within 30s
  → Group invite       "Add your partner's details" link (optional)
```

**Design rules for this flow:**
- Maximum 4 taps from event page to Razorpay
- Never ask for email
- Never force account creation as a separate step — OTP *is* the account
- Price breakdown always visible, never revealed at the last step
- Back button must never lose the cart
- On payment failure: keep the order, offer retry, never make them re-select

### F2 — Gate entry (the throughput flow)

```
BEFORE GATES OPEN
  Staff opens /scan → login → device bound to gate + zone
  → Manifest sync: all valid passes for tonight downloaded (encrypted, local)
  → "Ready · 14,203 passes · offline OK"

AT THE GATE
  Scan QR
  → Local validation (no network)
     ├─ VALID           BIG GREEN + holder photo + "2 of 2 admits" + name
     ├─ ALREADY IN      AMBER + "Entered 8:14 PM at Gate 3"
     ├─ WRONG ZONE      RED  + "Gold pass · this is VIP gate"
     ├─ WRONG NIGHT     RED  + "Valid nights 1-5 · tonight is 7"
     ├─ REFUNDED        RED  + "Refunded 12 Oct"
     └─ BLOCKED         RED  + "Flagged · call supervisor"
  → Staff taps ALLOW or DENY
  → Written to local queue
  → Background sync when any connectivity appears

RE-ENTRY
  Exit scan → marks out
  Re-entry scan → allowed if policy permits, counted
```

**Design rules:**
- Result must be readable at arm's length in darkness
- One thumb, no scrolling, no confirmation dialogs on the happy path
- Never block on network. Ever.
- Ambiguity is failure — every state has exactly one colour and one instruction

### F3 — Organizer sets up next year's event

```
/dashboard/events/new
  → "Clone Manhar Navratri 2025?"     ← one click brings venue, zones, gates,
                                        pass types, policies, templates
  → Update dates (9 nights auto-generated from start date)
  → Update lineup per night
  → Review pricing (last year's shown alongside)
  → Pre-publish checklist:
       ✓ Payment account verified
       ✓ GSTIN present
       ✓ Refund policy set
       ✓ At least one pass type on sale
       ✓ Venue + zones + gates configured
       ✓ Terms accepted
  → Publish → live in under 15 minutes
```

### F4 — Group booking (the differentiator flow)

```
Buyer purchases 1 pass with 6 admits
  → Gets 5 invite links
  → Shares on WhatsApp group
  → Each friend opens /g/[code]
      → enters name + phone + selfie
      → gets their own QR bound to their name
  → Buyer sees fill-in progress
  → Unfilled admits still work as generic admits at the gate
```

This removes the single most painful part of group buying, and it collects
5 extra phone numbers per group for the organizer's remarketing.

### F5 — Refund

```
Attendee: /me/passes/[id] → Request refund
  → Policy engine computes refundable amount by time tier
  → Shows exact amount before confirming
  → Submitted
Organizer: /dashboard/finance/refunds
  → Approve / reject with reason
  → Razorpay refund initiated
  → Pass invalidated immediately in the gate manifest
  → Inventory returned to the pool
  → Attendee notified on WhatsApp
  → Audit trail written
```

### F6 — F&B wallet

```
Attendee tops up wallet (at checkout or in-app)
Vendor opens /scan/vendor → enters amount → scans attendee QR
  → Balance checked locally against synced manifest
  → Deducted, receipt shown to both
  → Queued for sync
Attendee sees balance + txn history
Vendor sees day's sales; settlement handled in finance module
```

---

## 3. Navigation principles

| Surface | Primary nav | Rule |
|---|---|---|
| 0 · Marketing/registration | Simple top nav: Pricing · Register · Log in (to status) | Marketing-site conventions, not app conventions — this is a sales page first |
| 1 · Organizer's event site | Bottom tab bar on mobile: Event · My Passes · Wallet · Account | Never more than 4. **No "Explore" tab** — there is nothing cross-organizer to explore |
| 2 · Admin panel | Left sidebar, 2 levels max, collapsible | Event context is a switcher at the top, not a breadcrumb maze |
| 3 · Scanner | No nav. One screen. Settings behind a long-press. | Any nav is a failure of design |

---

## 4. State that must survive a refresh

- Cart / pass selection (localStorage + server-side draft order)
- Checkout progress
- Scanner queue and manifest (IndexedDB, encrypted)
- Dashboard filters (URL query params — always shareable)
- Language preference (cookie, SSR-aware)
