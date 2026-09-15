import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getOrder, listPassesForOrder } from "@manhar-garba/mock-data";
import { redirect } from "@/i18n/navigation";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);

  const order = await getOrder(orderId);
  if (!order) notFound();

  // USR-04: a paid order has nothing left to pay for — sending the buyer
  // back into the pay flow risked completeMockOrder running twice for the
  // same order (double passes). The status page is the honest destination.
  if (order.status === "paid") {
    redirect({ href: `/checkout/${orderId}/status`, locale });
  }

  const existingPasses = await listPassesForOrder(orderId);

  return <CheckoutClient order={order} existingPasses={existingPasses} />;
}
