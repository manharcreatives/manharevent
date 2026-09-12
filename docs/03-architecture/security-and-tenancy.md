# 07 · Multi-Tenancy, Security & Offline Trust

---

## 1. Tenancy model

**Row-level tenancy in a single database.** Every row carries `tenant_id`. The security boundary is Postgres RLS, not application code.

### How `tenant_id` reaches the database

1. On login, a Supabase Auth hook enriches the JWT with app metadata:
   ```json
   { "tenant_id": "...", "role": "manager", "tenant_ids": ["..."] }
   ```
2. A user belonging to multiple tenants selects one after OTP (the org-selection step we kept from the audit). The selection re-issues a JWT scoped to that tenant.
3. Every RLS policy calls:
   ```sql
   create function current_tenant_id() returns uuid
   language sql stable as $$
     select nullif(current_setting('request.jwt.claims', true)::json->>'tenant_id','')::uuid
   $$;
   ```

### Policy template

```sql
alter table <t> enable row level security;
alter table <t> force row level security;

create policy tenant_read on <t> for select
  using (tenant_id = current_tenant_id());

create policy tenant_write on <t> for all
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
```

### Public-read exception

The public site must read published events **without a session**. Handled by narrow, explicit policies:

```sql
create policy public_read_published_events on events for select
  to anon
  using (status in ('published','live') and deleted_at is null);
```

Applied only to: `events`, `event_nights`, `zones`, `pass_types`, `price_tiers`, `artists`, `night_lineup`, `venues`, `tenant_branding`, approved `event_photos`. **Never** to orders, passes, profiles, or anything financial.

### Role gating inside a tenant

```sql
create function has_role(required member_role[]) returns boolean
language sql stable as $$
  select exists (
    select 1 from tenant_members
    where tenant_id = current_tenant_id()
      and user_id = auth.uid()
      and role = any(required)
      and status = 'active'
  )
$$;

create policy finance_only on payouts for all
  using (tenant_id = current_tenant_id() and has_role(array['owner','finance']::member_role[]));
```

| Role | Can read | Can write |
|---|---|---|
| `owner` | everything in tenant | everything |
| `manager` | events, passes, attendees, reports | events, passes, comps, announcements |
| `finance` | orders, payments, refunds, payouts, GST | refund approval, payout initiation |
| `support` | orders, passes, attendees (masked) | resend pass, transfer pass, notes |
| `gate_staff` | tonight's manifest only | check_ins only |
| `vendor` | own vendor rows + wallet txns | wallet spend only |
| `sponsor` | aggregate analytics only | nothing |
| `artist` | own lineup slots | nothing |

**Rule:** `gate_staff` must never be able to `SELECT` the full `passes` table over the network. They receive a **manifest** produced by an edge function, scoped to one event, one night, one gate's zones.

---

## 2. The QR payload and offline trust

This is the hardest security problem in the product: the scanner must validate a pass **with no network**, and a QR is trivially photographable.

### Payload format

```
MG1.<base64url(payload)>.<base64url(hmac_sha256(payload, PASS_SIGNING_SECRET))>

payload = {
  v: 1,
  p: "<pass_id short>",
  e: "<event_id short>",
  z: "<zone code>",
  n: [1,2,3,4,5,6,7,8,9],     // night numbers
  a: 2,                        // admits
  i: 1728000000                // issued at
}
```

- Compact — must stay under ~180 chars so the QR renders at low error-correction-friendly density and scans fast on a cheap camera.
- HMAC prevents forgery. The signing secret lives **only** on the server and inside the encrypted device manifest.
- The payload contains **no PII**. A photographed QR reveals nothing about the holder.

### Why the QR alone is not enough

A signed QR proves *authenticity*, not *state*. Refunds, blocks, and prior check-ins are state. So the scanner also holds a **manifest**.

### The manifest

Built by `build_scan_manifest(event_id, night_id)`, delivered before gates open:

```json
{
  "version": 47,
  "event_id": "...",
  "night_number": 5,
  "generated_at": "...",
  "signing_key": "<derived per-device key>",
  "passes": [
    { "p":"...", "z":"GOLD", "a":2, "st":"active", "used":0, "nm":"Rina P", "ph":"<thumb hash>" }
  ],
  "revoked": ["...","..."]
}
```

- Stored in IndexedDB, **encrypted at rest** with a key derived from the staff session.
- Manifest deltas pushed over Realtime whenever connectivity exists; `version` increments on every refund/block.
- Device refuses to operate if the manifest is more than N hours stale (configurable, default 18h) — forces a fresh sync each night.

### Anti-passback

Three layers, in order of cost:

1. **Local:** a pass already checked in tonight on this device → immediate amber.
2. **Cross-device (near-real-time):** when any connectivity exists, check-ins broadcast over Realtime to all devices at the event. Typical propagation < 5 s.
3. **Server reconciliation:** on sync, `check_ins` is upserted on `client_uuid`. Duplicate entries across gates within a short window raise a **fraud flag** visible in the dashboard, with gate, device, and timestamp.

We deliberately **do not** hard-block on layer 2 — a network blip must never stop a legitimate person from entering. Layer 3 catches abuse after the fact, and repeat offenders get their pass `blocked`, which propagates via manifest version.

### Photo verification

For pass types with `requires_photo = true`, the manifest carries a low-res thumbnail. Staff see the face next to the green tick. This is the single most effective anti-sharing measure and costs nothing at the gate.

---

## 3. Payment security

- **Never trust the client on price.** `compute_order_totals()` runs in the database. The client's cart is a *request*, the server's total is the *truth*.
- Razorpay order created server-side only. Amount always from `orders.total_paise`.
- Payment confirmation happens **only** on a signature-verified webhook, never on the browser redirect. The redirect updates UI optimistically; the webhook is the source of truth.
- Webhook handler is idempotent on `provider_payment_id`.
- `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` never appear in any client bundle. CI has a check that greps the built output for them.
- Refunds require `finance` or `owner` role plus an audit log entry.

---

## 4. Abuse & fraud controls

| Vector | Control |
|---|---|
| Bot bulk-buying at on-sale | Turnstile on checkout + Upstash rate limit per IP/phone + virtual waiting room |
| OTP bombing | Per-phone and per-IP OTP rate limits, exponential backoff, 5/hour cap |
| Card testing | Razorpay risk rules + our own velocity check on failed payments per IP |
| Pass resale | Photo on pass, non-transferable flag, transfer requires OTP from both parties |
| QR screenshot sharing | Anti-passback layers above + photo verification |
| Inventory hoarding via abandoned carts | 10-minute hold TTL, released by cron |
| Insider comp abuse | Comps require approval, capped per user, fully audited |
| Scraping of attendee data | RLS + no public endpoint returns PII + rate limits |

---

## 5. Privacy & compliance

- **DPDP Act (India):** explicit consent at signup for WhatsApp/SMS; purpose stated; withdrawal available in `/me`.
- **Data minimisation:** we collect phone + name. Email optional. Photo only where the pass type requires it.
- **Retention:** attendee PII purged or anonymised 18 months after the event ends, except financial records retained 8 years for GST/IT.
- **Right to deletion:** `/me/account/delete` anonymises `profiles` and `pass_holders`, retains `orders`/`invoices` with a tombstoned reference.
- **Data residency:** Supabase India region, Vercel India edge where available.
- **PCI:** we never touch card data — Razorpay hosted checkout only.
- **Phone masking:** support role sees `+91 98••• ••210` unless they click "reveal", which is audited.

---

## 6. Operational security

- Branch protection on `main`; no direct pushes.
- Every migration reviewed; production migrations run in CI, never by hand.
- Service role key rotated per environment; separate Supabase projects for dev / staging / prod.
- Sentry scrubs PII before send.
- Audit log is append-only (trigger rejects UPDATE/DELETE) and retained indefinitely.
- Runbook for event night: on-call rotation, rollback procedure, manual check-in fallback (printed guest list per gate as the true last resort).

---

## 7. The offline degradation ladder

Written explicitly because event nights *will* go wrong.

| Failure | Behaviour |
|---|---|
| Venue internet down | Scanner works fully offline. Dashboard shows last-known numbers with a "stale" badge. |
| Supabase down | Scanner unaffected. Public site serves ISR cache. Checkout disabled with an honest message. |
| Razorpay down | Checkout shows "payments temporarily unavailable", collects waitlist interest. Existing passes unaffected. |
| WhatsApp API down | Falls back to SMS, then email. Pass always visible in `/me/passes` regardless. |
| Scanner device dies | Any other device can take over — manifest is per-event, not per-device. |
| Total systems failure | Printed guest list per gate, exported daily. Documented in the event-night runbook. |
