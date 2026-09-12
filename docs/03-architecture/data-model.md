# 06 · Data Model — Postgres Schema

> Source of truth for all migrations. Every table: `tenant_id`, RLS enabled, `created_at`, `updated_at`.
> Money is **integer paise**. Never float, never `numeric` for currency in application code.

---

## 0. Conventions

```sql
-- every table
id           uuid primary key default gen_random_uuid()
tenant_id    uuid not null references tenants(id) on delete cascade
created_at   timestamptz not null default now()
updated_at   timestamptz not null default now()
deleted_at   timestamptz                          -- soft delete where relevant
```

Enums are Postgres `enum` types. Every enum change is a migration.

---

## 1. Tenancy & identity

```sql
create table tenants (
  id            uuid pk,
  slug          text unique not null,          -- "manhar"
  legal_name    text not null,
  display_name  text not null,
  status        tenant_status not null default 'pending',  -- pending|active|suspended
  gstin         text,
  pan           text,
  support_phone text,
  support_email text,
  created_at, updated_at
);

create table tenant_branding (
  tenant_id       uuid pk references tenants,
  logo_url        text,
  logo_dark_url   text,
  favicon_url     text,
  primary_color   text,                        -- hex
  accent_color    text,
  custom_domain   text unique,
  domain_verified boolean default false,
  meta_title      text,
  meta_description text
);

create table tenant_commission (
  tenant_id           uuid pk references tenants,
  model               commission_model not null,  -- flat|percent|hybrid
  percent_bps         integer default 0,          -- basis points, 250 = 2.5%
  flat_paise          bigint default 0,
  passed_to_buyer     boolean default true,       -- convenience fee vs absorbed
  min_fee_paise       bigint default 0,
  max_fee_paise       bigint
);

create table profiles (                            -- extends auth.users
  id            uuid pk references auth.users,
  phone         text unique not null,
  full_name     text,
  email         text,
  photo_url     text,
  locale        text default 'en',               -- en|hi|gu
  created_at, updated_at
);

create table tenant_members (
  id          uuid pk,
  tenant_id   uuid not null,
  user_id     uuid not null references profiles,
  role        member_role not null,   -- owner|manager|finance|support|gate_staff|vendor|sponsor|artist
  status      text default 'active',
  invited_by  uuid,
  unique (tenant_id, user_id)
);
```

`member_role` drives every RLS policy and every UI permission gate.

---

## 1a. Tenant applications (pre-tenant onboarding — added by the 2026-09-12 pivot)

> **Convention exception:** this table has no `tenant_id` — an application, by definition, exists *before* any tenant does. It is readable/writable only by the internal-ops role (`profiles` rows with a superadmin flag or a dedicated `internal_ops_members` table — not modeled yet, tracked as an open item), never by tenant-scoped RLS.

```sql
create type tenant_application_status as enum (
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'more_info_needed'
);

create table tenant_applications (
  id                      uuid primary key default gen_random_uuid(),
  org_name                text not null,
  contact_name            text not null,
  phone                   text not null,
  city                    text not null,
  rough_capacity          integer,
  desired_domain          text not null,          -- becomes tenants.slug / tenant_branding.custom_domain prefix
  status                  tenant_application_status not null default 'draft',
  rejection_reason        text,                    -- also used for the "more info needed" message
  submitted_at            timestamptz,
  decided_at              timestamptz,
  provisioned_at          timestamptz,
  provisioned_tenant_id   uuid references tenants(id),  -- set once provision_tenant() runs
  reviewed_by             uuid references profiles(id), -- not in the FE-08/FE-10 mock; real backend should capture this
  created_at, updated_at
);

create index on tenant_applications (status, submitted_at desc);
```

**Reconciliation note (FE-11, 2026-09-12):** FE-08 built full mock CRUD (`submitApplication`, `listApplications`, `getApplication`) and FE-10 built the consuming internal-ops UI (`approveApplication`, `rejectApplication`) against an in-memory array shaped exactly like this table — so the open question this doc used to carry ("does `TenantApplication` need its own table?") is resolved: **yes**, as modeled above. See `HANDOFF-TO-BACKEND.md` §0 for the wire-up, and §9 below for the new `provision_tenant()` function this table requires — the mock `approveApplication` only flips status/timestamps and does **not** actually create a tenant, which the real implementation must.

---

## 2. Events, venues, zones, gates

```sql
create table venues (
  id, tenant_id,
  name          text not null,
  address       text,
  city          text not null,
  state         text,
  pincode       text,
  lat           numeric(9,6),
  lng           numeric(9,6),
  google_maps_url text,
  map_image_url text,
  total_capacity integer
);

create table events (
  id, tenant_id,
  venue_id      uuid references venues,
  slug          text not null,                  -- "manhar-navratri-2026"
  title         text not null,
  subtitle      text,
  description   text,                           -- rich text (tiptap JSON)
  status        event_status not null default 'draft', -- draft|published|live|ended|cancelled
  starts_on     date not null,
  ends_on       date not null,
  timezone      text default 'Asia/Kolkata',
  cover_url     text,
  og_image_url  text,
  category      text default 'garba',
  reentry_policy reentry_policy default 'unlimited', -- none|once|unlimited
  reentry_window_minutes integer,
  published_at  timestamptz,
  unique (tenant_id, slug)
);

create table event_nights (
  id, tenant_id,
  event_id      uuid not null references events,
  night_number  integer not null,               -- 1..9
  date          date not null,
  gates_open_at timestamptz,
  starts_at     timestamptz,
  ends_at       timestamptz,
  theme         text,                           -- "Red Night"
  theme_color   text,
  dress_code    text,
  notes         text,
  status        text default 'scheduled',
  unique (event_id, night_number)
);

create table zones (
  id, tenant_id,
  event_id      uuid not null references events,
  code          text not null,                  -- "GOLD"
  name          text not null,
  description   text,
  capacity      integer not null,
  color         text,
  sort_order    integer default 0,
  unique (event_id, code)
);

create table gates (
  id, tenant_id,
  event_id      uuid not null references events,
  code          text not null,                  -- "G1"
  name          text not null,
  direction     gate_direction default 'entry', -- entry|exit|both
  unique (event_id, code)
);

create table gate_zones (                        -- which zones a gate serves
  gate_id  uuid references gates,
  zone_id  uuid references zones,
  primary key (gate_id, zone_id)
);

create table artists (
  id, tenant_id,
  slug        text not null,
  name        text not null,
  bio         text,
  photo_url   text,
  instagram   text,
  youtube     text,
  unique (tenant_id, slug)
);

create table night_lineup (
  id, tenant_id,
  night_id    uuid references event_nights,
  artist_id   uuid references artists,
  slot_start  timestamptz,
  slot_end    timestamptz,
  billing     integer default 0                 -- headline order
);
```

---

## 3. Pass types, pricing, inventory

```sql
create table pass_types (
  id, tenant_id,
  event_id        uuid not null references events,
  zone_id         uuid not null references zones,
  code            text not null,                -- "SEASON_COUPLE_GOLD"
  name            text not null,                -- "Season Couple Pass — Gold"
  description     text,
  kind            pass_kind not null,           -- season|weekend|daily|single_night
  admits          integer not null default 1,   -- people this pass lets in
  night_ids       uuid[] not null,              -- which nights it covers
  total_quantity  integer not null,             -- inventory
  sold_quantity   integer not null default 0,
  held_quantity   integer not null default 0,   -- in-flight carts
  min_per_order   integer default 1,
  max_per_order   integer default 10,
  sale_starts_at  timestamptz,
  sale_ends_at    timestamptz,
  requires_photo  boolean default false,
  is_transferable boolean default true,
  status          text default 'draft',         -- draft|on_sale|paused|sold_out|ended
  sort_order      integer default 0,
  unique (event_id, code)
);

create table price_tiers (
  id, tenant_id,
  pass_type_id  uuid not null references pass_types,
  name          text not null,                  -- "Early Bird"
  price_paise   bigint not null,
  starts_at     timestamptz,
  ends_at       timestamptz,
  quantity_cap  integer,                        -- switch after N sold
  quantity_sold integer default 0,
  sort_order    integer default 0
);

create table addons (
  id, tenant_id,
  event_id      uuid not null references events,
  code          text not null,                  -- "PARKING_4W"
  name          text not null,
  kind          addon_kind not null,            -- parking|wallet_topup|merchandise
  price_paise   bigint not null,
  wallet_credit_paise bigint,                   -- for wallet_topup
  total_quantity integer,
  sold_quantity integer default 0,
  zone_id       uuid references zones,          -- parking zone
  status        text default 'on_sale',
  unique (event_id, code)
);

create table promo_codes (
  id, tenant_id,
  event_id        uuid references events,       -- null = all events
  code            text not null,
  kind            promo_kind not null,          -- percent|flat|bogo
  value_bps       integer,                      -- for percent
  value_paise     bigint,                       -- for flat
  min_order_paise bigint default 0,
  max_discount_paise bigint,
  usage_limit     integer,
  usage_count     integer default 0,
  per_user_limit  integer default 1,
  applicable_pass_type_ids uuid[],
  starts_at       timestamptz,
  ends_at         timestamptz,
  owner_label     text,                         -- influencer/partner attribution
  status          text default 'active',
  unique (tenant_id, code)
);

create table inventory_holds (                   -- prevents overselling during checkout
  id, tenant_id,
  pass_type_id  uuid references pass_types,
  addon_id      uuid references addons,
  order_id      uuid,
  quantity      integer not null,
  expires_at    timestamptz not null
);
```

**Overselling rule:** every quantity change goes through a Postgres function with `SELECT ... FOR UPDATE` on the `pass_types` row. Never an application-level read-modify-write.

---

## 4. Orders, payments, money

```sql
create table orders (
  id, tenant_id,
  event_id          uuid not null references events,
  order_number      text unique not null,       -- human-readable "MG26-000123"
  user_id           uuid references profiles,
  buyer_phone       text not null,
  buyer_name        text,
  buyer_email       text,
  status            order_status not null default 'draft',
                    -- draft|pending_payment|paid|failed|cancelled|refunded|partially_refunded
  subtotal_paise    bigint not null default 0,
  discount_paise    bigint not null default 0,
  convenience_fee_paise bigint not null default 0,
  gst_paise         bigint not null default 0,
  total_paise       bigint not null default 0,
  promo_code_id     uuid references promo_codes,
  utm_source        text, utm_medium text, utm_campaign text, utm_content text,
  referrer_code     text,
  ip_address        inet,
  user_agent        text,
  expires_at        timestamptz,
  paid_at           timestamptz
);

create table order_items (
  id, tenant_id,
  order_id      uuid not null references orders,
  pass_type_id  uuid references pass_types,
  addon_id      uuid references addons,
  price_tier_id uuid references price_tiers,
  quantity      integer not null,
  unit_price_paise bigint not null,
  line_total_paise bigint not null,
  gst_rate_bps  integer not null default 1800   -- 18%
);

create table payments (
  id, tenant_id,
  order_id            uuid not null references orders,
  provider            text not null default 'razorpay',
  provider_order_id   text,
  provider_payment_id text,
  provider_signature  text,
  method              text,                     -- upi|card|netbanking|wallet
  amount_paise        bigint not null,
  status              payment_status not null,  -- created|authorized|captured|failed|refunded
  failure_reason      text,
  raw_payload         jsonb,
  captured_at         timestamptz
);

create table refunds (
  id, tenant_id,
  order_id          uuid not null references orders,
  pass_ids          uuid[],
  requested_by      uuid references profiles,
  approved_by       uuid references profiles,
  reason            text,
  policy_snapshot   jsonb,                      -- what the policy said at the time
  amount_paise      bigint not null,
  status            refund_status not null,     -- requested|approved|rejected|processing|completed|failed
  provider_refund_id text,
  requested_at, resolved_at timestamptz
);

create table invoices (
  id, tenant_id,
  order_id        uuid not null references orders,
  invoice_number  text unique not null,
  gstin           text,
  place_of_supply text,
  hsn_sac         text default '998554',
  taxable_paise   bigint not null,
  cgst_paise      bigint default 0,
  sgst_paise      bigint default 0,
  igst_paise      bigint default 0,
  total_paise     bigint not null,
  pdf_url         text,
  issued_at       timestamptz
);

create table ledger_entries (                    -- double-entry, append-only
  id, tenant_id,
  event_id      uuid,
  order_id      uuid,
  account       ledger_account not null,        -- gross_sales|platform_fee|gst_payable|refunds|payout|gateway_fee
  direction     text not null,                  -- debit|credit
  amount_paise  bigint not null,
  reference     text,
  occurred_at   timestamptz not null default now()
);

create table payouts (
  id, tenant_id,
  event_id        uuid references events,
  period_start    date, period_end date,
  gross_paise     bigint, fee_paise bigint, gst_paise bigint,
  tds_paise       bigint default 0,
  net_paise       bigint,
  status          text default 'pending',       -- pending|processing|paid|failed
  utr             text,
  paid_at         timestamptz
);
```

`ledger_entries` is **append-only** — enforced by a trigger that rejects `UPDATE` and `DELETE`.

---

## 5. Passes, holders, check-ins

```sql
create table passes (
  id, tenant_id,
  event_id        uuid not null references events,
  order_id        uuid not null references orders,
  order_item_id   uuid not null references order_items,
  pass_type_id    uuid not null references pass_types,
  zone_id         uuid not null references zones,
  pass_code       text unique not null,         -- short human code "MG26-7QK4-2X"
  qr_payload      text not null,                -- HMAC-signed compact payload
  admits          integer not null,
  night_ids       uuid[] not null,
  status          pass_status not null default 'active',
                  -- active|used_up|refunded|cancelled|blocked|transferred
  issued_at       timestamptz default now(),
  pdf_url         text,
  wallet_pass_url text,
  blocked_reason  text
);

create table pass_holders (                      -- one row per admit
  id, tenant_id,
  pass_id       uuid not null references passes,
  holder_index  integer not null,               -- 1..admits
  full_name     text,
  phone         text,
  photo_url     text,
  age_band      text,
  invite_code   text unique,                    -- for group fill-in links
  filled_at     timestamptz,
  unique (pass_id, holder_index)
);

create table check_ins (
  id, tenant_id,
  event_id      uuid not null,
  night_id      uuid not null references event_nights,
  pass_id       uuid not null references passes,
  pass_holder_id uuid references pass_holders,
  gate_id       uuid references gates,
  zone_id       uuid references zones,
  direction     checkin_direction not null,     -- in|out
  result        checkin_result not null,        -- allowed|denied|override
  denied_reason text,
  scanned_by    uuid references profiles,
  device_id     text,
  scanned_at    timestamptz not null,
  synced_at     timestamptz,
  client_uuid   text unique                     -- idempotency key from the offline device
);

create table scanner_devices (
  id, tenant_id,
  event_id      uuid,
  device_id     text not null,
  label         text,
  assigned_user uuid references profiles,
  gate_id       uuid references gates,
  last_sync_at  timestamptz,
  manifest_version integer,
  status        text default 'active',
  unique (tenant_id, device_id)
);

-- Added by the 2026-09-12 pivot (FE-10): "gate-scanner access issued only
-- from the admin panel, never self-registered" (02-product/user-flows.md's
-- Surface-3 note) needs a real credential row to issue. This is what
-- apps/dashboard's Team page's "Issue scanner login" button writes to once
-- wired — see HANDOFF-TO-BACKEND.md §5a. Distinct from scanner_devices
-- above, which tracks a physical/browser device once it's logged in; this
-- table is the short-lived login code a gate-staff member types in to get
-- there.
create table scanner_login_codes (
  id, tenant_id,
  tenant_member_id  uuid not null references tenant_members,
  code_hash         text not null,           -- hash the 6-char code; never store it plaintext
  gate_label        text,
  issued_at         timestamptz not null default now(),
  revoked_at        timestamptz,
  last_used_at      timestamptz
);
```

**`client_uuid` is the key to offline safety.** The device generates it; the server upserts on it. Replays are idempotent.

---

## 6. Wallet (F&B) & vendors

```sql
create table wallets (
  id, tenant_id,
  event_id      uuid not null,
  user_id       uuid references profiles,
  pass_id       uuid references passes,
  balance_paise bigint not null default 0,
  status        text default 'active'
);

create table wallet_transactions (
  id, tenant_id,
  wallet_id     uuid not null references wallets,
  kind          wallet_txn_kind not null,       -- topup|spend|refund|adjustment
  amount_paise  bigint not null,
  vendor_id     uuid references vendors,
  order_id      uuid,
  balance_after_paise bigint not null,
  device_id     text,
  client_uuid   text unique,
  occurred_at   timestamptz not null default now(),
  synced_at     timestamptz
);

create table vendors (
  id, tenant_id,
  event_id      uuid not null,
  name          text not null,
  stall_code    text,
  category      text,                            -- food|beverage|merch|games
  owner_user_id uuid references profiles,
  commission_bps integer default 0,
  status        text default 'active'
);
```

---

## 7. Communications, content, ops

```sql
create table notification_templates (
  id, tenant_id,
  channel   notification_channel not null,      -- whatsapp|sms|email|push
  key       text not null,                      -- pass_delivered|night_reminder|refund_approved
  locale    text not null default 'en',
  provider_template_name text,                  -- WhatsApp approved template
  subject   text,
  body      text not null,
  variables jsonb,
  unique (tenant_id, channel, key, locale)
);

create table notifications (
  id, tenant_id,
  channel       notification_channel not null,
  template_key  text,
  recipient     text not null,
  payload       jsonb,
  status        text default 'queued',          -- queued|sent|delivered|read|failed
  provider_message_id text,
  error         text,
  scheduled_for timestamptz,
  sent_at, delivered_at timestamptz,
  order_id, pass_id uuid
);

create table waitlist_entries (
  id, tenant_id,
  event_id, pass_type_id uuid,
  phone       text not null,
  quantity    integer default 1,
  status      text default 'waiting',           -- waiting|offered|converted|expired
  offered_at, expires_at timestamptz
);

create table announcements (
  id, tenant_id,
  event_id    uuid not null,
  night_id    uuid,
  kind        text default 'info',              -- info|urgent|lost_person|emergency
  title       text not null,
  body        text,
  target      text default 'all',               -- all|staff|zone
  zone_id     uuid,
  created_by  uuid references profiles,
  expires_at  timestamptz
);

create table event_photos (
  id, tenant_id,
  event_id, night_id uuid,
  url           text not null,
  thumb_url     text,
  uploaded_by   uuid references profiles,
  face_vectors  jsonb,                          -- for "find my photos" (Phase 20)
  approved      boolean default false
);

create table audit_log (                        -- append-only
  id, tenant_id,
  actor_id     uuid,
  actor_role   text,
  action       text not null,                   -- "refund.approve"
  entity_type  text not null,
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  ip_address   inet,
  occurred_at  timestamptz not null default now()
);

create table feature_flags (
  id, tenant_id,
  key       text not null,
  enabled   boolean default false,
  payload   jsonb,
  unique (tenant_id, key)
);
```

---

## 8. Key indexes

```sql
create index on passes (event_id, status);
create index on passes (pass_code);
create index on check_ins (event_id, night_id, pass_id);
create index on check_ins (scanned_at desc);
create index on orders (tenant_id, status, created_at desc);
create index on orders (buyer_phone);
create index on order_items (order_id);
create index on pass_holders (pass_id);
create index on wallet_transactions (wallet_id, occurred_at desc);
create index on notifications (status, scheduled_for) where status = 'queued';
create index on inventory_holds (expires_at) where expires_at is not null;
create index on events (tenant_id, status, starts_on);
create index on ledger_entries (tenant_id, event_id, account);
```

---

## 9. Critical database functions

| Function | Purpose |
|---|---|
| `reserve_inventory(pass_type_id, qty, order_id)` | Row-locked hold creation; raises on insufficient stock |
| `release_expired_holds()` | Cron every minute |
| `confirm_order(order_id)` | Atomically: holds → sold, generate passes, write ledger, queue notifications |
| `compute_order_totals(order_id)` | Subtotal, promo, convenience fee, GST — single source of truth |
| `validate_pass(pass_code, night_id, zone_id, direction)` | Server-side mirror of the offline validator |
| `build_scan_manifest(event_id, night_id)` | Compact signed manifest for offline devices |
| `apply_refund(refund_id)` | Invalidate passes, return inventory, write ledger, bump manifest version |
| `current_tenant_id()` | Reads `tenant_id` from JWT — used by every RLS policy |
| `provision_tenant(application_id)` | **New (FE-11 reconciliation).** Atomically: insert `tenants` row from the application's `org_name`/`desired_domain`, seed default `tenant_branding` + `tenant_commission`, create the first `tenant_members` owner row (needs the applicant's `profiles` row to exist — see the open item below), set `tenant_applications.status = 'approved'`, `provisioned_tenant_id`, `provisioned_at`. Called from the internal-ops "Approve & provision" action; the mock version (`approveApplication` in `packages/mock-data/src/repo.ts`) only flips status/timestamps and creates nothing, so this function is genuinely new work, not a swap |

---

## 10. Migration discipline

- Migrations are **forward-only**, numbered, and never edited after merge.
- Every migration has a corresponding down-note in a comment (for humans, not automation).
- Every RLS policy has a test in `packages/db/tests/rls.test.ts` asserting a user of tenant A cannot read tenant B.
- Seed data lives in `supabase/seed/` and creates: 1 tenant, 1 event, 9 nights, 3 zones, 4 gates, 6 pass types, 200 fake orders. Required for every phase after 02.

---

## 11. Open items flagged during FE-11 reconciliation (2026-09-12)

Not blocking the frontend-first track, but real backend work should resolve these before implementing the functions above:

- **Internal-ops / superadmin role isn't modeled.** `tenant_applications` and the `/admin/*` routes it powers need a way to say "this profile can see every tenant's applications" that isn't `member_role` (which is always scoped to one `tenant_id`). Needs its own table or a boolean/role column on `profiles`.
- **`provision_tenant()` assumes the applicant already has a `profiles` row**, i.e. has completed phone/OTP signup before or during application review. FE-08's registration flow (`apps/marketing`) collects contact info but the actual auth signup step for that contact isn't modeled yet — confirm the order of operations (signup before submit, or invite-after-approve) before writing this function.
- **`scanner_login_codes` has no consuming endpoint yet.** FE-10 built the issue/revoke UI (`apps/dashboard`'s Team page) but `apps/scanner` still runs its own separate mock store with no login screen that checks these codes — a `/scan/login` route and its verify endpoint are new work, not a swap.
