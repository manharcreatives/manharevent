"use server";

import type { PassStatus } from "@manhar-garba/domain";
import {
  listOrdersByPhone,
  listPassesForOrder,
  listZones,
  listPassTypes,
  listPassHolders,
  getEvent,
  getPass,
  getOrder,
} from "@manhar-garba/mock-data";

// FE-11: closes the "/me/*" gap flagged in PROGRESS.md — client components
// can't call mock-data directly (the in-memory store only exists in this
// server process), and the phone number used to look orders up only lives
// client-side (auth-store's persisted Zustand state), so this file exists
// purely to bridge the two, the same pattern apps/marketing's
// register/status page uses for its own phone-keyed lookup.

export interface MyOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  eventTitle: string;
  eventSlug: string;
  totalPaise: number;
  passCount: number;
  createdAt: string;
}

export interface MyPassSummary {
  id: string;
  passCode: string;
  cardState: "valid" | "used-tonight" | "refunded" | "transferred-away";
  admits: number;
  nightCount: number;
  zoneName: string;
  zoneColor: string | null;
  eventTitle: string;
  eventSlug: string;
  buyerName: string | null;
  orderNumber: string;
}

function toCardState(status: PassStatus): MyPassSummary["cardState"] {
  switch (status) {
    case "used_up":
      return "used-tonight";
    case "transferred":
      return "transferred-away";
    case "refunded":
    case "cancelled":
    case "blocked":
      // PassCard only has 4 visual states — cancelled/blocked don't have
      // their own, so they get the same dimmed treatment as "refunded"
      // rather than being mis-shown as still valid.
      return "refunded";
    default:
      return "valid";
  }
}

export interface MyAccountData {
  passes: MyPassSummary[];
  orders: MyOrderSummary[];
}

export async function getMyAccountDataAction(phone: string): Promise<MyAccountData> {
  const orders = await listOrdersByPhone(phone);
  const passes: MyPassSummary[] = [];
  const orderSummaries: MyOrderSummary[] = [];
  const zonesByEvent = new Map<string, Awaited<ReturnType<typeof listZones>>>();

  for (const order of orders) {
    const event = await getEvent(order.event_id);
    const orderPasses = await listPassesForOrder(order.id);

    orderSummaries.push({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      eventTitle: event?.title ?? "Event",
      eventSlug: event?.slug ?? "",
      totalPaise: order.total_paise,
      passCount: orderPasses.length,
      createdAt: order.created_at,
    });

    if (orderPasses.length === 0 || !event) continue;

    let zones = zonesByEvent.get(event.id);
    if (!zones) {
      zones = await listZones(event.id);
      zonesByEvent.set(event.id, zones);
    }

    for (const pass of orderPasses) {
      const zone = zones.find((z) => z.id === pass.zone_id);
      passes.push({
        id: pass.id,
        passCode: pass.pass_code,
        cardState: toCardState(pass.status),
        admits: pass.admits,
        nightCount: pass.night_ids.length,
        zoneName: zone?.name ?? "Zone",
        zoneColor: zone?.color ?? null,
        eventTitle: event.title,
        eventSlug: event.slug,
        buyerName: order.buyer_name,
        orderNumber: order.order_number,
      });
    }
  }

  return { passes, orders: orderSummaries };
}

export interface MyPassDetail {
  id: string;
  passCode: string;
  qrPayload: string;
  status: PassStatus;
  admits: number;
  nightCount: number;
  zoneName: string | null;
  zoneColor: string | null;
  passTypeName: string | null;
  /** Named holder for this specific pass, falling back to the buyer — null only for a genuinely unnamed (guest) pass. */
  holderName: string | null;
}

// FE-11 fix (P-D6): the pass-detail route used to call mock-data's getPass()
// straight from the client, which (a) put mock-data in the client bundle and
// (b) let anyone open any pass id with no ownership check. This mirrors
// getMyAccountDataAction's phone-bridging pattern, but also verifies the
// pass's order actually belongs to the requesting phone before returning it.
export async function getMyPassDetailAction(
  phone: string,
  passId: string
): Promise<MyPassDetail | null> {
  const pass = await getPass(passId);
  if (!pass) return null;

  const order = await getOrder(pass.order_id);
  if (!order || order.buyer_phone !== phone) return null;

  const [zones, passTypes, holders] = await Promise.all([
    listZones(pass.event_id),
    listPassTypes(pass.event_id),
    listPassHolders(pass.id),
  ]);
  const zone = zones.find((z) => z.id === pass.zone_id);
  const passType = passTypes.find((pt) => pt.id === pass.pass_type_id);
  const primaryHolder = holders.find((h) => h.holder_index === 1) ?? holders[0];

  return {
    id: pass.id,
    passCode: pass.pass_code,
    qrPayload: pass.qr_payload,
    status: pass.status,
    admits: pass.admits,
    nightCount: pass.night_ids.length,
    zoneName: zone?.name ?? null,
    zoneColor: zone?.color ?? null,
    passTypeName: passType?.name ?? null,
    holderName: primaryHolder?.full_name || order.buyer_name || null,
  };
}
