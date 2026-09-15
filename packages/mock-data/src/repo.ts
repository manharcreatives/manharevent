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

import { tenant, tenantBranding, umangTenant, umangBranding } from "./fixtures/tenant";
import { events, eventNights, venues, zones, gates, artists, nightLineup } from "./fixtures/event";
import { passTypes, priceTiers, addons, promoCodes } from "./fixtures/pass-types";
import { orders, orderItems, payments } from "./fixtures/orders";
import { passes, passHolders, checkIns } from "./fixtures/passes";
import { tenantApplications } from "./fixtures/tenant-applications";
import { findEventContent } from "./fixtures/event-content";
import { groupInvites } from "./fixtures/group-invites";
import { readStoreFile, writeStoreFile, statStoreFile } from "./storage";

// ─── Shared mutation store ─────────────────────────────────────────────────────
// `apps/web`, `apps/dashboard`, `apps/scanner` and `apps/marketing` are four
// separate Next.js processes, each bundling its own copy of this module — so
// module-level arrays alone don't survive even within one process (see the
// `globalThis` pin below), let alone between processes. `storage.ts` adds a
// single JSON file both layers on: every mutation writes it, and a short
// background poll reloads it here when another process's write lands, so
// register → approve → login → publish → buy → scan can be demoed across all
// four dev servers without a real backend. See storage.ts for the full story.
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

// Bump whenever a fixture change should force a reseed of an existing
// `.data/store.json` — e.g. adding Umang's demo event/orders below. A file
// written by an older version is discarded and rebuilt from fixtures rather
// than merged; there's no migration story for a mock store, only "start
// over". See PROGRESS.md — demo reset is `storeVersion` bump *or* manually
// deleting `packages/mock-data/.data/store.json` and restarting the apps.
const STORE_VERSION = 2;

interface MockStore {
  storeVersion: number;
  tenants: Tenant[];
  tenantBrandings: TenantBranding[];
  events: Event[];
  venues: Venue[];
  zones: Zone[];
  gates: Gate[];
  eventNights: EventNight[];
  passTypes: PassType[];
  priceTiers: PriceTier[];
  addons: AddOn[];
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
  eventSeq: number;
}

const STORE_KEY = Symbol.for("@manhar-garba/mock-data.store");
const SYNC_KEY = Symbol.for("@manhar-garba/mock-data.sync");
interface SyncState {
  lastMtimeMs: number | null;
  timer: ReturnType<typeof setInterval> | null;
}
type GlobalWithStore = typeof globalThis & {
  [STORE_KEY]?: MockStore;
  [SYNC_KEY]?: SyncState;
};

function createStore(): MockStore {
  return {
    storeVersion: STORE_VERSION,
    tenants: [tenant, umangTenant],
    tenantBrandings: [tenantBranding, umangBranding],
    events: [...events],
    venues: [...venues],
    zones: [...zones],
    gates: [...gates],
    eventNights: [...eventNights],
    passTypes: [...passTypes],
    priceTiers: [...priceTiers],
    addons: [...addons],
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
    eventSeq: 100,
  };
}

function loadOrInitStore(): MockStore {
  const fromDisk = readStoreFile<MockStore>();
  if (fromDisk && fromDisk.data.storeVersion === STORE_VERSION) return fromDisk.data;
  // Missing file, or a file written by an older STORE_VERSION (including
  // every file from before this field existed, where it's `undefined` —
  // always `!== STORE_VERSION`): reseed from fixtures rather than run with
  // stale/partial shape.
  const fresh = createStore();
  void writeStoreFile(fresh);
  return fresh;
}

const g = globalThis as GlobalWithStore;
const store: MockStore = (g[STORE_KEY] ??= loadOrInitStore());
const sync: SyncState = (g[SYNC_KEY] ??= { lastMtimeMs: statStoreFile(), timer: null });

/** Replaces every array's CONTENTS in place (never the array reference), so
 * every `_orders`/`_passes`/... alias below keeps pointing at a live array
 * after a reload — reassigning `store.orders = next.orders` would silently
 * strand those aliases on the old, now-frozen-in-time array. */
function applySnapshot(next: MockStore): void {
  for (const key of Object.keys(store) as (keyof MockStore)[]) {
    const current = store[key];
    const incoming = next[key];
    if (Array.isArray(current) && Array.isArray(incoming)) {
      const arr = current as unknown[];
      arr.length = 0;
      arr.push(...(incoming as unknown[]));
    } else if (typeof incoming === "number") {
      (store as unknown as Record<string, number>)[key] = incoming;
    }
  }
}

function reloadIfChanged(): void {
  const mtimeMs = statStoreFile();
  if (mtimeMs === null || mtimeMs === sync.lastMtimeMs) return;
  const fromDisk = readStoreFile<MockStore>();
  if (!fromDisk) return;
  applySnapshot(fromDisk.data);
  sync.lastMtimeMs = fromDisk.mtimeMs;
}

// Cross-process sync: another process's write shows up here within one tick
// of this interval. `unref()` so the poll never keeps a Next.js dev/build
// process alive on its own.
if (!sync.timer) {
  sync.timer = setInterval(reloadIfChanged, 300);
  sync.timer.unref?.();
}

/** Call after any mutation. Writes the whole store to disk and records this
 * process's own write so the next poll tick doesn't reload what it just
 * wrote itself. Every mutating function below awaits this before returning,
 * so a caller that gets a result back knows it is already on disk. */
async function persist(): Promise<void> {
  await writeStoreFile(store);
  sync.lastMtimeMs = statStoreFile();
}

// Array aliases: same references as the store, so every mutation below lands in
// the one shared object without rewriting hundreds of call sites. Safe across
// a reload because `applySnapshot` mutates in place (see above), never
// reassigns.
const _tenants = store.tenants;
const _tenantBrandings = store.tenantBrandings;
const _events = store.events;
const _venues = store.venues;
const _zones = store.zones;
const _gates = store.gates;
const _eventNights = store.eventNights;
const _passTypes = store.passTypes;
const _priceTiers = store.priceTiers;
const _addons = store.addons;
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
  return _tenants.find((t) => t.slug === slug) ?? null;
}

/** FE-07 handoff: supabase.from('tenant_branding').select().eq('tenant_id', id).single() */
export async function getTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  return _tenantBrandings.find((b) => b.tenant_id === tenantId) ?? null;
}

// ─── Events ───────────────────────────────────────────────────────────────────

/** FE-07 handoff: supabase.from('events').select().eq('slug', slug).single() */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  return _events.find((e) => e.slug === slug) ?? null;
}

/** FE-07 handoff: supabase.from('events').select().eq('id', id).single()
 *  Added FE-11 for /me/passes, which only has an order's event_id to work
 *  from, not its slug. */
export async function getEvent(id: string): Promise<Event | null> {
  return _events.find((e) => e.id === id) ?? null;
}

/** FE-07 handoff: supabase.from('events').select().eq('tenant_id', tenantId).eq('status', 'published') */
export async function listPublishedEvents(tenantId: string): Promise<Event[]> {
  return _events.filter((e) => e.tenant_id === tenantId && e.status === "published");
}

/** FE-07 handoff: supabase.from('events').select().eq('tenant_id', tenantId).order('created_at', {ascending:false}) */
export async function listEventsForTenant(tenantId: string): Promise<Event[]> {
  return _events
    .filter((e) => e.tenant_id === tenantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** FE-07 handoff: supabase.from('venues').select().eq('id', id).single() */
export async function getVenue(id: string): Promise<Venue | null> {
  return _venues.find((v) => v.id === id) ?? null;
}

/** FE-07 handoff: supabase.from('event_nights').select().eq('event_id', eventId).order('night_number') */
export async function listEventNights(eventId: string): Promise<EventNight[]> {
  return _eventNights.filter((n) => n.event_id === eventId).sort((a, b) => a.night_number - b.night_number);
}

/** FE-07 handoff: supabase.from('event_nights').select().eq('id', id).single() */
export async function getEventNight(id: string): Promise<EventNight | null> {
  return _eventNights.find((n) => n.id === id) ?? null;
}

/** FE-07 handoff: supabase.from('zones').select().eq('event_id', eventId).order('sort_order') */
export async function listZones(eventId: string): Promise<Zone[]> {
  return _zones.filter((z) => z.event_id === eventId);
}

/** FE-07 handoff: supabase.from('gates').select().eq('event_id', eventId) */
export async function listGates(eventId: string): Promise<Gate[]> {
  return _gates.filter((g) => g.event_id === eventId);
}

function slugifyTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "event";
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface CreateEventPassTypeInput {
  name: string;
  admits: number;
  /** Integer paise — never a float, never rupees. */
  pricePaise: number;
  totalQuantity: number;
}

export interface CreateEventInput {
  title: string;
  city: string;
  totalCapacity: number;
  nightCount: number;
  /** `YYYY-MM-DD` of the first night. */
  startDate: string;
  /** Open-ground-friendly starter passes — one zone, all covering every night. */
  passTypes: CreateEventPassTypeInput[];
}

/**
 * Creates a new event for an organizer's own tenant — open-ground shape only
 * (one "General Ground" zone, one gate, all-night pass types). This is the
 * one path the event wizard now saves through (dashboard-store.ts's
 * client-only `createEvent` still exists for every other editing action —
 * see PROGRESS.md's decision log for why only "create" moved here).
 * FE-07 handoff: an RPC or a small transaction inserting events, venues,
 * zones, gates, event_nights, pass_types and price_tiers together.
 */
export async function createEventForTenant(tenantId: string, input: CreateEventInput): Promise<Event> {
  const now = new Date().toISOString();
  const seq = String(++store.eventSeq).padStart(4, "0");
  const eventId = `ev-mock-${seq}`;

  let slug = slugifyTitle(input.title);
  if (_events.some((e) => e.slug === slug)) slug = `${slug}-${eventId.slice(-4)}`;

  const venueId = `venue-mock-${seq}`;
  const venue: Venue = {
    id: venueId,
    tenant_id: tenantId,
    name: `${input.title} Ground`,
    address: null,
    city: input.city,
    state: null,
    pincode: null,
    lat: null,
    lng: null,
    google_maps_url: null,
    map_image_url: null,
    total_capacity: input.totalCapacity,
    created_at: now,
    updated_at: now,
  };

  const zoneId = `zone-mock-${seq}`;
  const zone: Zone = {
    id: zoneId,
    tenant_id: tenantId,
    event_id: eventId,
    code: "GENERAL",
    name: "General Ground",
    description: "Open ground, standing. One ticket, no zones.",
    capacity: input.totalCapacity,
    color: "hsl(14 92% 56%)",
    sort_order: 0,
    created_at: now,
    updated_at: now,
  };

  const gate: Gate = {
    id: `gate-mock-${seq}`,
    tenant_id: tenantId,
    event_id: eventId,
    code: "G1",
    name: "Gate 1 — Main Entry",
    direction: "both",
    created_at: now,
    updated_at: now,
  };

  const nightCount = Math.max(1, input.nightCount);
  const nights: EventNight[] = Array.from({ length: nightCount }, (_, i) => {
    const date = addDaysIso(input.startDate, i);
    return {
      id: `${eventId}-night-${String(i + 1).padStart(2, "0")}`,
      tenant_id: tenantId,
      event_id: eventId,
      night_number: i + 1,
      date,
      gates_open_at: `${date}T18:00:00+05:30`,
      starts_at: `${date}T19:30:00+05:30`,
      ends_at: `${date}T23:30:00+05:30`,
      theme: null,
      theme_color: null,
      dress_code: null,
      notes: null,
      status: "scheduled",
      created_at: now,
      updated_at: now,
    };
  });
  const allNightIds = nights.map((n) => n.id);

  const newPassTypes: PassType[] = [];
  const newPriceTiers: PriceTier[] = [];
  input.passTypes.forEach((pt, i) => {
    const ptId = `pt-mock-${seq}-${i}`;
    newPassTypes.push({
      id: ptId,
      tenant_id: tenantId,
      event_id: eventId,
      zone_id: zoneId,
      code: slugifyTitle(pt.name).toUpperCase().replace(/-/g, "_"),
      name: pt.name,
      description: `All ${nightCount} night${nightCount === 1 ? "" : "s"}, General Ground. Admits ${pt.admits}.`,
      kind: "season",
      admits: pt.admits,
      night_ids: allNightIds,
      total_quantity: pt.totalQuantity,
      sold_quantity: 0,
      held_quantity: 0,
      min_per_order: 1,
      max_per_order: 6,
      sale_starts_at: null,
      sale_ends_at: null,
      requires_photo: false,
      is_transferable: true,
      status: "on_sale",
      sort_order: i,
      created_at: now,
      updated_at: now,
    });
    newPriceTiers.push({
      id: `tier-mock-${seq}-${i}`,
      tenant_id: tenantId,
      pass_type_id: ptId,
      name: "Regular",
      price_paise: paise(pt.pricePaise),
      starts_at: null,
      ends_at: null,
      quantity_cap: null,
      quantity_sold: 0,
      sort_order: 0,
      created_at: now,
      updated_at: now,
    });
  });

  const event: Event = {
    id: eventId,
    tenant_id: tenantId,
    venue_id: venueId,
    slug,
    title: input.title,
    subtitle: null,
    description: null,
    status: "draft",
    starts_on: input.startDate,
    ends_on: addDaysIso(input.startDate, nightCount - 1),
    timezone: "Asia/Kolkata",
    cover_url: null,
    og_image_url: null,
    category: "garba",
    reentry_policy: "unlimited",
    reentry_window_minutes: null,
    published_at: null,
    created_at: now,
    updated_at: now,
  };

  _events.push(event);
  _venues.push(venue);
  _zones.push(zone);
  _gates.push(gate);
  _eventNights.push(...nights);
  _passTypes.push(...newPassTypes);
  _priceTiers.push(...newPriceTiers);
  await persist();
  return event;
}

/** FE-07 handoff: supabase.from('events').update({status}).eq('id', eventId) */
export async function updateEventStatus(
  eventId: string,
  status: "draft" | "published"
): Promise<Event | null> {
  const event = _events.find((e) => e.id === eventId);
  if (!event) return null;
  event.status = status;
  if (status === "published" && !event.published_at) event.published_at = new Date().toISOString();
  event.updated_at = new Date().toISOString();
  await persist();
  return event;
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
  return _passTypes.filter((pt) => pt.event_id === eventId);
}

/** FE-07 handoff: supabase.from('pass_types').select().eq('event_id', eventId).eq('zone_id', zoneId) */
export async function listPassTypesForZone(eventId: string, zoneId: string): Promise<PassType[]> {
  return _passTypes.filter((pt) => pt.event_id === eventId && pt.zone_id === zoneId);
}

/** FE-07 handoff: supabase.from('price_tiers').select().eq('pass_type_id', passTypeId).order('sort_order') */
export async function listPriceTiers(passTypeId: string): Promise<PriceTier[]> {
  return _priceTiers.filter((t) => t.pass_type_id === passTypeId);
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
  const zonePassTypes = _passTypes.filter(
    (pt) => pt.event_id === eventId && pt.zone_id === zoneId && pt.status === "on_sale"
  );
  const prices = zonePassTypes.flatMap((pt) =>
    _priceTiers.filter((t) => t.pass_type_id === pt.id).map((t) => t.price_paise)
  );
  return prices.length > 0 ? (Math.min(...prices) as Paise) : null;
}

/**
 * FE-07 handoff: supabase.from('addons').select().eq('event_id', eventId).eq('status', 'on_sale')
 * USR-06: booking used to quote every addon regardless of status, but
 * checkout never charged or itemized them — an add-on shown here has to be
 * fully charged and delivered, or it doesn't belong on sale at all.
 */
export async function listAddons(eventId: string): Promise<AddOn[]> {
  return _addons.filter((a) => a.event_id === eventId && a.status === "on_sale");
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
  await persist();
  return order;
}

export interface CompleteMockOrderInput {
  orderId: string;
  /** The session's verified phone at pay time — overwrites whatever the order was created with (USR-05: createOrder often runs before sign-in, leaving buyer_phone empty). */
  buyerPhone: string;
  buyerName: string | null;
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

  // USR-04: idempotent on provider_payment_id — a second call for an
  // already-paid order (double-click, retry, stale tab) must not mint a
  // second set of order items/payment/passes. Real webhook handler does
  // this same check keyed on the provider's payment id.
  if (order.status === "paid") {
    return { order, passes: _passes.filter((p) => p.order_id === order.id) };
  }

  const now = new Date().toISOString();
  order.status = "paid";
  order.buyer_phone = input.buyerPhone;
  order.buyer_name = input.buyerName;
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

  await persist();
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
  await persist();
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
    const zoneMatch = _zones.find((z) => z.id === p.zone_id);
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
    tenantId: null,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  _tenantApplications.push(application);
  // Mirrors real behaviour: a submitted application moves straight into
  // the internal review queue (per FE-08 §5, step 5).
  application.status = "under_review";
  await persist();
  return application;
}

/** ADM-16: creates the Tenant + TenantBranding row an approval provisions.
 * Idempotent on tenant id, so re-running approve on an already-provisioned
 * application (or the seed data's pre-approved Umang application) never
 * duplicates a tenant. */
function provisionTenantForApplication(application: TenantApplication, now: string): string {
  let slug = slugifyTitle(application.desiredDomain);
  if (_tenants.some((t) => t.slug === slug && t.id !== `t-${slug}`)) slug = `${slug}-${application.id.slice(-4)}`;
  const tenantId = `t-${slug}`;
  if (!_tenants.some((t) => t.id === tenantId)) {
    _tenants.push({
      id: tenantId,
      slug,
      legal_name: application.orgName,
      display_name: application.orgName,
      status: "active",
      gstin: null,
      pan: null,
      support_phone: application.phone,
      support_email: null,
      created_at: now,
      updated_at: now,
    });
    _tenantBrandings.push({
      tenant_id: tenantId,
      logo_url: null,
      logo_dark_url: null,
      favicon_url: null,
      primary_color: "#F55B2A",
      accent_color: "#B24FE0",
      custom_domain: null,
      domain_verified: false,
      meta_title: application.orgName,
      meta_description: null,
    });
  }
  return tenantId;
}

/**
 * Internal-ops only (FE-10's approval screen). Approves an application and
 * marks it provisioned — approve = provision now actually creates the
 * `Tenant` (+ branding) row a login can resolve to, instead of only
 * flipping status fields with nothing behind them (ADM-16).
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
  application.tenantId = provisionTenantForApplication(application, now);
  application.updatedAt = now;
  await persist();
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
  await persist();
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

  const nights = _eventNights
    .filter((n) => n.event_id === order.event_id)
    .sort((a, b) => a.date.localeCompare(b.date));

  // USR-27: /legal/refund-policy promises "measured against the first night
  // the pass covers" — a weekend pass (nights 6-9) was instead measured from
  // the event's opening night, quoting a more generous tier than the pass
  // actually earns. min(pass.night_ids) across this order's own passes is
  // the same number the legal page describes.
  const coveredNightIds = new Set(
    _passes.filter((p) => p.order_id === orderId).flatMap((p) => p.night_ids)
  );
  const coveredNights = nights.filter((n) => coveredNightIds.has(n.id));
  const firstNight = coveredNights[0] ?? nights[0];
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
  await persist();
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
  const ev = _events.find((e) => e.id === pass.event_id) ?? null;
  if (!ev) return null;
  return {
    code: invite.code,
    createdByName: invite.createdByName,
    expired: new Date(invite.expiresAt).getTime() < Date.now() || pass.status !== "active",
    pass,
    event: ev,
    zone: _zones.find((z) => z.id === pass.zone_id) ?? null,
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
  await persist();
  return { ok: true, holderIndex };
}
