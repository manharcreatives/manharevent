# HANDOFF-TO-BACKEND.md
## Frontend-First Track → Real Database Connection Map

**Date:** 2026-09-12 (updated during FE-11 reconciliation)
**Status:** FE-00 through FE-10 built (FE-08/FE-09/FE-10 built this pass, marked 🔵 built-unverified in `docs/PROGRESS.md` — no `pnpm lint`/`typecheck`/`build` could run this session; see that file's environment-constraints note). FE-11 is reconciling this document against what FE-08–FE-10 actually built.

This document answers "database kaha connect karna hai?" — not by making the decision, but by listing exactly what needs to change for each real service to replace its mock counterpart.

Every function in `packages/mock-data/src/repo.ts` is listed here with:
- Its current mock body (what it does now)
- Its real replacement (the Supabase/external call)
- The `05-execution` phase that owns wiring it

**The wire-up pattern is the same for every function:**
1. Open `packages/mock-data/src/repo.ts`
2. Find the function
3. Replace the body with the Supabase (or external) call shown below
4. Zero call sites need to change — every app imports from `@manhar-garba/mock-data`

---

## Section 0 — Tenant Applications (Surface 0 onboarding, added by FE-08/FE-10)

New with the 2026-09-12 pivot: before a tenant exists, an organizer submits a `TenantApplication` through `apps/marketing`'s registration flow, and internal ops decides on it from `apps/dashboard`'s new `/admin/tenants` area (FE-10). See `data-model.md` §1a for the new `tenant_applications` table this section maps to — the "does this need its own table?" question that doc used to leave open is now resolved (yes).

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `submitApplication(input)` | Pushes to an in-memory array | `supabase.from('tenant_applications').insert({...input, status: 'submitted', submitted_at: now()}).select().single()` | P-04 |
| `listApplications(status?)` | Filters the in-memory array by status | `supabase.from('tenant_applications').select('*').eq('status', status).order('submitted_at', {ascending: false})` (internal-ops role only — see the open item in `data-model.md` §11 about modeling that role) | P-04 |
| `getApplication(id)` | Finds in the in-memory array | `supabase.from('tenant_applications').select('*').eq('id', id).single()` | P-04 |
| `approveApplication(id)` | **Mock only flips `status → 'approved'` and sets `provisioned_at` — it does not create any tenant, branding, commission row, or owner membership.** | `supabase.rpc('provision_tenant', { p_application_id: id })` — the new function in `data-model.md` §9/§10 that must do all of that atomically. This is genuinely new backend work, not a mechanical swap; see the open items in `data-model.md` §11 (internal-ops role, applicant auth timing) before implementing it | P-04 |
| `rejectApplication(id, reason, moreInfoNeeded)` | Flips status to `rejected`/`more_info_needed` + stores `reason` | `supabase.from('tenant_applications').update({ status: moreInfoNeeded ? 'more_info_needed' : 'rejected', rejection_reason: reason, decided_at: now() }).eq('id', id)` | P-04 |

Consuming UI built this session: `apps/dashboard/src/app/(admin)/admin/tenants/*` (list + detail + `<TenantApprovalActions>`), calling these through `apps/dashboard/src/app/actions/tenant-applications.ts`'s `"use server"` wrappers — that action file's call sites don't change when the mock body is swapped.

---

## Section 1 — Tenant

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `getTenantBySlug(slug)` | Returns hardcoded `tenant` fixture | `supabase.from('tenants').select('*').eq('slug', slug).single()` | P-04 |
| `getTenantBranding(tenantId)` | Returns hardcoded `tenantBranding` fixture | `supabase.from('tenant_branding').select('*').eq('tenant_id', tenantId).single()` | P-04 |

---

## Section 2 — Events, Venues, Zones

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `getEventBySlug(slug)` | Returns hardcoded `event` if slug matches | `supabase.from('events').select('*').eq('slug', slug).single()` | P-05 |
| `listPublishedEvents(tenantId)` | Returns `[event]` always | `supabase.from('events').select('*').eq('tenant_id', tenantId).eq('status', 'published').order('start_date')` | P-05 |
| `getVenue(id)` | Returns hardcoded `venue` if id matches | `supabase.from('venues').select('*').eq('id', id).single()` | P-05 |
| `listEventNights(eventId)` | Filters hardcoded `eventNights` array | `supabase.from('event_nights').select('*').eq('event_id', eventId).order('night_number')` | P-05 |
| `getEventNight(id)` | Finds in hardcoded array | `supabase.from('event_nights').select('*').eq('id', id).single()` | P-05 |
| `listZones(eventId)` | Filters hardcoded `zones` array | `supabase.from('zones').select('*').eq('event_id', eventId).order('sort_order')` | P-05 |
| `listGates(eventId)` | Filters hardcoded `gates` array | `supabase.from('gates').select('*').eq('event_id', eventId)` | P-05 |
| `listArtists(tenantId)` | Filters hardcoded `artists` array | `supabase.from('artists').select('*').eq('tenant_id', tenantId).order('name')` | P-05 |
| `listLineupForNight(nightId)` | Filters hardcoded `nightLineup` array | `supabase.from('night_lineup').select('*, artists(*)').eq('night_id', nightId).order('slot_order')` | P-05 |

---

## Section 3 — Pass Types & Pricing

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `listPassTypes(eventId)` | Filters hardcoded `passTypes` array | `supabase.from('pass_types').select('*').eq('event_id', eventId).order('sort_order')` | P-06 |
| `listPassTypesForZone(eventId, zoneId)` | Filters hardcoded array by both | `supabase.from('pass_types').select('*').eq('event_id', eventId).eq('zone_id', zoneId).order('sort_order')` | P-06 |
| `listPriceTiers(passTypeId)` | Filters hardcoded `priceTiers` array | `supabase.from('price_tiers').select('*').eq('pass_type_id', passTypeId).order('sort_order')` | P-07 |
| `listAddons(eventId)` | Filters hardcoded `addons` array | `supabase.from('addons').select('*').eq('event_id', eventId).eq('status', 'on_sale')` | P-06 |
| `getPromoCode(tenantId, code)` | Finds in hardcoded `promoCodes` array | `supabase.from('promo_codes').select('*').eq('tenant_id', tenantId).eq('code', code).single()` — add server-side usage count check | P-07 |

---

## Section 4 — Orders

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `getOrder(id)` | Finds in in-memory `_orders` array | `supabase.from('orders').select('*').eq('id', id).single()` | P-09 |
| `listOrdersByPhone(phone)` | Filters `_orders` by phone | `supabase.from('orders').select('*').eq('buyer_phone', phone).order('created_at', {ascending: false})` | P-09, P-11 |
| `listOrderItems(orderId)` | Filters a mutable `_orderItems` copy (fixed FE-09 — previously read the immutable fixture array directly, so items written by `completeMockOrder` below were invisible to it) | `supabase.from('order_items').select('*').eq('order_id', orderId)` | P-09 |
| `listPayments(orderId)` | Filters a mutable `_payments` copy (same FE-09 fix as above) | `supabase.from('payments').select('*').eq('order_id', orderId)` | P-09 |
| `createOrder(input)` | Inserts into in-memory `_orders` array | `supabase.from('orders').insert({...input, status: 'draft', expires_at: ...}).select().single()` | P-09 |
| `completeMockOrder(input)` **(new, FE-09)** | Added this pass to actually close the buy loop end-to-end: flips the order to `paid`, writes matching `order_items`/`payments` rows, and generates the `Pass` record(s) — all in one client-triggered call, since there's no real payment gateway yet | **Do not port this function as-is** — it is a demo-only shortcut standing in for the entire webhook flow already described below (`confirm_order` RPC via `/api/webhooks/razorpay`). Its pass-generation shape (`pass_code`/`qr_payload` format, one `Pass` row per unit of `quantity`) is a useful reference for what `confirm_order` must produce server-side with real HMAC signing (see §5's QR/Delivery row), but the *trigger* must move from "browser calls this after a fake pay button" to "webhook calls `confirm_order` after Razorpay confirms" | P-09, P-10 |

### Razorpay (payment confirmation — webhook-only path)
The real `createOrder` creates a Supabase order, then immediately calls `Razorpay.orders.create(...)` to get a `razorpay_order_id`. The webhook at `/api/webhooks/razorpay` is the only path that sets `status → 'paid'` — never the browser redirect.

| Mock function/route | Real replacement | Phase |
|---|---|---|
| `apps/web/src/app/actions/order.ts → createMockOrder()` | Create Supabase order + Razorpay order in one server action | P-09 |
| `apps/web/src/app/checkout/[id]/page.tsx` (payment UI) | Load Razorpay checkout script, pass `razorpay_order_id` | P-09 |
| `/api/webhooks/razorpay` (doesn't exist yet) | `POST` handler: verify HMAC, call `supabase.rpc('confirm_order', {...})` | P-09 |

---

## Section 5 — Passes

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `getPass(id)` | Finds in `_passes` array | `supabase.from('passes').select('*').eq('id', id).single()` | P-10 |
| `getPassByCode(code)` | Finds in `_passes` array | `supabase.from('passes').select('*').eq('pass_code', code).single()` | P-10 |
| `listPassesForOrder(orderId)` | Filters `_passes` by order id | `supabase.from('passes').select('*').eq('order_id', orderId)` | P-10 |
| `listActivePassesForEvent(eventId)` | Filters `_passes` by event + status | `supabase.from('passes').select('*').eq('event_id', eventId).eq('status', 'active')` | P-12 |
| `listPassHolders(passId)` | Filters `passHolders` array | `supabase.from('pass_holders').select('*').eq('pass_id', passId)` | P-11 |

### QR / Delivery (P-10)
| Mock behaviour | Real replacement | Phase |
|---|---|---|
| `pass.qr_payload` is already set in fixture | Server-side HMAC signing on pass creation: `MG26.v1.{pass_id}.{hmac_base64url}` (max 180 chars) | P-10 |
| Pass QR shown as a plain string | WhatsApp delivery via `packages/integrations/whatsapp` client after webhook confirms payment | P-10 |

---

## Section 6 — Check-ins

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `countCheckInsForPassNight(passId, nightId)` | Filters `_checkIns` array | `supabase.from('check_ins').select('id', {count: 'exact'}).eq('pass_id', passId).eq('night_id', nightId).eq('direction', 'in').eq('result', 'allowed')` | P-12 |
| `listRecentCheckIns(eventId, nightId, limit)` | Filters + sorts `_checkIns` | `supabase.from('check_ins').select('*').eq('event_id', eventId).eq('night_id', nightId).order('scanned_at', {ascending:false}).limit(limit)` | P-14 |
| `recordCheckIn(input)` | Pushes to `_checkIns` array (idempotent on `client_uuid`) | `supabase.from('check_ins').upsert({...input}, {onConflict: 'client_uuid', ignoreDuplicates: false})` | P-12 |

### Scanner queue flush (apps/scanner/src/lib/queue.ts → flushQueue)
Currently calls `recordCheckIn()` from mock-data. Replace with:
```ts
await supabase.from('check_ins').upsert(checkInRows, { onConflict: 'client_uuid' });
```
The rest of the scanner (offline validation, Dexie, queue) **does not change**.

### Realtime (apps/scanner/src/lib/realtime.ts)
Currently no-ops. Replace bodies in P-12:
- `subscribeToCheckIns(eventId, nightId, onCheckin)` → `supabase.channel('check_ins:...').on('postgres_changes', ..., onCheckin).subscribe()`
- `broadcastCheckIn(...)` → `supabase.channel(...).send({type: 'broadcast', event: 'checkin', payload: ...})`

---

## Section 6a — Scanner Login Credentials (added by FE-10)

"Gate-scanner access issued only from the admin panel, never self-registered" (`02-product/user-flows.md`'s Surface-3 note). Before this pass there was no credential concept at all — `gate_staff` was just a team-member role with nothing to log in with. Maps to the new `scanner_login_codes` table in `data-model.md` §5.

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `issueScannerCredential(teamMemberId, gateLabel?)` — lives in `apps/dashboard/src/lib/dashboard-store.ts`, **not** `packages/mock-data/src/repo.ts` | Generates a random 6-char code client-side, kept only in that Zustand store's `persist` (i.e. that browser's `localStorage`) | Should become a server action inserting into `scanner_login_codes` (store a hash, not the plaintext code) and returning the plaintext once for display/copy | P-12 (new — not in the original P-numbered list) |
| `revokeScannerCredential(id)` | Sets `revokedAt` client-side | `update scanner_login_codes set revoked_at = now() where id = ...` | P-12 |

**Known gap, not yet wired even at the mock level:** `apps/scanner` runs as its own separate process with its own separate mock store (see that package's own note in `packages/mock-data/src/repo.ts`), so a code issued here is not actually checked anywhere yet — there's no `/scan/login` screen or verify step in `apps/scanner`. That's new frontend work as much as new backend work; flagged in `data-model.md` §11 as an open item.

---

## Section 7 — Analytics / Dashboard

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `getLiveStats(eventId, nightId)` | Counts from in-memory arrays | `supabase.rpc('get_live_stats', { p_event_id: eventId, p_night_id: nightId })` — PostgreSQL function returns `{tickets_sold, revenue_paise, inside_now, tonight_gate_queue}` | P-14 |

---

## Section 8 — Scan Manifest (critical P-12 path)

| Function | Current (mock) | Real replacement | Phase |
|---|---|---|---|
| `buildScanManifest(eventId, nightId)` | Builds from in-memory arrays | `supabase.rpc('build_scan_manifest', { p_event_id: eventId, p_night_id: nightId })` — returns the compact JSON array the gate device caches in Dexie | P-12 |

**This is the most important swap.** The scanner's offline validation logic (`apps/scanner/src/lib/validate.ts`) does not change. Only the source of the manifest data changes — from the mock-data function to the Supabase RPC.

The RPC function `build_scan_manifest` must return rows matching `ScanManifestEntry`:
```sql
SELECT
  p.id AS pass_id,
  p.pass_code,
  p.qr_payload,
  p.admits,
  p.zone_id,
  z.name AS zone_name,
  p.night_ids,
  p.status,
  COUNT(ci.id) FILTER (WHERE ci.night_id = p_night_id AND ci.direction = 'in' AND ci.result = 'allowed') AS tonight_checkin_count,
  STRING_AGG(ph.full_name, ' & ') AS holder_name,
  MIN(ph.photo_url) AS holder_photo_url,
  p.blocked_reason
FROM passes p
LEFT JOIN zones z ON z.id = p.zone_id
LEFT JOIN pass_holders ph ON ph.pass_id = p.id
LEFT JOIN check_ins ci ON ci.pass_id = p.id
WHERE p.event_id = p_event_id
GROUP BY p.id, z.name
```

---

## Section 9 — Auth (no mock functions, but stubs exist)

| Surface | Current | Real replacement | Phase |
|---|---|---|---|
| `apps/web/src/lib/auth-store.ts` | Zustand store with mock phone/name | Replace `login()` with Supabase `signInWithOtp({phone})` + `verifyOtp({phone, token})` | P-03 |
| `apps/dashboard/src/lib/dashboard-store.ts` | Zustand with seeded mock events/team | After auth, fetch events for `currentTenantId` from Supabase | P-03, P-05 |
| Scanner device binding | `getDeviceId()` uses localStorage | Add to `devices` table on first login with `user_id` | P-03 |

---

## Section 10 — Notifications (no mock currently)

| Event | Real sender | Phase |
|---|---|---|
| Order confirmed | WhatsApp template `ORDER_CONFIRMED` (en/gu/hi), SMS fallback | P-10, P-16 |
| Pass delivered | WhatsApp template `PASS_DELIVERED` with QR image | P-10, P-16 |
| Refund approved | WhatsApp template `REFUND_APPROVED` with amount | P-15, P-16 |
| Event reminders (D-7, D-1) | WhatsApp + push (if opted-in) | P-16 |

---

## Decision criteria — when to do the swap

The UI is identical whether data comes from mock or Supabase. The swap is mechanical, not architectural. Suggested order:

1. **P-02 first** — set up the three Supabase projects and run migrations before wiring anything
2. **P-04 (new)** — tenant applications + `provision_tenant()` (§0 above) — this now sits before auth in practice, since P-03's "real `user_id`" needs a real tenant to belong to, which onboarding creates
3. **P-03** — wire auth first so every subsequent swap has a real `user_id`
4. **P-05 + P-06** — events, venues, zones, pass types (the catalog)
5. **P-09** — orders + Razorpay (the money path, needs payment testing separately) — replaces `completeMockOrder` (§4) with the real webhook flow
6. **P-10** — pass issuance + QR signing + WhatsApp delivery
7. **P-12** — scanner: manifest RPC + check-in upsert + Realtime + scanner login codes (§6a, new)
8. **P-14 + P-15** — live stats + finance dashboard
9. **P-16** — notification templates

Each step is a diff in `packages/mock-data/src/repo.ts` plus one or more API routes. No component changes required.

---

## Files that become real (currently stubs)

| File | Stub behaviour | Real behaviour | Phase |
|---|---|---|---|
| `apps/scanner/src/lib/crypto.ts` | Accepts any `MG26.v1.*` payload | HMAC-SHA256 verify against server key | P-12 |
| `apps/scanner/src/lib/realtime.ts` | No-ops | Supabase Realtime channels | P-12 |
| `apps/web/src/app/actions/order.ts` | Creates mock order with `createOrder()` from mock-data | Create Supabase order + Razorpay order, return real `orderId` | P-09 |

---

*This document is the single authoritative answer to "where does the database go?" Make the decision, start at P-02, and work down the list.*
