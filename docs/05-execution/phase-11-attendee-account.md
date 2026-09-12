# Phase 11 — Attendee Account & Group Management

| | |
|---|---|
| **Phase ID** | `P-11` |
| **Depends on** | `P-10` |
| **Blocks** | `P-13` |
| **Estimated effort** | 12–16 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `02-product/user-flows.md §F4` |

---

## Goal

The attendee's home in the product: passes, orders, invoices, wallet, group members, and the controls that keep support tickets low.

---

## Deliverables

1. Account dashboard
2. Order history with invoices
3. Group / holder management
4. Refund requests
5. Notification and language preferences
6. Privacy controls (DPDP compliance)

---

## Step-by-step

### 11.1 Account home — `/me`
1. Next upcoming event with a countdown and a one-tap link to the pass.
2. Quick actions: My Passes, Wallet, Orders, Help.
3. Bottom tab bar on mobile (Explore · Passes · Wallet · Account) — never a hamburger (banned pattern).

### 11.2 Orders — `/me/orders`
4. List: order number, event, date, amount, status.
5. Detail: full itemisation, the same `<PriceBreakdown>` shown at purchase, payment method, passes issued.
6. Download GST invoice PDF.
7. Re-send pass to WhatsApp (rate-limited, 3 per hour) — this single feature removes a large share of support contacts.

### 11.3 Group management — `/me/passes/[id]/holders`
8. For multi-admit passes, list each holder slot: filled or empty.
9. Fill in details yourself, or copy/share an invite link per slot.
10. Edit a holder's details until the first check-in on that slot.
11. Fill-in progress: "3 of 4 filled".
12. Bulk share: one WhatsApp message containing all remaining links.

### 11.4 Refunds — `/me/refunds`
13. Request from a pass or order. Reason is required (dropdown + free text).
14. **Show the exact refundable amount before confirming**, computed by the policy engine from P-07, with the tier explained ("Cancelled 9 days before — 100% refund").
15. Status timeline: requested → approved/rejected → processing → completed, with dates.
16. Rejected requests show the organizer's reason.
17. Cannot request after check-in or after the event ends.

### 11.5 Preferences — `/me/settings`
18. Language (gu / hi / en) — persisted server-side and mirrored to a cookie.
19. Notification channels: WhatsApp, SMS, email — per-category opt-in (pass delivery is transactional and non-optional; marketing is opt-in and off by default).
20. Profile: name, photo, optional email.

### 11.6 Privacy (DPDP)
21. `/me/settings/privacy`:
    - Download my data — generates a JSON + PDF export of everything we hold
    - Delete my account — anonymises `profiles` and `pass_holders`, retains `orders` and `invoices` with a tombstone (legally required for 8 years)
    - Consent history: what was consented to, when
22. Deletion requires OTP re-verification and shows exactly what will and will not be deleted.
23. All of it audited.

### 11.7 Support
24. Persistent "Help" entry point with the organizer's WhatsApp number, prefilled with order context.
25. FAQ specific to the events the user has passes for.
26. Never a generic contact form — WhatsApp with context is faster for everyone.

---

## Files created

```
apps/web/src/app/[locale]/me/{page,orders,refunds,settings,wallet}/...
apps/web/src/app/[locale]/me/passes/[id]/holders/page.tsx
apps/web/src/app/[locale]/me/settings/privacy/page.tsx
apps/web/src/actions/{account,refundRequest,privacy}.ts
apps/web/src/components/account/{OrderList,OrderDetail,HolderManager,
    RefundRequestFlow,RefundTimeline,PreferencePanel,DataExport,HelpSheet}.tsx
supabase/functions/export-user-data/index.ts
supabase/functions/anonymise-user/index.ts
e2e/account.spec.ts
```

---

## Acceptance criteria

- [ ] A signed-in user sees all their passes across multiple tenants and events
- [ ] Re-send to WhatsApp works and is rate-limited at exactly 3 per hour
- [ ] A group pass shows correct fill-in progress and shareable per-slot links
- [ ] A refund request shows the exact refundable amount **before** confirmation, matching the policy engine
- [ ] Language change persists across sessions and devices
- [ ] Data export produces a complete, readable file
- [ ] Account deletion anonymises PII but retains financial records with a tombstone reference
- [ ] Marketing notifications are off by default; transactional cannot be disabled
- [ ] Bottom tab navigation on mobile, no hamburger anywhere

---

## Definition of Done

An attendee can self-serve every routine need — find a pass, re-send it, add group members, request a refund — without contacting support.

---

## OpenCode prompt

> Read `docs/05-execution/phase-11-attendee-account.md`. Execute Phase 11 steps 11.1–11.7. The refund amount must come from `packages/domain/src/policy/refund.ts` — never recompute it in the UI. Account deletion must anonymise, not hard-delete, and must retain financial records.
