# Phase 07 — Pricing, Promo & Policy Engine

| | |
|---|---|
| **Phase ID** | `P-07` |
| **Depends on** | `P-06` |
| **Blocks** | `P-09` |
| **Estimated effort** | 16–22 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/data-model.md §3–4` |

---

## Goal

One deterministic, tested pricing pipeline that produces the same number on the client, on the server, and in the database — and the policy engine that governs refunds and re-entry.

**The single rule of this phase:** the client never computes a price it acts on. It may *display* an estimate; the server's number is the truth.

---

## Deliverables

1. Price tier engine with time and quantity triggers
2. Promo code engine with validation and attribution
3. Convenience fee and GST computation
4. Refund policy builder and evaluator
5. Re-entry policy configuration
6. A single shared pricing pipeline

---

## Step-by-step

### 7.1 The pricing pipeline (`packages/domain/src/pricing/`)
1. Implement as a pure, ordered pipeline:
   ```
   lineItems
     → resolveActiveTier()      per item, by time and quantity sold
     → subtotal
     → applyPromo()             validation + discount, capped
     → discountedSubtotal
     → convenienceFee()         from tenant_commission
     → gst()                    18% on (taxable base)
     → total
   ```
2. Every stage is a pure function returning both the value **and** an explanation string for the UI.
3. `computeOrderTotals(input): PriceBreakdown` where `PriceBreakdown` includes every line the buyer will see.
4. Mirror this exactly in the SQL function `compute_order_totals()` from P-02.
5. **Parity test:** a fixture set of 25 scenarios run through both the TS pipeline and the SQL function; every result must match to the paisa. This test gates merge.

### 7.2 Price tiers
6. Tier resolution order: time window first, then quantity cap, then `sort_order`.
7. Automatic tier switching:
   - Time-based: a cron job flips tiers at the boundary; the public page shows a countdown to the next price
   - Quantity-based: `quantity_sold >= quantity_cap` switches on the next reservation
8. Tier editor in `/dashboard/events/[id]/passes` — inline grid: tier name, price, starts, ends, quantity cap.
9. Show the organizer a preview: "At current sales rate, Early Bird ends in ~4 days."
10. Guard: overlapping tier windows are rejected at save time with a clear message.

### 7.3 Promo codes — `/dashboard/events/[id]/promos`
11. Create/edit: code, kind (`percent | flat | bogo`), value, min order, max discount cap, usage limit, per-user limit, applicable pass types, validity window, owner label.
12. Validation on apply, in order, with a specific message for each failure:
    - not found → "That code isn't valid."
    - expired / not started → "This code expired on {date}."
    - usage limit reached → "This code has been fully used."
    - per-user limit → "You've already used this code."
    - min order not met → "Add ₹{n} more to use this code."
    - pass type not applicable → "This code doesn't apply to {passType}."
13. Usage is counted **on payment success**, not on apply — otherwise abandoned carts burn codes.
14. Attribution: `owner_label` + UTM captured on the order, so influencer performance is reportable in P-14.
15. Bulk generation: create N unique codes from a prefix (for offline/print campaigns).

### 7.4 Convenience fee
16. Computed from `tenant_commission`: `flat | percent | hybrid`, with min and max caps.
17. `passed_to_buyer = true` → added on top, shown as a separate line "Convenience fee".
18. `passed_to_buyer = false` → absorbed by the organizer, not shown to the buyer, deducted at settlement.
19. **Always itemised when charged.** Never folded into the ticket price (UX rule 4).

### 7.5 GST
20. 18% on (ticket price + convenience fee) unless the organizer's configuration says otherwise.
21. Intra-state (organizer and buyer both Gujarat) → CGST 9% + SGST 9%. Inter-state → IGST 18%.
22. Place of supply derived from the **event venue** state, which is the correct treatment for event admission.
23. Rounding: compute in paise, round half-up at the final total only. Never round intermediate values.
24. GST breakdown always visible in the order summary and on the invoice.

### 7.6 Refund policy builder — `/dashboard/events/[id]/policy`
25. Time-tiered policy rows: "more than N days before the event → X% refund".
26. Default policy (UX rule 1): 100% up to 7 days before, 50% up to 48 hours before, 0% after.
27. Per-pass-type override allowed.
28. Options: refund the convenience fee or not; refund add-ons or not.
29. Policy evaluator in `packages/domain/src/policy/refund.ts`:
    ```ts
    evaluateRefund(order, passes, now, policy): { refundablePaise, tier, explanation }
    ```
30. Policy is **snapshotted onto the refund row** at request time, so later policy edits never change past decisions.
31. The policy renders as plain-language text on the public event page before payment.

### 7.7 Re-entry policy
32. Configured on the event: `none | once | unlimited`, plus an optional re-entry window in minutes.
33. Evaluator in `packages/domain/src/policy/reentry.ts`, consumed by the shared pass validator from P-06.
34. Per-zone override (e.g. VIP unlimited, General once).

### 7.8 Display components
35. `<PriceBreakdown>` — base, per-item, discount, convenience fee, GST split, total. **Always fully expanded, never collapsed.**
36. `<TierCountdown>` — "Early Bird price ends in 2d 14h".
37. `<PromoInput>` — apply/remove with inline validation and the specific error copy above.
38. `<RefundPolicyDisplay>` — the policy in plain language, in the buyer's language.

---

## Files created

```
packages/domain/src/pricing/
├── pipeline.ts  tiers.ts  promo.ts  fees.ts  gst.ts
├── pipeline.test.ts  gst.test.ts  promo.test.ts
└── fixtures/scenarios.ts        ← the 25 parity scenarios
packages/domain/src/policy/{refund.ts,reentry.ts} + tests
packages/db/tests/pricing-parity.test.ts   ← TS vs SQL
apps/dashboard/src/app/events/[id]/promos/page.tsx
apps/dashboard/src/app/events/[id]/policy/page.tsx
apps/dashboard/src/actions/{promo,tier,policy}.ts
packages/ui/src/pricing/{PriceBreakdown,TierCountdown,PromoInput,RefundPolicyDisplay}.tsx
```

---

## Acceptance criteria

- [ ] The 25-scenario parity test passes: TS pipeline and SQL function agree to the paisa on every case
- [ ] GST splits correctly into CGST+SGST for Gujarat and IGST for out-of-state, with correct place of supply
- [ ] Rounding never produces a total that differs from the sum of displayed lines
- [ ] Every promo failure mode returns its specific message, verified in tests
- [ ] Promo usage increments on payment success only — an abandoned cart does not consume a code
- [ ] Tier switches automatically at both a time boundary and a quantity cap
- [ ] Overlapping tier windows are rejected at save
- [ ] `evaluateRefund` returns correct amounts at every tier boundary, including exactly-on-the-boundary cases
- [ ] The refund policy snapshot means editing the policy does not change an already-requested refund
- [ ] `<PriceBreakdown>` is fully expanded by default everywhere it appears

---

## Definition of Done

Parity test green. A buyer sees the same total on the pass selector, at checkout, on the Razorpay screen, and on the invoice — always.

---

## OpenCode prompt

> Read `docs/05-execution/phase-07-pricing-promos.md`. Execute Phase 07 steps 7.1–7.8. Build `packages/domain/src/pricing` first with its full test suite, then mirror it in SQL, then write the parity test. Do not proceed to the UI until the parity test is green. All money is integer paise — never use floating point anywhere in this phase.
