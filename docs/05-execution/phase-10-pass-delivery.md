# Phase 10 — Pass Issuance, QR & Delivery

| | |
|---|---|
| **Phase ID** | `P-10` |
| **Depends on** | `P-09` |
| **Blocks** | `P-12` |
| **Estimated effort** | 18–24 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/security-and-tenancy.md §2` |

---

## Goal

Turn a paid order into passes that reach the buyer through the channel they actually check — WhatsApp — and that work at the gate with no internet.

---

## Deliverables

1. Signed QR payload generation and verification
2. Pass PDF generation
3. WhatsApp delivery as the primary channel, SMS and email as fallbacks
4. Apple / Google Wallet passes
5. In-app pass viewing that works offline
6. Pass transfer

---

## Step-by-step

### 10.1 QR payload
1. Implement the format from `security-and-tenancy.md §2` in `packages/domain/src/pass/qr.ts`:
   ```
   MG1.<base64url(payload)>.<base64url(hmac_sha256(payload, secret))>
   ```
2. Payload is minimal and contains **no PII**: version, short pass id, short event id, zone code, night numbers, admits, issued-at.
3. Keep the encoded string under 180 characters so the QR stays low-density and scans instantly on a cheap camera.
4. `signPass()` runs server-side only. `verifyPass()` is pure and runs in **both** the server and the offline scanner.
5. Test: a tampered payload fails verification; a valid one round-trips; the string length stays within budget across all realistic inputs.

### 10.2 Pass code
6. Human-readable short code (`MG26-7QK4-2X`) via `generate_pass_code()` from P-02.
7. Excludes ambiguous characters (`0/O`, `1/I/L`) — gate staff will read these aloud over a crowd.
8. Used for manual entry when a QR won't scan, and for support lookup.

### 10.3 Pass PDF
9. Edge function rendering with `@react-pdf/renderer`. One page per pass.
10. Contains: organizer logo, event name, holder name, zone (with its colour), nights covered, admits, large QR, pass code, gate instructions, venue address with map link, support number, terms summary.
11. Designed to be readable **printed in black and white** — no colour-only information.
12. Stored in Supabase Storage; URL on the `passes` row.
13. Multi-pass orders produce one combined PDF plus individual ones.

### 10.4 WhatsApp delivery (primary)
14. Register message templates with Meta and get them approved **early** — approval takes days and is a common launch blocker. Templates needed:
    `pass_delivered`, `night_reminder`, `payment_failed`, `refund_approved`, `waitlist_available`, `group_invite`, `event_update`
15. Each template in English, Hindi, and Gujarati.
16. `pass_delivered` includes: event name, dates, zone, admits, the pass PDF as a document attachment, and a link to `/me/passes`.
17. Delivery status webhook updates `notifications` (sent → delivered → read).
18. Retry with backoff on transient failure; fall back to SMS after 3 failures.
19. Send within 30 seconds of `confirm_order`.

### 10.5 SMS & email fallback
20. SMS (MSG91, DLT-approved template): short text with the pass code and a link. Sent when WhatsApp fails or the number has no WhatsApp.
21. Email (Resend): only when the buyer gave an email. Carries the PDF and the GST invoice.
22. **The pass is always available in `/me/passes` regardless of any channel failing.** No delivery failure ever means the buyer has no pass.

### 10.6 Wallet passes
23. Apple Wallet `.pkpass`: signed bundle with event, zone, nights, QR. Requires an Apple Developer pass-type certificate.
24. Google Wallet: Event Ticket object via the Google Wallet API.
25. "Add to Apple Wallet" / "Add to Google Wallet" buttons on the pass page, shown per platform.
26. If certificates aren't ready, this is the one item in this phase that may slip to post-launch — flag it explicitly rather than silently dropping it.

### 10.7 In-app pass — `/me/passes` and `/me/passes/[id]`
27. List: upcoming first, grouped by event, with status badges.
28. Detail: full-screen QR at maximum brightness (request wake-lock and raise screen brightness — small touch, huge at the gate).
29. Shows: holder name, zone with colour, nights, admits used vs total, gate instructions, re-entry policy.
30. **Works offline.** Service worker caches the pass page and the QR image after first view. Someone at a venue with no signal must still be able to open their pass.
31. Actions: download PDF, add to wallet, share, transfer, request refund.
32. Live status: if a pass is refunded or blocked, the page reflects it immediately when online.

### 10.8 Pass transfer
33. Only when `is_transferable = true`.
34. Flow: enter recipient phone → recipient receives an OTP-verified claim link → on claim, the pass is reassigned, a **new QR is generated**, the old QR is invalidated, and the manifest version bumps.
35. Both parties are notified. Fully audited.
36. Transfer is blocked after the first check-in on that pass, and within a configurable window before the event (default 2 hours).

### 10.9 Group invite fill-in — `/g/[inviteCode]`
37. For multi-admit passes, each `pass_holders` row gets an `invite_code`.
38. The buyer sees a fill-in tracker and can share links per admit.
39. The recipient enters name, phone, and (if required) a selfie, then gets their own QR bound to their name.
40. Unfilled admits still work at the gate as generic admits — a half-filled group must never be blocked.

---

## Files created

```
packages/domain/src/pass/{qr.ts,qr.test.ts,code.ts}
supabase/functions/generate-pass-pdf/index.ts
supabase/functions/send-whatsapp/index.ts
supabase/functions/whatsapp-status-webhook/index.ts
supabase/functions/generate-wallet-pass/index.ts
apps/web/src/app/[locale]/me/passes/page.tsx
apps/web/src/app/[locale]/me/passes/[id]/page.tsx
apps/web/src/app/[locale]/g/[inviteCode]/page.tsx
apps/web/src/components/pass/{PassCard,PassQr,WalletButtons,TransferDialog,
    GroupInviteTracker,HolderFillForm}.tsx
apps/web/src/lib/offline-pass-cache.ts
apps/web/public/sw.js                          (or Serwist config)
packages/i18n/templates/whatsapp/{en,hi,gu}/*.json
e2e/pass-delivery.spec.ts
```

---

## Acceptance criteria

- [ ] A paid order produces passes with valid, verifiable QR payloads within 5 seconds
- [ ] A tampered QR fails verification; every valid QR stays under 180 characters
- [ ] WhatsApp delivery succeeds within 30 seconds, with the PDF attached, in the buyer's language
- [ ] Blocking WhatsApp in test causes SMS fallback, and the pass is still in `/me/passes`
- [ ] The pass page opens **fully offline** after one online view (test in airplane mode)
- [ ] The PDF is legible when printed in greyscale
- [ ] Pass transfer invalidates the old QR — scanning it afterwards returns `invalid`
- [ ] Group invite links let a recipient claim one admit and receive their own QR
- [ ] A half-filled group pass still admits everyone at the gate
- [ ] Wallet passes install on a real iPhone and a real Android (or the item is explicitly flagged as deferred)

---

## Definition of Done

Buy a pass on a real phone, receive it on WhatsApp, turn off mobile data, open it from the home screen, and see the QR. That is the test.

---

## OpenCode prompt

> Read `docs/05-execution/phase-10-pass-delivery.md` and `docs/03-architecture/security-and-tenancy.md §2`. Execute Phase 10 steps 10.1–10.9. Start WhatsApp template registration with Meta on day one of this phase — approval takes days and will block delivery. The offline pass view is a hard requirement: verify it in airplane mode on a real device, not in a simulator.
