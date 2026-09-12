# Phase 09 — Checkout, Payments & GST

| | |
|---|---|
| **Phase ID** | `P-09` |
| **Depends on** | `P-07`, `P-08` |
| **Blocks** | `P-10` |
| **Estimated effort** | 24–32 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/security-and-tenancy.md §3`, `02-product/user-flows.md §F1` |

---

## Goal

Take money reliably. Every rupee accounted for, every failure recoverable, every invoice GST-compliant, and no oversell under load.

**The rule of this phase:** the webhook is the source of truth. The browser redirect is a UI convenience and is never trusted.

---

## Deliverables

1. Checkout flow with inline auth
2. Razorpay integration (UPI Intent, cards, netbanking)
3. Webhook-driven confirmation, idempotent
4. GST invoice generation
5. Failure recovery and abandoned-cart handling
6. Waitlist for sold-out
7. Virtual waiting room for on-sales

---

## Step-by-step

### 9.1 Draft orders
1. Selecting passes creates a `draft` order server-side with `inventory_holds` (P-06) and a 10-minute expiry.
2. The draft order id lives in a cookie and localStorage so the cart survives everything.
3. Modifying the selection updates the draft and adjusts holds atomically.
4. `compute_order_totals()` recalculates on every change — the client never sends a price.

### 9.2 Checkout page — `/checkout/[orderId]`
5. Order summary: items, quantities, nights, zone, add-ons, full `<PriceBreakdown>`.
6. Hold countdown, visible and honest ("Passes held for 8:42").
7. Buyer identification:
   - Signed out → inline `<PhoneOtpFlow>` from P-03, **no route change**
   - Signed in → phone shown, editable
8. Name capture if the profile has none.
9. Refund policy in plain language + a required consent checkbox for terms (unchecked by default).
10. Cloudflare Turnstile, invisible mode.
11. Single primary action: "Pay ₹{total}".

### 9.3 Razorpay
12. Server action `createPaymentOrder(orderId)`:
    - Re-validates holds are still alive
    - Re-runs `compute_order_totals()` — **never** trusts a stored total
    - Creates the Razorpay order with amount from the DB
    - Writes a `payments` row with status `created`
13. Client opens Razorpay Standard Checkout with the returned order id.
14. Config: UPI (Intent + Collect), cards, netbanking, wallets. **UPI Intent must be first on mobile** — it opens GPay/PhonePe directly and is the highest-converting path in India by a wide margin.
15. Prefill name and phone. Theme the checkout to the tenant's primary colour.
16. On dismiss: keep the order and the holds, show "Payment cancelled — your passes are still held for {n} minutes" with a retry button.

### 9.4 Webhook — the source of truth
17. Edge function `razorpay-webhook`:
    - Verify the signature. Reject unsigned requests with 401 and log.
    - Handle: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`
    - **Idempotent on `provider_payment_id`** — a replayed webhook must be a no-op
18. On `payment.captured`: update `payments`, then call `confirm_order()` (P-02) in one transaction — holds→sold, generate passes, write ledger, create invoice, queue notifications.
19. On `payment.failed`: mark payment failed, keep the order in `pending_payment`, keep holds until TTL, queue a recovery message.
20. Webhook processing must complete in < 5s or hand off to a queue.
21. **Reconciliation cron** (every 15 min): fetch Razorpay payments from the last 2 hours and compare against our `payments` table. Any mismatch raises an alert. This catches missed webhooks, which will happen.

### 9.5 Result page — `/checkout/[orderId]/status`
22. Polls order status (or subscribes via Realtime) for up to 30 seconds.
23. **Success: show the pass QR immediately on screen.** Do not make the buyer wait for WhatsApp. This is the single biggest trust moment in the product.
24. Then: "Also sent to WhatsApp on {phone}" + links to `/me/passes` and download PDF.
25. Failure: state the reason plainly, offer retry with the same order, and show the support number.
26. Pending (rare, e.g. slow UPI): "Confirming your payment — this can take up to 2 minutes. We'll message you." Never leave the buyer on a spinner with no explanation.

### 9.6 GST invoices
27. On `confirm_order`, generate the `invoices` row with a sequential, gap-free invoice number per tenant per financial year (`MG/2026-27/00001`).
28. Render the PDF in an edge function with `@react-pdf/renderer`. Must contain: organizer legal name, address, GSTIN, buyer name, place of supply, HSN/SAC `998554`, taxable value, CGST/SGST or IGST with rates, total in figures and words, invoice number and date.
29. Store in Supabase Storage; link from `/me/orders` and the notification.
30. Sequential numbering must be race-safe — use a per-tenant sequence table with row locking, not `count(*) + 1`.

### 9.7 Failure recovery
31. Abandoned draft orders (holds expired, never paid): queue a WhatsApp message after 30 minutes with a link that rebuilds the cart, if inventory still allows.
32. `pending_payment` orders older than 2 hours: reconcile against Razorpay, then either confirm or cancel and release.
33. Payment retry always uses the **same order**, so the buyer never re-selects.
34. Every failure path is tested with Razorpay's test-mode failure cards.

### 9.8 Waitlist
35. Sold-out pass types show "Join waitlist" instead of a disabled button.
36. Capture phone + desired quantity into `waitlist_entries`.
37. When inventory returns (refund, released hold, quantity increase), notify waitlist in order with a 30-minute exclusive purchase window.
38. Waitlist notification and conversion are tracked for reporting.

### 9.9 Virtual waiting room
39. For high-demand on-sales, an Upstash-backed queue: a token bucket admits N users per minute to `/checkout`.
40. Waiting page shows genuine position and an honest estimated wait. Never a fake progress bar.
41. Enabled per event via a feature flag — off by default.

### 9.10 Load testing
42. k6 scenario: 5,000 virtual users hitting the pass selector, 1,000 completing checkout against 500 available passes.
43. Assert: exactly 500 sold, zero oversell, p95 checkout latency < 3s, no 5xx.

---

## Files created

```
apps/web/src/app/[locale]/checkout/[orderId]/page.tsx
apps/web/src/app/[locale]/checkout/[orderId]/status/page.tsx
apps/web/src/app/[locale]/waiting-room/page.tsx
apps/web/src/actions/{order,payment,waitlist}.ts
apps/web/src/components/checkout/{OrderSummary,HoldCountdown,BuyerIdentity,
    ConsentBlock,RazorpayButton,PaymentResult,WaitlistForm}.tsx
supabase/functions/razorpay-webhook/index.ts
supabase/functions/generate-invoice/index.ts
supabase/functions/reconcile-payments/index.ts
supabase/functions/notify-waitlist/index.ts
supabase/migrations/0013_invoice_sequence.sql
packages/domain/src/invoice/{numbering.ts,gst-words.ts} + tests
load-tests/checkout.k6.js
e2e/checkout.spec.ts
```

---

## Acceptance criteria

- [ ] A complete purchase works end-to-end in Razorpay test mode: UPI, card, and netbanking
- [ ] Replaying the same webhook 10 times produces exactly one set of passes
- [ ] Killing the browser immediately after payment still results in passes being issued (webhook does the work)
- [ ] A failed payment keeps the order and holds, and retry succeeds without re-selecting
- [ ] Invoice numbers are sequential with **no gaps** under 100 concurrent confirmations
- [ ] The invoice PDF contains every legally required GST field, verified against a real sample
- [ ] The reconciliation cron detects a deliberately-dropped webhook and repairs the order
- [ ] The QR appears on the success page within 2 seconds of payment capture
- [ ] Load test: 500 available, 1,000 attempts → exactly 500 sold, zero oversell, zero 5xx
- [ ] Waitlist notification fires when a refund returns inventory
- [ ] Turnstile blocks a scripted checkout attempt

---

## Definition of Done

Money moves correctly under load and under failure. The load test and the idempotency test are green in CI. Finance can look at an invoice and accept it.

---

## OpenCode prompt

> Read `docs/05-execution/phase-09-checkout-payments.md` and `docs/03-architecture/security-and-tenancy.md §3`. Execute Phase 09 steps 9.1–9.10. The webhook is the only thing that confirms an order — the browser redirect must never write order state. Every handler must be idempotent. Build the reconciliation cron in the same phase, not later; missed webhooks are certain, not hypothetical. The k6 load test must pass before you report done.
