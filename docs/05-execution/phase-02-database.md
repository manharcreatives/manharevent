# Phase 02 — Database Schema & Multi-Tenancy

| | |
|---|---|
| **Phase ID** | `P-02` |
| **Depends on** | `P-00` |
| **Blocks** | `P-03` onward — everything that touches data |
| **Estimated effort** | 20–28 hours |
| **Launch blocking** | ✅ Yes |
| **Reference docs** | `03-architecture/data-model.md`, `03-architecture/security-and-tenancy.md` |

---

## Goal

Stand up Supabase across three environments and implement the **entire** schema from `data-model.md`, with RLS on every table, the core database functions, seed data, and a test suite that proves tenant isolation.

This is the most important phase in the plan. A mistake here is expensive in every later phase.

---

## Deliverables

1. Three Supabase projects: `dev`, `staging`, `prod` (India region)
2. Ordered SQL migrations covering all tables, enums, indexes, constraints
3. RLS enabled and policied on every table
4. Core database functions
5. Generated TypeScript types in `packages/db`
6. Seed script producing a realistic demo tenant
7. RLS isolation test suite

---

## Step-by-step

### 2.1 Projects & CLI
1. Create Supabase projects `manhar-garba-dev`, `-staging`, `-prod`. Region: closest India region available.
2. `supabase init` in the repo; link `dev`.
3. Configure `supabase/config.toml` — enable phone auth, disable email auth signup, set JWT expiry.
4. Store project refs and keys in GitHub Actions secrets and Vercel env.

### 2.2 Enums (migration `0001_enums.sql`)
5. Create every enum from the data model:
   `tenant_status, commission_model, member_role, event_status, reentry_policy, gate_direction, pass_kind, addon_kind, promo_kind, order_status, payment_status, refund_status, ledger_account, pass_status, checkin_direction, checkin_result, wallet_txn_kind, notification_channel`

### 2.3 Tables — in dependency order
Create one migration per group so failures are isolated:

6. `0002_tenancy.sql` — `tenants`, `tenant_branding`, `tenant_commission`, `profiles`, `tenant_members`
7. `0003_events.sql` — `venues`, `events`, `event_nights`, `zones`, `gates`, `gate_zones`, `artists`, `night_lineup`
8. `0004_inventory.sql` — `pass_types`, `price_tiers`, `addons`, `promo_codes`, `inventory_holds`
9. `0005_orders.sql` — `orders`, `order_items`, `payments`, `refunds`, `invoices`, `ledger_entries`, `payouts`
10. `0006_passes.sql` — `passes`, `pass_holders`, `check_ins`, `scanner_devices`
11. `0007_wallet.sql` — `wallets`, `wallet_transactions`, `vendors`
12. `0008_ops.sql` — `notification_templates`, `notifications`, `waitlist_entries`, `announcements`, `event_photos`, `audit_log`, `feature_flags`
13. `0009_indexes.sql` — every index from `data-model.md §8`

**Constraints to not forget:**
- `pass_types.sold_quantity + held_quantity <= total_quantity` (check constraint)
- `orders.total_paise >= 0`
- `check_ins.client_uuid` unique
- `pass_holders (pass_id, holder_index)` unique
- All money columns `bigint`, all `NOT NULL DEFAULT 0`
- Every FK has an explicit `ON DELETE` behaviour — never leave it to the default

### 2.4 The `updated_at` trigger
14. One `set_updated_at()` trigger function, attached to every table with an `updated_at` column.

### 2.5 Append-only enforcement
15. Trigger on `ledger_entries` and `audit_log` that raises on `UPDATE` and `DELETE`.

### 2.6 RLS (migration `0010_rls.sql`)
16. Create `current_tenant_id()` and `has_role(member_role[])` exactly as specified in `security-and-tenancy.md`.
17. `ENABLE ROW LEVEL SECURITY` **and** `FORCE ROW LEVEL SECURITY` on every table.
18. Apply the standard tenant policy to every table.
19. Apply the **narrow anon read policies** to exactly this list and nothing else:
    `events, event_nights, zones, pass_types, price_tiers, artists, night_lineup, venues, tenant_branding`, plus `event_photos WHERE approved = true`.
20. Apply role-scoped policies:
    - `payouts`, `ledger_entries`, `invoices` → `owner | finance`
    - `check_ins` insert → `gate_staff | manager | owner`
    - `wallet_transactions` insert → `vendor | owner`
    - `audit_log` → read `owner`, insert by functions only
21. Write a policy that lets a user always read their **own** `profiles`, `orders`, `passes`, `pass_holders`, `wallets` regardless of tenant (attendees are cross-tenant by nature).

> ⚠️ Attendee access is the trickiest part. Attendees are **not** tenant members. Their access is by `auth.uid()` matching `orders.user_id` / `passes.order_id → orders.user_id`, not by `tenant_id`. Get this right or attendees cannot see their own passes.

### 2.7 Auth hook
22. Create a Postgres function used as a Supabase **custom access token hook** that injects `tenant_id`, `role`, and `tenant_ids[]` into the JWT for tenant members, and nothing extra for plain attendees.
23. Add an RPC `switch_tenant(tenant_id)` that validates membership and triggers token re-issue.

### 2.8 Core functions (migration `0011_functions.sql`)
24. `reserve_inventory(p_pass_type_id, p_qty, p_order_id)` — `SELECT ... FOR UPDATE`, raise `insufficient_inventory` if short, insert `inventory_holds` with a 10-minute TTL.
25. `release_expired_holds()` — deletes expired holds and decrements `held_quantity`.
26. `compute_order_totals(p_order_id)` — the **single source of truth** for money. Computes subtotal from items, applies promo, computes convenience fee from `tenant_commission`, computes GST, writes back to `orders`. Returns the breakdown.
27. `confirm_order(p_order_id)` — one transaction: holds→sold, generate `passes` + `pass_holders`, generate `pass_code` and `qr_payload`, write `ledger_entries`, create `invoices` row, queue `notifications`. Idempotent on already-confirmed orders.
28. `validate_pass(p_pass_code, p_night_id, p_zone_id, p_direction)` — the server mirror of the offline validator. Returns `(result, reason, holder_info)`.
29. `build_scan_manifest(p_event_id, p_night_id)` — returns the compact manifest JSON from `security-and-tenancy.md §2`.
30. `apply_refund(p_refund_id)` — invalidate passes, return inventory, write reversing ledger entries, bump `scanner_devices.manifest_version`.
31. `generate_pass_code()` — collision-resistant short code, excludes ambiguous characters (`0/O`, `1/I/l`).

### 2.9 Scheduled jobs
32. Enable `pg_cron`. Schedule:
    - `release_expired_holds()` — every minute
    - notification queue drain — every minute (calls an edge function)
    - `refresh materialized view` for dashboard aggregates — every 5 minutes during events

### 2.10 Types & client
33. `supabase gen types typescript --linked > packages/db/src/database.types.ts`, wired to a `pnpm db:types` script.
34. Build typed client factories in `packages/db`:
    - `createServerClient()` — cookie-based, for RSC and server actions
    - `createBrowserClient()`
    - `createServiceClient()` — service role, **server-only**, with a runtime guard that throws if imported in a client bundle

### 2.11 Seed data
35. `supabase/seed/seed.sql` creating:
    - 1 tenant "Manhar Creatives" (active), branding, commission 2.5% passed to buyer
    - 1 venue, 1 event "Manhar Navratri 2026", 9 nights with themes and dates
    - 4 zones (VIP, Gold, Silver, General) with capacities
    - 6 gates mapped to zones
    - 8 artists, lineup across the 9 nights
    - 8 pass types covering season/weekend/daily × solo/couple/family × zones
    - Price tiers (early bird + regular) on each
    - 3 add-ons (2W parking, 4W parking, ₹500 F&B wallet)
    - 4 promo codes
    - 200 paid orders with realistic distribution → ~340 passes → ~800 check-ins across nights 1–3
    - 8 team members across all roles
    - A **second tenant** with its own event — required for isolation tests
36. `pnpm db:reset` = migrate + seed.

### 2.12 RLS test suite
37. `packages/db/tests/rls.test.ts` — using two real authenticated clients (tenant A member, tenant B member) plus an anon client:
    - Tenant A member **cannot** read any tenant B row, in every table (loop over the table list)
    - Anon **can** read published events, **cannot** read draft events
    - Anon **cannot** read `orders`, `passes`, `profiles`, `payments`, anything financial
    - `gate_staff` **cannot** read `payouts` or `ledger_entries`
    - `support` **cannot** approve refunds
    - An attendee **can** read their own passes and **cannot** read another attendee's
    - `ledger_entries` UPDATE and DELETE both raise
38. This suite runs in CI against a throwaway Supabase branch. **It gates merge.**

---

## Acceptance criteria

- [ ] `pnpm db:reset` builds the full schema and seed from scratch with no errors
- [ ] Every table has RLS enabled **and** forced — verify with a query against `pg_tables`/`pg_policies`, not by eye
- [ ] The RLS test suite passes, and deliberately breaking one policy makes it fail
- [ ] `reserve_inventory` under 50 concurrent calls for 10 remaining units sells exactly 10 — write a concurrency test
- [ ] `compute_order_totals` matches hand-calculated expected values across 10 fixture cases including promo + fee + GST edge cases
- [ ] `confirm_order` called twice on the same order produces one set of passes
- [ ] Generated types compile and `packages/db` exports a working typed client
- [ ] `createServiceClient()` throws if imported in a client component

---

## Definition of Done

Schema matches `data-model.md` exactly. RLS tests green. Concurrency test proves no overselling. Seed produces a demo tenant a human can look at and believe.

---

## OpenCode prompt

> Read `docs/03-architecture/data-model.md` and `docs/03-architecture/security-and-tenancy.md` in full, then `docs/05-execution/phase-02-database.md`. Execute Phase 02 steps 2.1–2.12. Create migrations in the exact order given, one file per group. Do not simplify the schema. Do not skip RLS on any table. The RLS test suite and the concurrency test are mandatory before you report done.
