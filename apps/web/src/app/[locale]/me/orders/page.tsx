"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Money } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { getMyAccountDataAction, type MyOrderSummary } from "@/app/actions/me";
import { Receipt } from "lucide-react";

export default function MyOrdersPage() {
  const t = useTranslations("Me");
  const tCommon = useTranslations("Common");
  const tAuth = useTranslations("Auth");
  const { phone, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<MyOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    getMyAccountDataAction(phone).then((data) => { setOrders(data.orders); setLoading(false); });
  }, [phone]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground/40" />
        <h1 className="text-lg font-semibold text-foreground">{t("signInToSeeOrders")}</h1>
        <Button asChild><Link href="/auth/start">{tAuth("signInTitle")}</Link></Button>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("orders")}</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-lg font-semibold text-foreground">{t("noOrders")}</p>
          <p className="text-sm text-muted-foreground">{t("noOrdersDesc")}</p>
          <Button asChild variant="outline">
            <Link href="/">{t("browseEvents")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("orderedOn", { date: new Date(order.createdAt).toLocaleDateString("en-IN") })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    <Money paise={order.totalPaise} locale="en" />
                  </p>
                  <span className={`mt-0.5 inline-block capitalize text-xs ${order.status === "paid" ? "text-green-600" : "text-muted-foreground"}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
