"use server";

import type { PassStatus } from "@manhar-garba/domain";
import { listOrdersByPhone, listPassesForOrder, listZones, getEvent } from "@manhar-garba/mock-data";

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
