"use client";

import { useTranslations } from "next-intl";
import type { Order, Pass } from "@manhar-garba/domain";
import { Button, PassCard, QrCode, QrDownloadButton } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cart-store";
import { CheckCircle, Clock, XCircle, AlertTriangle, MessageSquare, Download, ArrowRight, ShieldCheck } from "lucide-react";

interface Props {
  order: Order;
  passes: Pass[];
  /** Zone names and colours by id, resolved on the server — the cart may be empty on a fresh device. */
  zones: Record<string, { name: string; color: string | null }>;
  eventSlug: string | null;
}

type StatusKind = "paid" | "pending" | "failed" | "expired" | "other";

function resolveStatusKind(order: Order): StatusKind {
  if (order.status === "paid") return "paid";
  if (order.status === "failed") return "failed";
  if (order.status === "draft" || order.status === "pending_payment") {
    const expired = order.expires_at !== null && new Date(order.expires_at).getTime() < Date.now();
    return expired ? "expired" : "pending";
  }
  return "other";
}

export function OrderStatusClient({ order, passes, zones, eventSlug }: Props) {
  const t = useTranslations("Status");
  const tMe = useTranslations("Me");
  const cart = useCartStore();
  const backSlug = eventSlug ?? cart.eventSlug ?? "";
  const kind = resolveStatusKind(order);

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      {/*
        USR-08: this used to say "Payment successful!" unconditionally,
        regardless of order.status — an unpaid or failed order told the
        buyer their payment worked. The icon, title and description below
        are the only honest summary of what actually happened.
      */}
      {kind === "paid" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle className="h-14 w-14 text-success" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold text-foreground">{t("success")}</h1>
          <p className="text-sm text-muted-foreground">
            Order <strong>{order.order_number}</strong>
          </p>
        </div>
      )}
      {kind === "pending" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <Clock className="h-14 w-14 text-warning" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold text-foreground">{t("statusPendingTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("statusPendingDesc")}</p>
          <Button asChild size="sm" className="mt-2">
            <Link href={`/checkout/${order.id}`}>{t("retryPayment")}</Link>
          </Button>
        </div>
      )}
      {kind === "failed" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="h-14 w-14 text-destructive" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold text-foreground">{t("statusFailedTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("statusFailedDesc")}</p>
          <Button asChild size="sm" className="mt-2">
            <Link href={`/checkout/${order.id}`}>{t("retryPayment")}</Link>
          </Button>
        </div>
      )}
      {kind === "expired" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-14 w-14 text-warning" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold text-foreground">{t("statusExpiredTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("statusExpiredDesc")}</p>
          {backSlug && (
            <Button asChild size="sm" className="mt-2">
              <Link href={`/e/${backSlug}/book`}>{t("choosePasses")}</Link>
            </Button>
          )}
        </div>
      )}
      {kind === "other" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-14 w-14 text-muted-foreground" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold text-foreground">{t("statusOtherTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("statusOtherDesc")}</p>
        </div>
      )}

      {kind === "paid" && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          <p className="text-sm text-foreground">{t("whatsappNote")}</p>
        </div>
      )}

      {kind === "paid" && (
        passes.length > 0 ? (
          <div className="mt-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">{t("passReady")}</h2>
            {passes.map((pass) => {
              const zone = zones[pass.zone_id];
              return (
                <div key={pass.id} className="rounded-xl border border-border bg-surface p-4">
                  <PassCard
                    state="valid"
                    holderName={order.buyer_name || tMe("guest")}
                    zoneName={zone?.name ?? "Zone"}
                    zoneColor={zone?.color ?? "#6366f1"}
                    admits={pass.admits}
                    nightRange={t("nightsCovered", { count: pass.night_ids.length })}
                    passCode={pass.pass_code}
                    admitsLabel={t("admitsShort", { count: pass.admits })}
                  />
                  {/*
                    The same real, scannable code as My Passes. This used to be a
                    CSS gradient pattern — the buyer's first sight of their ticket
                    was a QR no gate scanner could read.
                  */}
                  <div className="mt-4 flex flex-col items-center">
                    <QrCode value={pass.qr_payload} size={176} level="H" caption={pass.pass_code} />
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-success" />
                      {t("showAtGate")}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <QrDownloadButton
                      value={pass.qr_payload}
                      filename={`${pass.pass_code}.png`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border text-sm text-foreground transition-colors hover:bg-surface-raised"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("saveQr")}
                    </QrDownloadButton>
                    <Button asChild variant="outline" size="sm" className="h-9">
                      <Link href={`/me/passes/${pass.id}`}>{t("openPass")}</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-6 text-center">
            <p className="text-sm font-medium text-foreground">{t("noPassesTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("noPassesDesc")}</p>
            {backSlug && (
              <Button asChild size="sm" className="mt-4">
                <Link href={`/e/${backSlug}/book`}>{t("choosePasses")}</Link>
              </Button>
            )}
          </div>
        )
      )}

      <div className="mt-8 space-y-3">
        <Button asChild className="w-full gap-2">
          <Link href="/me/passes">
            {t("viewAllPasses")} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {backSlug && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/e/${backSlug}`}>{t("backToEvent")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
