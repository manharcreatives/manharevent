# Phase 06 — Ticketing & Inventory Engine

| | |
|---|---|
| **Phase ID** | `P-06` |
| **Depends on** | `P-05` |
| **Blocks** | `P-07`, `P-08`, `P-09` |
| **Estimated effort** | 22–30 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/data-model.md §3`, `02-product/product-spec.md §4` |

---

## Goal

Implement the pass model that makes this platform Garba-native: **a pass is `N admits × M nights × 1 zone`**, with race-safe inventory that cannot oversell under any concurrency.

---

## Deliverables

1. Pass type builder covering every Garba SKU
2. Race-safe inventory reservation and release
3. Add-on management (parking, wallet, merchandise)
4. Availability computation and display
5. Pass type lifecycle management
6. Bulk / complimentary issuance

---

## Step-by-step

### 6.1 Pass type builder — `/dashboard/events/[id]/passes`
1. Create/edit form:
   - Name, code, description
   - **Kind**: `season | weekend | daily | single_night`
   - **Zone**: single select
   - **Admits**: 1 (solo), 2 (couple), 4 (family), 6 (group), or custom
   - **Nights**: auto-filled from kind, overridable
     - `season` → all nights
     - `weekend` → auto-select Sat/Sun nights
     - `daily` → all nights, but buyer picks one at checkout
     - `single_night` → organizer picks one specific night
   - Total quantity, min/max per order
   - Sale window (start/end)
   - `requires_photo`, `is_transferable`
2. **Quick-add presets** — one click creates the six standard Garba SKUs with sensible defaults:
   `Season Solo`, `Season Couple`, `Season Family (4)`, `Daily Solo`, `Daily Couple`, `Weekend Couple` — each × the zones that exist.
   This is the difference between 15 minutes of setup and 90.
3. Grid view of all pass types: name, zone, admits, nights, price, sold/total, status.
4. Status transitions: `draft → on_sale → paused → sold_out → ended`, with automatic transitions on sale window and inventory exhaustion.

### 6.2 The pass validity model (in `packages/domain`)
5. Implement as pure functions with exhaustive tests:
   ```ts
   isValidForNight(pass, nightId): boolean
   isValidForZone(pass, zoneId): boolean
   remainingAdmits(pass, checkIns, nightId): number
   canReenter(pass, checkIns, nightId, policy): boolean
   passValidity(pass, context): ValidityResult
   ```
6. `passValidity()` returns a discriminated union exactly matching the `<ScanResult>` states from P-01 §6:
   `allowed | allowed_partial | already_in | wrong_zone | wrong_night | refunded | blocked | invalid`
7. **This module is shared verbatim between the server and the offline scanner.** It must have zero dependencies. Its test suite is the most important in the codebase — target 100% branch coverage.

### 6.3 Inventory
8. Wire the `reserve_inventory` / `release_expired_holds` functions from P-02 into server actions.
9. Hold TTL: 10 minutes, surfaced to the buyer as a visible countdown at checkout.
10. Extending a hold is allowed once, silently, if the buyer is actively on the payment screen.
11. Release triggers: expiry, explicit cancel, payment failure, tab close (best-effort `sendBeacon`).
12. **Concurrency test:** 200 parallel reservation attempts against 50 units must sell exactly 50, with the other 150 receiving a clean `insufficient_inventory` error. Run this in CI.

### 6.4 Availability display
13. `getAvailability(passTypeId)` returns `{ available, total, status }` where `available = total - sold - held`.
14. Display rules (UX: no fake scarcity):
    - `> 20% remaining` → no badge
    - `≤ 20%` → "Selling fast"
    - `≤ 10 units` → "Only {n} left" — **real number only**
    - `0` → "Sold out" + waitlist CTA
15. Availability is realtime on the public pass selector via Supabase Realtime on `pass_types`.

### 6.5 Add-ons — `/dashboard/events/[id]/addons`
16. Parking: 2-wheeler / 4-wheeler, own capacity, optionally tied to a parking zone.
17. F&B wallet top-up: price → wallet credit (may differ, e.g. pay ₹500 get ₹550 — a genuine, honest incentive).
18. Merchandise: name, price, quantity, size variants.
19. Add-on availability and holds use the same inventory machinery.

### 6.6 Daily-pass night selection
20. For `kind = daily`, the buyer picks which night at checkout. Inventory must be tracked **per night**, not just per pass type.
21. Implement as a `pass_type_night_inventory` view/table: `(pass_type_id, night_id, sold, total)`.
22. The pass selector shows per-night availability for daily passes.

### 6.7 Complimentary passes — `/dashboard/events/[id]/comps`
23. Issue comps with: recipient name + phone, pass type, quantity, reason (required).
24. Comps consume inventory (so capacity stays honest) but create a ₹0 order.
25. Approval required from `owner` above a configurable threshold (default 10 per user per event).
26. Every comp is audited with issuer, recipient, reason.
27. Comp passes are visually marked in the dashboard and in the scan result.

### 6.8 Bulk / corporate
28. Bulk allocation: create N passes against one order for a corporate buyer.
29. The buyer gets a distribution link — each recipient claims one pass and fills their own details (shares the group-invite machinery from P-11).

---

## Files created

```
packages/domain/src/pass/
├── validity.ts          ← the shared validator, zero deps
├── validity.test.ts     ← exhaustive, 100% branch coverage
├── availability.ts
├── presets.ts           ← the six standard Garba SKUs
└── nights.ts
apps/dashboard/src/app/events/[id]/passes/page.tsx
apps/dashboard/src/app/events/[id]/addons/page.tsx
apps/dashboard/src/app/events/[id]/comps/page.tsx
apps/dashboard/src/actions/{passType,addon,comp,inventory}.ts
apps/dashboard/src/components/passes/{PassTypeForm,PassTypeGrid,QuickAddPresets,
    AddonForm,CompIssuer,NightInventoryMatrix}.tsx
packages/contracts/src/pass.ts
supabase/migrations/0012_pass_night_inventory.sql
packages/db/tests/inventory-concurrency.test.ts
```

---

## Acceptance criteria

- [ ] All six preset SKUs create correctly in one click across all zones
- [ ] A season couple pass correctly reports `admits = 2` and validity across all 9 nights
- [ ] `passValidity()` has 100% branch coverage and returns every one of the 8 states in tests
- [ ] The concurrency test sells exactly the available quantity under 200 parallel attempts — run it 10 times, zero oversells
- [ ] Holds expire and return inventory within 60 seconds of TTL
- [ ] Daily-pass per-night inventory tracks independently and displays correctly
- [ ] Availability badges show only real numbers — grep the codebase to prove no hardcoded urgency strings exist
- [ ] Comps consume inventory and appear in the audit log with a reason
- [ ] A `manager` cannot issue comps above the threshold without `owner` approval

---

## Definition of Done

The demo event has all six SKUs across four zones on sale. The concurrency test is green in CI. `packages/domain/src/pass/validity.ts` is finished and frozen — later phases consume it, they do not modify it.

---

## OpenCode prompt

> Read `docs/05-execution/phase-06-ticketing-engine.md`, `docs/03-architecture/data-model.md §3`, and `docs/02-product/product-spec.md §4`. Execute Phase 06 steps 6.1–6.8. `packages/domain/src/pass/validity.ts` must have zero dependencies and 100% branch coverage — write those tests first. The inventory concurrency test is mandatory and must pass 10 consecutive runs before you report done.
