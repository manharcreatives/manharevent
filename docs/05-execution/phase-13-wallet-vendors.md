# Phase 13 — Cashless F&B Wallet, Parking & Vendors

| | |
|---|---|
| **Phase ID** | `P-13` |
| **Depends on** | `P-11`, `P-12` |
| **Blocks** | `P-15` (vendor settlement) |
| **Estimated effort** | 18–24 hours |
| **Launch blocking** | ❌ No — high value, ship if time allows |
| **Reference docs** | `03-architecture/data-model.md §6` |

---

## Goal

The same QR that gets someone through the gate also buys them a plate of food. Cash disappears from the ground, queues shorten, and the organizer sees exactly what was sold where.

---

## Deliverables

1. Wallet creation and top-up
2. Vendor terminal mode in the scanner PWA
3. Offline-capable spending with reconciliation
4. Attendee wallet view
5. Vendor sales dashboard
6. Parking pass validation

---

## Step-by-step

### 13.1 Wallet lifecycle
1. A wallet is created per (event, user) on the first top-up.
2. Top-up sources: at checkout as an add-on, in `/me/wallet` via Razorpay, or by an organizer as a manual credit.
3. Bonus credit is supported and must be shown honestly ("Pay ₹500, get ₹550").
4. Balance is always integer paise; the ledger is `wallet_transactions` and the balance is derived — never a lone mutable number.
5. Every transaction stores `balance_after_paise` so the ledger is self-auditing.

### 13.2 Vendor setup — `/dashboard/vendors`
6. Create vendor: name, stall code, category, owner phone, commission rate.
7. The vendor's phone becomes a `tenant_members` row with role `vendor`.
8. Vendors see only their own data — enforced by RLS, not by UI.

### 13.3 Vendor terminal — `/scan/vendor`
9. Same PWA, different mode. Vendor logs in and selects their stall.
10. Flow: enter amount on a large numeric keypad → scan the attendee's QR → confirm.
11. Balance checked **locally** against the synced wallet manifest.
12. Result screen mirrors `<ScanResult>` conventions:
    - `success` — green, "₹250 paid · Balance ₹1,300"
    - `insufficient` — red, "Balance ₹120 · Need ₹250"
    - `invalid` — red, "Not a valid pass"
    - `no_wallet` — amber, "No wallet · Top up at any counter"
13. Both parties see the result. The attendee's phone updates when it next syncs.
14. Undo within 60 seconds, for the inevitable wrong-amount entry. After that, only a vendor-initiated refund with a reason.

### 13.4 Wallet manifest & offline spending
15. The scanner manifest is extended with wallet balances for the event.
16. Offline spends are queued exactly like check-ins, with `client_uuid` idempotency.
17. **Overdraft risk is real** — two vendors offline simultaneously can both approve against the same balance. Mitigation:
    - Wallet deltas broadcast over Realtime when online (same channel as check-ins)
    - A configurable offline spend cap per transaction (default ₹500)
    - Server reconciliation on sync: overdrafts are recorded, the balance floors at zero, and the organizer sees an overdraft report
    - This is accepted, bounded, and visible — not hidden
18. Show the vendor an honest offline indicator: "Offline — balances may be up to a few minutes old."

### 13.5 Attendee wallet — `/me/wallet`
19. Balance, top-up button, full transaction history with vendor names and times.
20. Works offline for viewing (cached), online for top-up.
21. Unspent balance after the event: refund to source (organizer-configurable), or expire with clear advance notice. **Never silently keep it.**

### 13.6 Parking
22. Parking add-ons issue their own QR bound to the same order.
23. Parking gate staff use the scanner in a parking mode that validates the parking pass and records entry.
24. Parking capacity tracked per parking zone, visible in live ops (P-14).

### 13.7 Vendor dashboard — `/dashboard/vendors/[id]` and the vendor's own view
25. Today's sales, transaction count, average ticket, hourly chart.
26. Transaction list with times and amounts.
27. Settlement summary: gross, commission, net payable (paid out in P-15).
28. The vendor's own login sees exactly this, scoped to them.

### 13.8 Organizer wallet reporting
29. Total loaded, total spent, outstanding liability (unspent balance — this is real money the organizer owes).
30. Sales by vendor, by category, by hour.
31. Overdraft report from offline reconciliation.
32. **Outstanding liability must be prominent.** An organizer who forgets that unspent wallet balances are a liability will have a bad time.

---

## Files created

```
apps/scanner/src/app/scan/vendor/page.tsx
apps/scanner/src/lib/wallet-manifest.ts
apps/scanner/src/components/{AmountKeypad,VendorResult,VendorModeBar}.tsx
apps/web/src/app/[locale]/me/wallet/page.tsx
apps/web/src/actions/walletTopup.ts
apps/dashboard/src/app/vendors/page.tsx
apps/dashboard/src/app/vendors/[id]/page.tsx
apps/dashboard/src/app/events/[id]/wallet-report/page.tsx
packages/domain/src/wallet/{balance.ts,spend.ts,overdraft.ts} + tests
supabase/functions/sync-wallet-txns/index.ts
supabase/migrations/0014_wallet_indexes.sql
e2e/wallet.spec.ts
```

---

## Acceptance criteria

- [ ] Top-up at checkout credits the wallet correctly, including bonus credit
- [ ] A vendor can charge a wallet fully offline, and it reconciles on sync with no duplicates
- [ ] Balance derived from `wallet_transactions` always equals the last `balance_after_paise` — assert across 1,000 seeded transactions
- [ ] Insufficient balance is refused clearly with the exact shortfall shown
- [ ] Undo within 60 seconds reverses cleanly and is audited
- [ ] Simultaneous offline spends by two vendors are detected on reconciliation, capped, and reported
- [ ] The offline spend cap is enforced
- [ ] A vendor's login can see only their own transactions — verified by an RLS test, not by checking the UI
- [ ] Outstanding wallet liability is correct and prominent in the organizer report
- [ ] Parking passes validate at parking gates and are counted separately

---

## Definition of Done

A wallet can be topped up, spent at two vendors (one offline), refunded, and every rupee reconciles. The organizer's liability number is correct.

---

## OpenCode prompt

> Read `docs/05-execution/phase-13-wallet-vendors.md` and `docs/03-architecture/data-model.md §6`. Execute Phase 13 steps 13.1–13.8. The wallet balance must always be derived from the transaction ledger, never stored as a standalone mutable value. The offline overdraft risk is real — implement the cap, the reconciliation, and the report exactly as described rather than pretending it cannot happen.
