/**
 * In-memory repository layer.
 *
 * Every function is `async` and named to match its eventual Supabase-backed
 * counterpart. The body resolves instantly from module-level fixtures.
 * Swapping a body for a Supabase call in FE-07 touches zero call sites.
 *
 * FE-07 handoff pattern for each function:
 *   // replace body with: return supabase.from('table').select().eq(...).single()
 */

import type {
  Tenant, TenantBranding,
  Event, EventNight, Venue, Zone, Gate, Artist, NightLineup,
  PassType, PriceTier, AddOn, PromoCode,
  Order, OrderItem, Payment, Refund,
  Pass, PassHolder, CheckIn,
  TenantApplication, TenantApplicationStatus,
  Paise,
} from "@manhar-garba/domain";
import { paise, refundPercentFor } from "@manhar-garba/domain";

import { tenant, tenantBranding } from "./fixtures/tenant";
import { event, eventNights, venue, zones, gates, artists, nightLineup } from "./fixtures/event";
import { passTypes, priceTiers, addons, promoCodes } from "./fixtures/pass-types";
import { orders, orderItems, payments } from "./fixtures/orders";
import { passes, passHolders, checkIns } from "./fixtures/passes";
import { tenantApplications } from "./fixtures/tenant-applications";
import { findEventContent } from "./fixtures/event-content";
import { groupInvites } from "./fixtures/group-invites";

// ─── In-memory mutation store ─────────────────────────────────────────────────
// Reset on server restart — expected and fine for the mock stage.
//
// Pinned to `globalThis`, deliberately. Next.js bundles a Server Action and the
// page that renders its result into SEPARATE server bundles, and each bundle
// gets its own instance of this module. With plain module-level arrays, the
// order that `createOrder` pushed from a Server Action simply did not exist for
// the `getOrder` running in the page bundle — so /checkout/<new order> answered
// 404 and the entire buy flow dead-ended one click after "Continue to Pay".
// One object on `globalThis` gives every bundle in the process the same store.
// (This is the same singleton trick a real Prisma/Supabase client needs here,
// and it is why the fix survives the swap to a real backend.)
//
// Still true, and unchanged by this: each app (web, dashboard, marketing,
// scanner) is its own Node process, so the store is NOT shared BETWEEN apps.
// A real Postgres at P-02 is what makes that true.

interface MockStore {
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  passes: Pass[];
  checkIns: CheckIn[];
  tenantApplications: TenantApplication[];
  passHolders: PassHolder[];
  refunds: Refund[];
  orderSeq: number;
  orderItemSeq: number;
  applicationSeq: number;
  refundSeq: number;
}

const STORE_KEY = Symbol.for("@manhar-garba/mock-data.store");
type GlobalWithStore = typeof globalThis & { [STORE_KEY]?: MockStore };

function createStore(): MockStore {
  return {
    orders: [...orders],
    orderItems: [...orderItems],
    payments: [...payments],
    passes: [...passes],
    checkIns: [...checkIns],
    tenantApplications: [...tenantApplications],
    // Mutable so a friend joining a group invite shows up on the next read.
    passHolders: [...passHolders],
    refunds: [],
    orderSeq: 200,
    orderItemSeq: 200,
    applicationSeq: 100,
    refundSeq: 0,
  };
}

const store: MockStore =
  ((globalThis as GlobalWithStore)[STORE_KEY] ??= createStore());

// Array aliases: same references as the store, so every mutation below lands in
// the one shared object without rewriting hundreds of call sites.
const _orders = store.orders;
const _orderItems = store.orderItems;
const _payments = store.payments;
const _passes = store.passes;
const _checkIns = store.checkIns;
const _tenantApplications = store.tenantApplications;
const _passHolders = store.passHolders;

// ─── Tenant ───────────────────────────────────────────────────────────────────

/** FE-07 handoff: supabase.from('tenants').select().eq('slug', slug).single() */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return tenant.slug === slug ? tenant : null;
}

/** FE-07 handoff: supabase.from('tenant_branding').select().eq('tenant_id', id).single() */
export async function getTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  return tenantBranding.tenant_id === tenantId ? tenantBranding : null;
}

// ─── Events ───────────────────────────────────────────────────────────────────

/** FE-07 handoff: supabase.from('events').select().eq('slug', slug).single() */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  return event.slug === slug ? event : null;
}

/** FE-07 handoff: supabase.from('events').select().eq('id', id).single()
 *  Added FE-11 for /me/passes, which only has an order's event_id to work
 *  from, not its slug. */
export async function getEvent(id: string): Promise<Event | null> {
  return event.id === id ? event : null;
}

/** FE-07 handoff: supabase.from('events').select().eq('tenant_id', tenantId).eq('status', 'published') */
export async function listPublishedEvents(tenantId: string): Promise<Event[]> {
  void tenantId;
  return [event];
}

/** FE-07 handoff: supabase.from('venues').select().eq('id', id).single() */
export async function getVenue(id: string): Promise<Venue | null> {
  return venue.id === id ? venue : null;
}

/** FE-07 handoff: supabase.from('event_nights').select().eq('event_id', eventId).order('night_number') */
export async function listEventNights(eventId: string): Promise<EventNight[]> {
  return eventNights.filter((n) => n.event_id === eventId);
}

/** FE-07 handoff: supabase.from('event_nights').select().eq('id', id).single() */
export async function getEventNight(id: string): Promise<EventNight | null> {
  return eventNights.find((n) => n.id === id) ?? null;
}

/** FE-07 handoff: supabase.from('zones').select().eq('event_id', eventId).order('sort_order') */
export async function listZones(eventId: string): Promise<Zone[]> {
  return zones.filter((z) => z.event_id === eventId);
}

/** FE-07 handoff: supabase.from('gates').select().eq('event_id', eventId) */
export async function listGates(eventId: string): Promise<Gate[]> {
  return gates.filter((g) => g.event_id === eventId);
}

/** FE-07 handoff: supabase.from('artists').select().eq('tenant_id', tenantId) */
export async function listArtists(tenantId: string): Promise<Artist[]> {
  return artists.filter((a) => a.tenant_id === tenantId);
}

/** FE-07 handoff: supabase.from('night_lineup').select('*,artists(*)').eq('night_id', nightId) */
export async function listLineupForNight(nightId: string): Promise<NightLineup[]> {
  return nightLineup.filter((l) => l.night_id === nightId);
}

// ─── Pass types & pricing ─────────────────────────────────────────────────────

/** FE-07 handoff: supabase.from('pass_types').select().eq('event_id', eventId).order('sort_order') */
export async function listPassTypes(eventId: string): Promise<PassType[]> {
  return passTypes.filter((pt) => pt.event_id === eventId);
}

/** FE-07 handoff: supabase.from('pass_types').select().eq('event_id', eventId).eq('zone_id', zoneId) */
export async function listPassTypesForZone(eventId: string, zoneId: string): Promise<PassType[]> {
  return passTypes.filter((pt) => pt.event_id === eventId && pt.zone_id === zoneId);
}

/** FE-07 handoff: supabase.from('price_tiers').select().eq('pass_type_id', passTypeId).order('sort_order') */
export async function listPriceTiers(passTypeId: string): Promise<PriceTier[]> {
  return priceTiers.filter((t) => t.pass_type_id === passTypeId);
}

/**
 * Cheapest live price in a zone, across every pass type in it.
 *
 * The public "from ₹X" figures used to be a hardcoded lookup table in
 * `zone-cards-section.tsx`, which meant the price a visitor saw on the event
 * page and the price they were charged at checkout came from two different
 * places and could silently disagree. This makes the price tiers the only
 * source, so editing a tier in the dashboard moves the public number too.
 *
 * Returns `null` when a zone has nothing on sale — the caller should say so
 * rather than print a misleading ₹0.
 *
 * FE-07 handoff: a `min(price_paise)` join across pass_types and price_tiers.
 */
export async function getZoneFromPrice(eventId: string, zoneId: string): Promise<Paise | null> {
  const zonePassTypes = passTypes.filter(
    (pt) => pt.event_id === eventId && pt.zone_id === zoneId && pt.status === "on_sale"
  );
  const prices = zonePassTypes.flatMap((pt) =>
    priceTiers.filter((t) => t.pass_type_id === pt.id).map((t) => t.price_paise)
  );
  return prices.length > 0 ? (Math.min(...prices) as Paise) : null;
}

/** FE-07 handoff: supabase.from('addons').select().eq('event_id', eventId) */
export async function listAddons(eventId: string): Promise<AddOn[]> {
  return addons.filter((a) => a.event_id === eventId);
}

/** FE-07 handoff: supabase.from('promo_codes').select().eq('tenant_id', tenantId).eq('code', code).single() */
export async function getPromoCode(tenantId: string, code: string): Promise<PromoCode | null> {
  return promoCodes.find((p) => p.tenant_id === tenantId && p.code === code) ?? null;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/** FE-07 handoff: supabase.from('orders').select().eq('id', id).single() */
export async function getOrder(id: string): Promise<Order | null> {
  return _orders.find((o) => o.id === id) ?? null;
}

/** FE-07 handoff: supabase.from('orders').select().eq('buyer_phone', phone).order('created_at', {ascending:false}) */
export async function listOrdersByPhone(phone: string): Promise<Order[]> {
  // FE-11 fix: the handoff comment above always promised newest-first, but
  // this never actually sorted — /me/passes (new, FE-11) is the first real
  // consumer where that ordering is user-visible.
  return _orders
    .filter((o) => o.buyer_phone === phone)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** FE-07 handoff: supabase.from('order_items').select().eq('order_id', orderId) */
export async function listOrderItems(orderId: string): Promise<OrderItem[]> {
  return _orderItems.filter((oi) => oi.order_id === orderId);
}

/** FE-07 handoff: supabase.from('payments').select().eq('order_id', orderId) */
export async function listPayments(orderId: string): Promise<Payment[]> {
  return _payments.filter((p) => p.order_id === orderId);
}

/**
 * Creates a draft order in the in-memory store.
 * FE-07 handoff: supabase.from('orders').insert({...}).select().single()
 */
export async function createOrder(
  input: Pick<Order, "tenant_id" | "event_id" | "buyer_phone" | "buyer_name" | "buyer_email">
): Promise<Order> {
  const now = new Date().toISOString();
  const seq = String(++store.orderSeq).padStart(6, "0");
  const order: Order = {
    id: `ord-mock-${seq}`,
    order_number: `MG26-0${seq}`,
    status: "draft",
    subtotal_paise: paise(0),
    discount_paise: paise(0),
    convenience_fee_paise: paise(0),
    gst_paise: paise(0),
    total_paise: paise(0),
    user_id: null,
    promo_code_id: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    referrer_code: null,
    ip_address: null,
    user_agent: null,
    expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    paid_at: null,
    created_at: now,
    updated_at: now,
    ...input,
  };
  _orders.push(order);
  return order;
}

export interface CompleteMockOrderInput {
  orderId: string;
  passTypeId: string;
  zoneId: string;
  quantity: number;
  admitsPerPass: number;
  nightIds: string[];
  unitPricePaise: number;
  subtotalPaise: number;
  platformFeePaise: number;
  gatewayFeePaise: number;
  gstPaise: number;
  totalPaise: number;
}

/**
 * Marks a draft order as paid, records a mock Razorpay payment, and issues
 * one Pass per unit of quantity. This is the mock stand-in for the real
 * payment-webhook → pass-issuance pipeline (2026-09-12 FE-09 pivot — the
 * book/checkout flow existed as orphaned components before this, with no
 * page ever calling anything past `createOrder`).
 * FE-07 handoff: Razorpay webhook handler does this same order→paid,
 * order_items insert, payments insert, passes insert sequence, driven by a
 * verified payment signature instead of a client "pay" click.
 */
export async function completeMockOrder(
  input: CompleteMockOrderInput
): Promise<{ order: Order; passes: Pass[] }> {
  const order = _orders.find((o) => o.id === input.orderId);
  if (!order) throw new Error(`completeMockOrder: order ${input.orderId} not found`);

  const now = new Date().toISOString();
  order.status = "paid";
  order.subtotal_paise = paise(input.subtotalPaise);
  order.convenience_fee_paise = paise(input.platformFeePaise + input.gatewayFeePaise);
  order.gst_paise = paise(input.gstPaise);
  order.total_paise = paise(input.totalPaise);
  order.paid_at = now;
  order.updated_at = now;

  const seq = String(++store.orderItemSeq).padStart(6, "0");

  _orderItems.push({
    id: `oi-mock-${seq}`,
    tenant_id: order.tenant_id,
    order_id: order.id,
    pass_type_id: input.passTypeId,
    addon_id: null,
    price_tier_id: null,
    quantity: input.quantity,
    unit_price_paise: paise(input.unitPricePaise),
    line_total_paise: paise(input.subtotalPaise),
    gst_rate_bps: 1800,
    created_at: now,
    updated_at: now,
  });

  _payments.push({
    id: `pay-mock-${seq}`,
    tenant_id: order.tenant_id,
    order_id: order.id,
    provider: "razorpay",
    provider_order_id: `order_mock_${seq}`,
    provider_payment_id: `pay_mock_${seq}`,
    provider_signature: null,
    method: "upi",
    amount_paise: paise(input.totalPaise),
    status: "captured",
    failure_reason: null,
    raw_payload: null,
    captured_at: now,
    created_at: now,
    updated_at: now,
  });

  const newPasses: Pass[] = [];
  for (let i = 0; i < input.quantity; i++) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X");
    const passId = `pass-mock-${seq}-${i}`;
    const pass: Pass = {
      id: passId,
      tenant_id: order.tenant_id,
      event_id: order.event_id,
      order_id: order.id,
      order_item_id: `oi-mock-${seq}`,
      pass_type_id: input.passTypeId,
      zone_id: input.zoneId,
      pass_code: `MG26-${suffix}-${seq.slice(-4)}${i}`,
      qr_payload: `MG26.v1.${passId}.HMAC_STUB`,
      admits: input.admitsPerPass,
      night_ids: input.nightIds,
      status: "active",
      issued_at: now,
      pdf_url: null,
      wallet_pass_url: null,
      blocked_reason: null,
      created_at: now,
      updated_at: now,
    };
    _passes.push(pass);
    newPasses.push(pass);
  }

  return { order, passes: newPasses };
}

// ─── Passes ───────────────────────────────────────────────────────────────────

/** FE-07 handoff: supabase.from('passes').select().eq('id', id).single() */
export async function getPass(id: string): Promise<Pass | null> {
  return _passes.find((p) => p.id === id) ?? null;
}

/** FE-07 handoff: supabase.from('passes').select().eq('pass_code', code).single() */
export async function getPassByCode(code: string): Promise<Pass | null> {
  return _passes.find((p) => p.pass_code === code) ?? null;
}

/** FE-07 handoff: supabase.from('passes').select().eq('order_id', orderId) */
export async function listPassesForOrder(orderId: string): Promise<Pass[]> {
  return _passes.filter((p) => p.order_id === orderId);
}

/** FE-07 handoff: supabase.from('passes').select().eq('event_id', eventId).eq('status', 'active') */
export async function listActivePassesForEvent(eventId: string): Promise<Pass[]> {
  return _passes.filter((p) => p.event_id === eventId && p.status === "active");
}

/** FE-07 handoff: supabase.from('pass_holders').select().eq('pass_id', passId) */
export async function listPassHolders(passId: string): Promise<PassHolder[]> {
  return _passHolders.filter((ph) => ph.pass_id === passId);
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

/** FE-07 handoff: supabase.from('check_ins').select().eq('pass_id', passId).eq('night_id', nightId).eq('direction','in') */
export async function countCheckInsForPassNight(passId: string, nightId: string): Promise<number> {
  return _checkIns.filter(
    (ci) => ci.pass_id === passId && ci.night_id === nightId && ci.direction === "in" && ci.result === "allowed"
  ).length;
}

/** FE-07 handoff: supabase.from('check_ins').select().eq('event_id', eventId).eq('night_id', nightId).order('scanned_at', {ascending:false}).limit(20) */
export async function listRecentCheckIns(eventId: string, nightId: string, limit = 20): Promise<CheckIn[]> {
  return _checkIns
    .filter((ci) => ci.event_id === eventId && ci.night_id === nightId)
    .sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime())
    .slice(0, limit);
}

/**
 * Records a check-in (mock — writes to in-memory store).
 * FE-07 handoff: supabase.from('check_ins').upsert({...}, {onConflict: 'client_uuid'})
 */
export async function recordCheckIn(
  input: Omit<CheckIn, "id" | "created_at">
): Promise<CheckIn> {
  const existing = _checkIns.find((ci) => ci.client_uuid === input.client_uuid);
  if (existing) return existing; // idempotent replay
  const ci: CheckIn = {
    ...input,
    id: `ci-mock-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  _checkIns.push(ci);
  return ci;
}

// ─── Dashboard analytics (aggregated) ────────────────────────────────────────

export interface LiveStats {
  tickets_sold: number;
  revenue_paise: number;
  inside_now: number;
  tonight_gate_queue: number;
}

/** FE-07 handoff: supabase.rpc('get_live_stats', { p_event_id: eventId, p_night_id: nightId }) */
export async function getLiveStats(eventId: string, nightId?: string): Promise<LiveStats> {
  void eventId; void nightId;
  const soldOrders = _orders.filter((o) => o.status === "paid");
  return {
    tickets_sold: soldOrders.length * 2,
    revenue_paise: soldOrders.reduce((acc, o) => acc + o.total_paise, 0),
    inside_now: _checkIns.filter((ci) => ci.direction === "in" && ci.result === "allowed").length,
    tonight_gate_queue: Math.floor(Math.random() * 50),
  };
}

// ─── Scan manifest (offline) ──────────────────────────────────────────────────

export interface ScanManifestEntry {
  pass_id: string;
  pass_code: string;
  qr_payload: string;
  admits: number;
  zone_id: string;
  zone_name: string;
  night_ids: string[];
  status: string;
  tonight_checkin_count: number;
  holder_name: string | null;
  holder_photo_url: string | null;
  blocked_reason: string | null;
}

/**
 * Returns the compact manifest a gate device downloads once and caches.
 * FE-07 handoff: supabase.rpc('build_scan_manifest', { p_event_id: eventId, p_night_id: nightId })
 */
export async function buildScanManifest(eventId: string, nightId = "night-05"): Promise<ScanManifestEntry[]> {
  const results: ScanManifestEntry[] = [];
  for (const p of _passes.filter((x) => x.event_id === eventId)) {
    const holders = _passHolders.filter((ph) => ph.pass_id === p.id);
    const holderName = holders.map((h) => h.full_name).filter(Boolean).join(" & ") || null;
    const zoneMatch = zones.find((z) => z.id === p.zone_id);
    const tonightCount = _checkIns.filter(
      (ci) => ci.pass_id === p.id && ci.night_id === nightId && ci.direction === "in" && ci.result === "allowed"
    ).length;
    results.push({
      pass_id: p.id,
      pass_code: p.pass_code,
      qr_payload: p.qr_payload,
      admits: p.admits,
      zone_id: p.zone_id,
      zone_name: zoneMatch?.name ?? p.zone_id,
      night_ids: p.night_ids,
      status: p.status,
      tonight_checkin_count: tonightCount,
      holder_name: holderName,
      holder_photo_url: holders[0]?.photo_url ?? null,
      blocked_reason: p.blocked_reason,
    });
  }
  return results;
}

/**
 * Validates a pass against the manifest + live check-in state.
 * FE-07 handoff: supabase.rpc('validate_pass', { p_pass_code, p_night_id, p_zone_id, p_direction })
 */
export async function validatePass(
  passCode: string,
  nightId: string,
  zoneId: string
): Promise<{ pass: Pass | null; checkin_count: number }> {
  const pass = await getPassByCode(passCode);
  const checkin_count = pass ? await countCheckInsForPassNight(pass.id, nightId) : 0;
  // Validate zone match — here we just return the pass for the caller to evaluate with domain logic
  void zoneId;
  return { pass, checkin_count };
}

// ─── Tenant applications (Surface 0 — added FE-08, 2026-09-12 pivot) ─────────

/** FE-11 handoff: supabase.from('tenant_applications').select().eq('id', id).single() */
export async function getApplication(id: string): Promise<TenantApplication | null> {
  return _tenantApplications.find((a) => a.id === id) ?? null;
}

/** FE-11 handoff: supabase.from('tenant_applications').select().eq('phone', phone).order('created_at', {ascending:false}) */
export async function listApplicationsByPhone(phone: string): Promise<TenantApplication[]> {
  return _tenantApplications.filter((a) => a.phone === phone);
}

/** FE-11 handoff: supabase.from('tenant_applications').select().order('created_at', {ascending:false}) — internal-ops only */
export async function listApplications(status?: TenantApplicationStatus): Promise<TenantApplication[]> {
  const rows = status ? _tenantApplications.filter((a) => a.status === status) : _tenantApplications;
  return [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Creates a new TenantApplication in `status: "submitted"`.
 * FE-11 handoff: supabase.from('tenant_applications').insert({...}).select().single()
 */
export async function submitApplication(
  input: Pick<TenantApplication, "orgName" | "contactName" | "phone" | "city" | "roughCapacity" | "desiredDomain">
): Promise<TenantApplication> {
  const now = new Date().toISOString();
  const seq = String(++store.applicationSeq).padStart(3, "0");
  const application: TenantApplication = {
    id: `ta-mock-${seq}`,
    status: "submitted",
    rejectionReason: null,
    submittedAt: now,
    decidedAt: null,
    provisionedAt: null,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  _tenantApplications.push(application);
  // Mirrors real behaviour: a submitted application moves straight into
  // the internal review queue (per FE-08 §5, step 5).
  application.status = "under_review";
  return application;
}

/**
 * Internal-ops only (FE-10's approval screen). Approves an application and
 * marks it provisioned — in the real system this also kicks off tenant
 * row creation + subdomain provisioning; here it just flips both fields at
 * once since there's no real provisioning pipeline to await.
 * FE-11 handoff: supabase.rpc('approve_tenant_application', { p_application_id })
 */
export async function approveApplication(id: string): Promise<TenantApplication | null> {
  const application = _tenantApplications.find((a) => a.id === id);
  if (!application) return null;
  const now = new Date().toISOString();
  application.status = "approved";
  application.rejectionReason = null;
  application.decidedAt = now;
  application.provisionedAt = now;
  application.updatedAt = now;
  return application;
}

/**
 * Internal-ops only (FE-10's approval screen). Rejects an application, or
 * (with `moreInfoNeeded: true`) sends it back to the organizer for a fix
 * without permanently closing it out.
 * FE-11 handoff: supabase.rpc('reject_tenant_application', { p_application_id, p_reason, p_more_info_needed })
 */
export async function rejectApplication(
  id: string,
  reason: string,
  moreInfoNeeded = false
): Promise<TenantApplication | null> {
  const application = _tenantApplications.find((a) => a.id === id);
  if (!application) return null;
  const now = new Date().toISOString();
  application.status = moreInfoNeeded ? "more_info_needed" : "rejected";
  application.rejectionReason = reason;
  application.decidedAt = now;
  application.updatedAt = now;
  return application;
}

// ─── Refunds ──────────────────────────────────────────────────────────────
// No refund fixtures existed: `/me/refunds` was a paragraph of text and a
// WhatsApp link, and the dashboard's refund queue ran on its own unrelated
// mock. This gives both sides one list to read and write.

const _refunds = store.refunds;

/**
 * Kept as a thin wrapper so existing callers don't change; the tiers themselves
 * live in `packages/domain/src/logic/refund-policy.ts`, shared with the legal
 * page and the dashboard's policy editor.
 */
export function refundPercentForDaysBefore(daysBefore: number): number {
  return refundPercentFor(daysBefore);
}

export interface RefundQuote {
  daysBefore: number;
  percent: number;
  amountPaise: Paise;
  eligible: boolean;
}

export async function quoteRefund(orderId: string): Promise<RefundQuote | null> {
  const order = _orders.find((o) => o.id === orderId);
  if (!order || order.status !== "paid") return null;

  const nights = eventNights
    .filter((n) => n.event_id === order.event_id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const firstNight = nights[0];
  if (!firstNight) return null;

  const msPerDay = 86_400_000;
  const daysBefore = Math.floor(
    (new Date(`${firstNight.date}T00:00:00+05:30`).getTime() - Date.now()) / msPerDay
  );
  const percent = refundPercentForDaysBefore(daysBefore);

  return {
    daysBefore,
    percent,
    // Refunds are computed on what the buyer paid for the passes, not on the
    // fees — the gateway keeps its cut on a refunded transaction either way.
    amountPaise: paise(Math.round(((order.subtotal_paise - order.discount_paise) * percent) / 100)),
    eligible: percent > 0,
  };
}

export async function listRefundsByPhone(phone: string): Promise<Refund[]> {
  const orderIds = new Set(_orders.filter((o) => o.buyer_phone === phone).map((o) => o.id));
  return _refunds
    .filter((r) => orderIds.has(r.order_id))
    .sort((a, b) => b.requested_at.localeCompare(a.requested_at));
}

export async function listPendingRefunds(): Promise<Refund[]> {
  return _refunds.filter((r) => r.status === "requested");
}

/** FE-07 handoff: supabase.rpc('request_refund', { p_order_id, p_reason }) */
export async function requestRefund(orderId: string, reason: string): Promise<Refund | null> {
  const order = _orders.find((o) => o.id === orderId);
  if (!order) return null;
  if (_refunds.some((r) => r.order_id === orderId && r.status === "requested")) return null;

  const quote = await quoteRefund(orderId);
  if (!quote || !quote.eligible) return null;

  const now = new Date().toISOString();
  const refund: Refund = {
    id: `ref-mock-${String(++store.refundSeq).padStart(4, "0")}`,
    tenant_id: order.tenant_id,
    order_id: order.id,
    pass_ids: _passes.filter((p) => p.order_id === order.id).map((p) => p.id),
    requested_by: order.buyer_phone,
    approved_by: null,
    reason,
    policy_snapshot: { percent: quote.percent, daysBefore: quote.daysBefore },
    amount_paise: quote.amountPaise,
    status: "requested",
    provider_refund_id: null,
    requested_at: now,
    resolved_at: null,
    created_at: now,
    updated_at: now,
  };
  _refunds.push(refund);
  return refund;
}

// ─── Event content ────────────────────────────────────────────────────────

/** FE-07 handoff: supabase.from('event_content').select().eq('event_id', eventId).single() */
export async function getEventContent(eventId: string) {
  return findEventContent(eventId) ?? null;
}

// ─── Group invites ────────────────────────────────────────────────────────
// A buyer of a Couple or Family pass shares a link; each friend who opens it
// adds their name and number as one of the pass's holders. Before this the
// `/g/[code]` page echoed the code back and linked to a hardcoded event.

export interface GroupInviteView {
  code: string;
  createdByName: string;
  expired: boolean;
  pass: Pass;
  event: Event;
  zone: Zone | null;
  spots: number;
  holders: PassHolder[];
}

/** FE-07 handoff: supabase.rpc('get_group_invite', { p_code }) */
export async function getGroupInvite(code: string): Promise<GroupInviteView | null> {
  const invite = groupInvites.find((g) => g.code.toUpperCase() === code.toUpperCase());
  if (!invite) return null;
  const pass = _passes.find((p) => p.pass_code === invite.passCode);
  if (!pass) return null;
  const ev = event.id === pass.event_id ? event : null;
  if (!ev) return null;
  return {
    code: invite.code,
    createdByName: invite.createdByName,
    expired: new Date(invite.expiresAt).getTime() < Date.now() || pass.status !== "active",
    pass,
    event: ev,
    zone: zones.find((z) => z.id === pass.zone_id) ?? null,
    spots: pass.admits,
    holders: _passHolders.filter((ph) => ph.pass_id === pass.id).sort((a, b) => a.holder_index - b.holder_index),
  };
}

export type JoinGroupResult = { ok: true; holderIndex: number } | { ok: false; reason: "not_found" | "expired" | "full" | "already_joined" };

/** FE-07 handoff: supabase.rpc('join_group_invite', { p_code, p_name, p_phone }) */
export async function joinGroupInvite(code: string, fullName: string, phone: string): Promise<JoinGroupResult> {
  const view = await getGroupInvite(code);
  if (!view) return { ok: false, reason: "not_found" };
  if (view.expired) return { ok: false, reason: "expired" };
  if (view.holders.some((h) => h.phone === phone)) return { ok: false, reason: "already_joined" };
  if (view.holders.length >= view.spots) return { ok: false, reason: "full" };
  const now = new Date().toISOString();
  const holderIndex = view.holders.length + 1;
  _passHolders.push({
    id: `ph-${view.pass.id}-${holderIndex}`,
    tenant_id: view.pass.tenant_id,
    pass_id: view.pass.id,
    holder_index: holderIndex,
    full_name: fullName,
    phone,
    photo_url: null,
    age_band: "adult",
    invite_code: view.code,
    filled_at: now,
    created_at: now,
    updated_at: now,
  });
  return { ok: true, holderIndex };
}
