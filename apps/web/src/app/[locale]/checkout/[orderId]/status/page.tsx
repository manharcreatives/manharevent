import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getOrder, getEvent, listPassesForOrder, listZones } from "@manhar-garba/mock-data";
import { OrderStatusClient } from "@/components/checkout/order-status-client";

export const metadata: Metadata = { title: "Booking confirmed" };

export default async function CheckoutStatusPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);

  const order = await getOrder(orderId);
  if (!order) notFound();

  const [passes, event, zones] = await Promise.all([
    listPassesForOrder(orderId),
    getEvent(order.event_id),
    listZones(order.event_id),
  ]);

  return (
    <OrderStatusClient
      order={order}
      passes={passes}
      eventSlug={event?.slug ?? null}
      zones={Object.fromEntries(zones.map((z) => [z.id, { name: z.name, color: z.color }]))}
    />
  );
}
