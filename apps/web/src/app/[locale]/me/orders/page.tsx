"use client";

import { useEffect, useState } from "react";
import { Button, Money } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { listOrdersByPhone } from "@manhar-garba/mock-data";
import type { Order } from "@manhar-garba/domain";
import { Receipt } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  draft: "Draft",
  refunded: "Refunded",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default function MyOrdersPage() {
  const { phone, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    listOrdersByPhone(phone).then((os) => { setOrders(os); setLoading(false); });
  }, [phone]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground/40" />
        <h1 className="text-lg font-semibold text-foreground">Sign in to see your orders</h1>
        <Button asChild><Link href="/auth/start">Sign in</Link></Button>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Orders</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-lg font-semibold text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground">
            Once you buy passes to an event, your orders will show up here.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Browse events</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{order.order_number}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    <Money paise={order.total_paise} locale="en" />
                  </p>
                  <span className={`mt-0.5 inline-block text-xs ${order.status === "paid" ? "text-green-600" : "text-muted-foreground"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
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
