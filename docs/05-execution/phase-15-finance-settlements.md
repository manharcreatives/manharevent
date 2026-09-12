# Phase 15 — Finance, Refunds & Settlements

| | |
|---|---|
| **Phase ID** | `P-15` |
| **Depends on** | `P-09`, `P-13` |
| **Blocks** | `P-17` |
| **Estimated effort** | 20–26 hours |
| **Launch blocking** | ✅ Yes (refunds); payouts can be manual for the first season |
| **Reference docs** | `03-architecture/data-model.md §4` |

---

## Goal

Money that ties out. A double-entry ledger that reconciles against Razorpay to the paisa, a refund workflow with a real approval trail, GST reports an accountant accepts, and settlements the organizer trusts.

---

## Deliverables

1. Double-entry ledger with reconciliation
2. Refund approval workflow
3. Settlement calculation and payout tracking
4. GST reporting
5. Finance dashboard
6. Vendor settlements

---

## Step-by-step

### 15.1 The ledger
1. Every money event writes balanced `ledger_entries`. Accounts: `gross_sales`, `platform_fee`, `gateway_fee`, `gst_payable`, `refunds`, `payout`, `wallet_liability`, `vendor_payable`.
2. Written by database functions inside the same transaction as the business event — never as a separate step that can fail independently.
3. Append-only, enforced by the trigger from P-02.
4. Invariant test: for any event, `sum(debits) == sum(credits)`. Run it in CI against seed data and after every simulated flow.

### 15.2 Reconciliation
5. Daily job pulling Razorpay settlements and payments for the previous day.
6. Three-way match: our `payments` ↔ Razorpay payments ↔ Razorpay settlement.
7. Discrepancy report: missing on our side, missing on theirs, amount mismatches.
8. Gateway fees recorded from the settlement report so net revenue is real, not estimated.
9. Alert the finance role on any unresolved discrepancy older than 24 hours.

### 15.3 Refund workflow — `/dashboard/finance/refunds`
10. Queue of requests: requester, order, pass, reason, computed refundable amount, policy tier, age.
11. Approve / reject; rejection requires a reason that is shown to the attendee.
12. Approval requires role `finance` or `owner`.
13. On approval, `apply_refund()` (P-02) runs in one transaction:
    - Razorpay refund initiated
    - Passes set to `refunded`
    - Inventory returned
    - Reversing ledger entries written
    - `manifest_version` bumped so scanners reject the pass
    - Attendee notified
    - Audit entry written
14. Partial refunds: refund some passes from a multi-pass order; totals recompute correctly.
15. Bulk refund for a cancelled night, with a confirmation that states the count and total **before** executing.
16. Refund status tracked to completion via the Razorpay webhook.

### 15.4 Settlements — `/dashboard/finance/settlements`
17. Per event, per period:
    ```
    gross sales
    − platform commission
    − gateway fees
    − refunds
    − TDS (if applicable)
    − wallet liability held back
    = net payable
    ```
18. Settlement statement PDF with full itemisation.
19. Configurable schedule: T+2 after event end, weekly during a multi-night run, or manual.
20. Payout record with UTR, status, and dates.
21. For the first season, payouts may be executed manually via bank transfer and recorded here. RazorpayX automation is a later addition — say so explicitly rather than half-building it.

### 15.5 GST reporting — `/dashboard/finance/gst`
22. GSTR-1 style output: B2C summary by place of supply and rate; B2B detail where a buyer GSTIN was captured.
23. Monthly summary: taxable value, CGST, SGST, IGST, total.
24. Invoice register with sequential numbering and gap detection — **a gap must raise an alert**, since gaps are a compliance problem.
25. Credit notes for refunds, correctly numbered and linked to the original invoice.
26. CSV export in the format an accountant expects.

### 15.6 Finance dashboard — `/dashboard/finance`
27. Cards: gross revenue, net revenue, refunds, pending settlement, wallet liability.
28. Revenue trend, refund rate trend.
29. Outstanding items: pending refunds, unreconciled payments, pending payouts.
30. Everything filterable by event and date range, filters in the URL.

### 15.7 Vendor settlements
31. Per vendor: gross sales, commission, net payable.
32. Vendor settlement statement.
33. Payout tracking against the same `payouts` machinery.

### 15.8 Controls
34. Every financial action requires role `finance` or `owner`, checked server-side.
35. Every action is audited with actor, before, after.
36. Refunds above a configurable amount require `owner` approval in addition.
37. Nothing in finance is ever hard-deleted.

---

## Files created

```
apps/dashboard/src/app/finance/{page,orders,refunds,settlements,payouts,gst}/page.tsx
apps/dashboard/src/actions/{refund,settlement,payout}.ts
apps/dashboard/src/components/finance/{RefundQueue,SettlementStatement,
    GstReport,ReconciliationReport,LedgerView,PayoutTracker}.tsx
packages/domain/src/finance/{ledger.ts,settlement.ts,gst-report.ts,tds.ts} + tests
supabase/functions/{reconcile-settlements,generate-settlement-pdf,
    process-refund,credit-note}/index.ts
supabase/migrations/0016_settlement_tables.sql
packages/db/tests/ledger-balance.test.ts
e2e/refund-flow.spec.ts
```

---

## Acceptance criteria

- [ ] Ledger balances to zero across 500 seeded orders including refunds — assert in CI
- [ ] Reconciliation detects a deliberately injected discrepancy
- [ ] Refund approval completes the full chain: Razorpay refund, pass invalidated, inventory returned, ledger reversed, manifest bumped, attendee notified — verified end to end
- [ ] A refunded pass is rejected by the scanner after the manifest delta arrives
- [ ] Partial refund on a 4-pass order refunds exactly the selected passes and recomputes totals correctly
- [ ] Bulk refund for a cancelled night shows the count and total before executing
- [ ] Invoice numbering has no gaps; injecting a gap triggers the alert
- [ ] Credit notes are generated for every refund and link to the original invoice
- [ ] Settlement math matches a hand calculation on 5 fixture events
- [ ] A `support` user cannot approve a refund, even by calling the server action directly
- [ ] GST report totals match the sum of invoices for the period

---

## Definition of Done

An accountant can take the GST report and the settlement statement and work from them without asking questions. The ledger balances. Refunds work end to end including at the gate.

---

## OpenCode prompt

> Read `docs/05-execution/phase-15-finance-settlements.md` and `docs/03-architecture/data-model.md §4`. Execute Phase 15 steps 15.1–15.8. The ledger-balance invariant test must exist and pass before any UI is built. Refund approval must be a single atomic transaction covering all six side effects. Do not automate payouts — record manual payouts for now and note the RazorpayX integration as future work.
