"use client";

import { useTranslations } from "next-intl";
import type { Order, Pass } from "@manhar-garba/domain";
import { Button, PassCard } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cart-store";
import { CheckCircle, MessageSquare, Download, ArrowRight } from "lucide-react";

interface Props {
  order: Order;
  passes: Pass[];
}

// FE-11: wired to the "Status" i18n namespace, which had full en/gu/hi
// translations sitting unused since FE-03 (same gap as checkout-client.tsx
// and the auth pages, flagged in PROGRESS.md).
export function OrderStatusClient({ order, passes }: Props) {
  const t = useTranslations("Status");
  const cart = useCartStore();
  const zoneName = cart.zoneName ?? "Zone";
  const zoneColor = cart.zoneColor ?? undefined;
  const eventSlug = cart.eventSlug ?? "";

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      {/* Success header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle className="h-14 w-14 text-green-500" aria-hidden="true" />
        <h1 className="font-display text-2xl font-bold text-foreground">{t("success")}</h1>
        <p className="text-sm text-muted-foreground">
          Order <strong>{order.order_number}</strong>
        </p>
      </div>

      {/* WhatsApp notice */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
        <p className="text-sm text-green-800 dark:text-green-200">{t("whatsappNote")}</p>
      </div>

      {/* QR passes */}
      {passes.length > 0 ? (
        <div className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">{t("passReady")}</h2>
          {passes.map((pass) => (
            <div key={pass.id} className="rounded-xl border border-border bg-surface p-4">
              <PassCard
                state="valid"
                holderName={order.buyer_name ?? "Guest"}
                zoneName={zoneName}
                zoneColor={zoneColor ?? "#6366f1"}
                admits={pass.admits}
                nightRange={`${pass.night_ids.length} night${pass.night_ids.length !== 1 ? "s" : ""}`}
                passCode={pass.pass_code}
              />
              {/* Mock QR */}
              <div className="mt-4 flex flex-col items-center">
                <div className="h-40 w-40 rounded-xl border-2 border-primary bg-white p-2">
                  <div
                    className="h-full w-full rounded-lg bg-foreground/90"
                    style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,white 3px,white 4px),repeating-linear-gradient(90deg,transparent,transparent 3px,white 3px,white 4px)" }}
                    role="img"
                    aria-label="QR code"
                  />
                </div>
                <p className="mt-2 font-mono text-sm font-bold text-foreground">{pass.pass_code}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Show at gate</p>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full gap-2" disabled>
                <Download className="h-3.5 w-3.5" />
                {t("downloadPdf")} (coming soon)
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Your passes are being generated. Check back in a moment or open the WhatsApp message.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <Button asChild className="w-full gap-2">
          <Link href="/me/passes">
            {t("viewAllPasses")} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {eventSlug && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/e/${eventSlug}`}>Back to event</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
