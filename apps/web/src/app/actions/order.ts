"use server";

import { createOrder, completeMockOrder } from "@manhar-garba/mock-data";
import type { CompleteMockOrderInput } from "@manhar-garba/mock-data";

interface CreateOrderInput {
  tenantId: string;
  eventId: string;
  buyerPhone: string;
  buyerName: string;
}

export async function createMockOrder(input: CreateOrderInput): Promise<{ orderId: string }> {
  const order = await createOrder({
    tenant_id: input.tenantId,
    event_id: input.eventId,
    buyer_phone: input.buyerPhone,
    buyer_name: input.buyerName,
    buyer_email: null,
  });
  return { orderId: order.id };
}

// Client components can't call mock-data mutations directly — the in-memory
// store only exists in this server process. This wraps completeMockOrder
// (the mock stand-in for a verified Razorpay payment webhook) for the
// checkout "Pay" button.
export async function payMockOrder(input: CompleteMockOrderInput): Promise<{ passCount: number }> {
  const { passes } = await completeMockOrder(input);
  return { passCount: passes.length };
}
