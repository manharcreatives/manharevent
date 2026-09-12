"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Button, EmptyState, ErrorState, Skeleton, PassCard, Money, Badge } from "@manhar-garba/ui";
import { Ticket, Loader2 } from "lucide-react";
import { getMyAccountDataAction, type MyAccountData } from "@/app/actions/me";

type Tab = "passes" | "orders";

const ORDER_STATUS_VARIANT: Record<string, "default" | "primary" | "success" | "warning" | "destructive"> = {
  draft: "default",
  pending_payment: "primary",
  paid: "success",
  failed: "destructive",
  cancelled: "default",
  refunded: "warning",
  partially_refunded: "warning",
};

// My Passes + Orders (bottom-nav destination #2 — manharevents-screen-specs.md
// §1.6). Built as one page with two tabs since the "Me" i18n namespace
// already had keys for both ("passes"/"orders"/"noOrders") but no route
// ever consumed them (FE-11 gap-closing).
export default function MyPassesPage() {
  const t = useTranslations("Me");
  const tAuth = useTranslations("Auth");
  const tBook = useTranslations("Book");
  const { phone, isAuthenticated } = useAuthStore();

  const [tab, setTab] = useState<Tab>("passes");
  const [data, setData] = useState<MyAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!phone) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    getMyAccountDataAction(phone)
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [phone]);

  if (!isAuthenticated || !phone) {
    return (
      <div className="mx-auto max-w-[400px] px-4 py-16 text-center sm:px-6">
        <Ticket className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">{tAuth("signInTitle")}</h1>
        <Button asChild className="mt-6 w-full">
          <Link href="/auth/start">{t("title")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px] px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>

      <div className="mt-4 flex gap-2 border-b border-border">
        {(["passes", "orders"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={
              tab === tabKey
                ? "border-b-2 border-primary px-3 py-2 text-sm font-semibold text-primary"
                : "border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-6">
          <ErrorState />
        </div>
      )}

      {!loading && !error && data && tab === "passes" && (
        data.passes.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<Ticket />}
              title={t("noPasses")}
              description={t("noPassesDesc")}
              action={<Button asChild><Link href="/">{t("browseEvents")}</Link></Button>}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {data.passes.map((pass) => (
              <PassCard
                key={pass.id}
                state={pass.cardState}
                holderName={pass.buyerName ?? "Guest"}
                zoneName={pass.zoneName}
                zoneColor={pass.zoneColor ?? undefined}
                admits={pass.admits}
                nightRange={tBook("nightsCovered", { count: pass.nightCount })}
                passCode={pass.passCode}
              />
            ))}
          </div>
        )
      )}

      {!loading && !error && data && tab === "orders" && (
        data.orders.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={<Ticket />} title={t("noOrders")} />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {data.orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{order.eventTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    #{order.orderNumber} · {t("orderedOn", { date: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Money paise={order.totalPaise} className="text-sm font-semibold text-foreground" />
                  <Badge variant={ORDER_STATUS_VARIANT[order.status] ?? "default"}>{order.status.replace(/_/g, " ")}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
