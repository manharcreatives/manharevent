"use server";

import {
  listOrdersByPhone,
  listRefundsByPhone,
  quoteRefund,
  requestRefund,
  getEvent,
} from "@manhar-garba/mock-data";

/**
 * Bridges the client-side phone number (persisted in the auth store) to the
 * server-only mock repo — the same pattern `me.ts` uses. Client components
 * can't reach the in-memory store directly because it only exists in this
 * server process.
 */

export interface RefundableOrder {
  orderId: string;
  orderNumber: string;
  eventTitle: string;
  paidPaise: number;
  daysBefore: number;
  percent: number;
  refundablePaise: number;
  eligible: boolean;
  alreadyRequested: boolean;
}

export interface RefundRow {
  id: string;
  orderNumber: string;
  amountPaise: number;
  status: string;
  reason: string | null;
  requestedAt: string;
  resolvedAt: string | null;
}

export async function getRefundsDataAction(
  phone: string
): Promise<{ refundable: RefundableOrder[]; requests: RefundRow[] }> {
  const [orders, refunds] = await Promise.all([
    listOrdersByPhone(phone),
    listRefundsByPhone(phone),
  ]);

  const byOrderId = new Map(orders.map((o) => [o.id, o]));

  const refundable: RefundableOrder[] = [];
  for (const order of orders) {
    if (order.status !== "paid") continue;
    const quote = await quoteRefund(order.id);
    if (!quote) continue;
    const event = await getEvent(order.event_id);
    refundable.push({
      orderId: order.id,
      orderNumber: order.order_number,
      eventTitle: event?.title ?? "Event",
      paidPaise: order.total_paise,
      daysBefore: quote.daysBefore,
      percent: quote.percent,
      refundablePaise: quote.amountPaise,
      eligible: quote.eligible,
      alreadyRequested: refunds.some(
        (r) => r.order_id === order.id && r.status === "requested"
      ),
    });
  }

  return {
    refundable,
    requests: refunds.map((r) => ({
      id: r.id,
      orderNumber: byOrderId.get(r.order_id)?.order_number ?? r.order_id,
      amountPaise: r.amount_paise,
      status: r.status,
      reason: r.reason,
      requestedAt: r.requested_at,
      resolvedAt: r.resolved_at,
    })),
  };
}

export async function requestRefundAction(
  orderId: string,
  reason: string
): Promise<{ ok: boolean; message: string }> {
  const refund = await requestRefund(orderId, reason);
  if (!refund) {
    return {
      ok: false,
      message:
        "We couldn't raise that request — the order may already have one open, or be outside the refund window.",
    };
  }
  return { ok: true, message: "Refund request submitted." };
}
