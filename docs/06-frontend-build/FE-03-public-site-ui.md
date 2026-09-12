# FE-03 — Public Site UI (Surface 1, mock data)

| | |
|---|---|
| **Phase ID** | `FE-03` |
| **Depends on** | `FE-01`, `FE-02` |
| **Blocks** | `FE-06` |
| **Reference docs** | `05-execution/phase-08-public-site.md`, `04-design/manharevents-screen-specs.md §1`, `02-product/user-flows.md §1` |

---

## Goal

Every attendee-facing screen, fully built and interactive, reading from `packages/mock-data` instead of Supabase, with a **mocked** payment step instead of real Razorpay. Someone should be able to click through the entire journey — browse → event → pick a pass → "pay" → see a QR — end to end, on a phone-width browser, and it should feel finished.

---

## Deliverables

Every route from `user-flows.md §1` "Surface 1", built to `manharevents-screen-specs.md §1`:

1. `/` — Home, with hero + search block + `<EventCard>` grid (from FE-01)
2. `/[city]` — city listing with the same grid, filtered
3. `/e/[eventSlug]` and its sub-routes (`/lineup`, `/venue`, `/gallery`, `/faq`) — event landing per §1.2
4. `/e/[eventSlug]/night/[n]` — night pages
5. `/e/[eventSlug]/book` — the 4-step pass selector per §1.3, using `<ZoneMap>`, real add/remove-to-cart state (Zustand), `<PriceBreakdown>` computed via `packages/domain`'s pricing logic
6. `/checkout/[orderId]` and `/status` — mocked payment: a "Pay ₹X" button that, after a short simulated delay, marks the mock order paid and issues a mock `<PassCard>` — no real Razorpay SDK loaded yet
7. `/artist/[artistSlug]` — artist page
8. `/g/[groupInviteCode]` — group invite fill-in (writes to the in-memory mock store)
9. `/me`, `/me/passes`, `/me/passes/[passId]`, `/me/orders`, `/me/wallet`, `/me/refunds` — account area
10. `/auth/start`, `/auth/verify`, `/auth/profile` — phone/OTP UI flow, OTP accepts any 6 digits against mock data (no real SMS)

---

## Step-by-step

1. Implement rendering strategy from `phase-08-public-site.md §8.1` (RSC by default, ISR-shaped even though there's no real revalidation trigger yet — structure it so adding real ISR later is a config change, not a rewrite).
2. Build Home and city discovery per screen-specs §1.1 — hero, overlapping search bar, trust badge, `<EventCard>` grid, city chips. No carousel anywhere.
3. Build the event landing page per §1.2 — cover, trust strip, night-by-night `<NightCard>` row, `<ZoneCards>`, venue block (static map image is fine, no real Maps API needed yet), gallery grid with lightbox, FAQ accordion, refund policy in plain language, sticky mobile bottom bar.
4. Build the pass selector per §1.3 exactly — single screen, four in-place steps, `<ZoneMap>` synced with zone cards, live `<PriceBreakdown>`, sticky footer. Cart state in Zustand, persisted to `localStorage` so a refresh doesn't lose it (this behaviour is real and correct even though the backend isn't).
5. Build checkout: phone → OTP (any 6 digits accepted, mock "user" created in the in-memory store) → name (first time) → order summary → "Pay" button. On click, simulate a 1–2s delay, then route to the status page showing the finished `<PassCard>` immediately — this is deliberately built to feel like the real Razorpay-webhook-then-QR experience described in `user-flows.md F1`, so replacing the mock payment call later doesn't change the surrounding UX.
6. Build `/me/*` account pages against the mock user's orders/passes from `packages/mock-data`.
7. Build the group invite flow (`/g/[code]`) writing fill-ins into the in-memory store, with a progress view for the buyer.
8. Wire the language switcher UI (`<LangSwitcher>`) to actually change a `locale` cookie/URL prefix; English content only for now is fine, but the switching mechanism and the Gujarati/Hindi font-loading path must work end to end (load `packages/i18n`'s English messages now; other languages' message files can be stubs with a few real keys translated as proof it works).
9. Confirm the tap-count from event page to the mock "Pay" button is ≤ 4, matching `phase-08-public-site.md §8.6` step 27 — this rule doesn't relax just because payment is mocked.

---

## Files created

Same tree as `05-execution/phase-08-public-site.md` "Files created", with `apps/web/src/lib/mock-payment.ts` added in place of a real Razorpay client, and every data call going through `packages/mock-data`'s `repo`.

---

## Acceptance criteria

- [ ] A person can go Home → city → event → book → mock-pay → see their QR, entirely by clicking, with no dead links
- [ ] Cart survives a hard refresh (localStorage) and a back-navigation
- [ ] Price breakdown is fully expanded from the first pass selection — no fee appears later
- [ ] No add-on is pre-checked anywhere
- [ ] Tap count from event page to "Pay" is ≤ 4 (spot-check manually; real Playwright assertion lands with `05-execution` P-08/09)
- [ ] Switching the language switcher changes the URL/cookie and the visible strings that have translations, without a full page flash
- [ ] Every screen from `user-flows.md §1 Surface 1` resolves to a built page — no 404s on the documented routes
- [ ] All money displayed via `<Money>`, tabular-nums, no width shift

## Definition of Done

The entire public site can be demoed on a phone, start to finish, and looks and feels like a real, finished ticketing site — because every visual decision from `manharevents-screen-specs.md §1` is present, even though the data underneath is fixtures.

---

## Claude Code prompt

> Read `docs/05-execution/phase-08-public-site.md`, `docs/04-design/manharevents-screen-specs.md` §1, and `docs/02-product/user-flows.md` §1. Build every route it describes in `apps/web`, using `packages/mock-data`'s `repo` for all data and a simulated payment step instead of Razorpay (structure the mock payment call so swapping in real Razorpay later is a function-body change, not a UI change). Follow `docs/06-frontend-build/FE-03-public-site-ui.md` step by step. Keep the buy path at 4 taps or fewer. No carousels, no pre-checked add-ons, no hardcoded English strings outside `packages/i18n`.
