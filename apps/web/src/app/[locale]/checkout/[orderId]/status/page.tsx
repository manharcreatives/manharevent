import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getOrder, listPassesForOrder } from "@manhar-garba/mock-data";
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

  const passes = await listPassesForOrder(orderId);

  return <OrderStatusClient order={order} passes={passes} />;
}
