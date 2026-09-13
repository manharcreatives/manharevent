"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Money, ZoneMap, cn } from "@manhar-garba/ui";
import type { ZoneRegion } from "@manhar-garba/ui";
import { computeFees } from "@manhar-garba/domain";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { createMockOrder } from "@/app/actions/order";

export interface BookZone {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
}

export interface BookPassType {
  id: string;
  zoneId: string;
  name: string;
  description: string | null;
  kind: string;
  admits: number;
  nightIds: string[];
  pricePaise: number;
  minPerOrder: number;
  maxPerOrder: number;
  available: number;
}

export interface BookAddon {
  id: string;
  name: string;
  pricePaise: number;
}

interface BookClientProps {
  eventSlug: string;
  eventId: string;
  tenantId: string;
  zones: BookZone[];
  passTypes: BookPassType[];
  addons: BookAddon[];
}

// Real zones don't carry an SVG floor-plan of their own (2026-09-12 pivot —
// this is a mock stage, not a real venue-mapping tool), so each zone code
// borrows the abstract VIP/Gold/General region shapes ZoneMap ships with.
const ZONE_TOKEN: Record<string, "vip" | "gold" | "general"> = {
  VIP: "vip",
  GOLD: "gold",
  GENERAL: "general",
};
const ZONE_PATH: Record<"vip" | "gold" | "general", string> = {
  vip: "M 80 40 L 220 40 L 220 120 L 80 120 Z",
  gold: "M 40 130 L 260 130 L 260 220 L 40 220 Z",
  general: "M 20 230 L 280 230 L 280 340 L 20 340 Z",
};

export function BookClient({ eventSlug, eventId, tenantId, zones, passTypes, addons }: BookClientProps) {
  const router = useRouter();
  const t = useTranslations("Book");
  const tEvent = useTranslations("Event");
  const cart = useCartStore();
  const { phone, name } = useAuthStore();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (cart.eventSlug !== eventSlug) cart.initForEvent(eventSlug, eventId);
    // Only re-init when the event actually changes — cart actions are stable
    // zustand setters and would otherwise re-trigger this every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug, eventId, cart.eventSlug]);

  const zoneRegions: ZoneRegion[] = zones.map((z) => {
    const token = ZONE_TOKEN[z.code] ?? "general";
    return { id: z.id, label: z.name, token, path: ZONE_PATH[token], available: true };
  });

  const passTypesForZone = cart.zoneId ? passTypes.filter((pt) => pt.zoneId === cart.zoneId) : [];
  const selectedPassType = passTypes.find((pt) => pt.id === cart.passTypeId) ?? null;

  const addonsTotal = addons
    .filter((a) => cart.addonIds.includes(a.id))
    .reduce((sum, a) => sum + a.pricePaise, 0);
  const subtotal = cart.pricePaise * cart.quantity + addonsTotal;
  // Same `computeFees` the checkout page uses — the number quoted here and
  // the number charged there are the same number, by construction.
  const {
    platformFeePaise: platformFee,
    gatewayFeePaise: gatewayFee,
    gstPaise: gst,
    totalPaise: total,
  } = computeFees(subtotal);

  function handleSelectZone(zoneId: string) {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) cart.setZone(zone.id, zone.name, zone.color);
  }

  function handleSelectPassType(pt: BookPassType) {
    if (pt.available <= 0) return;
    cart.setPassType(pt.id, pt.name, pt.admits, pt.nightIds, pt.pricePaise);
  }

  async function handleContinueToPay() {
    setIsPending(true);
    try {
      const { orderId } = await createMockOrder({
        tenantId,
        eventId,
        buyerPhone: phone ?? "",
        buyerName: name ?? "",
      });
      cart.setOrderId(orderId);
      router.push(`/checkout/${orderId}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 pb-40 sm:px-6 lg:px-8 md:pb-8">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Step 1 — Zone */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("step1Title")}</h2>
            <div className="mt-3 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <ZoneMap zones={zoneRegions} selected={cart.zoneId ?? undefined} onSelect={handleSelectZone} />
              <div className="flex flex-1 flex-col gap-2">
                {zones.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => handleSelectZone(z.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      cart.zoneId === z.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-surface text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <span className="font-semibold" style={{ color: z.color ?? undefined }}>
                      {z.name}
                    </span>
                    {z.description && <span className="mt-0.5 block text-xs">{z.description}</span>}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Step 2 — Pass type */}
          {cart.zoneId && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("step2Title")}</h2>
              {passTypesForZone.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{t("selectPassPrompt")}</p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {passTypesForZone.map((pt) => {
                    const soldOut = pt.available <= 0;
                    const isSelected = cart.passTypeId === pt.id;
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => handleSelectPassType(pt)}
                        className={cn(
                          "flex flex-col rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          isSelected ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/50"
                        )}
                      >
                        <span className="font-semibold text-foreground">{pt.name}</span>
                        {pt.description && <span className="mt-1 text-xs text-muted-foreground">{pt.description}</span>}
                        <span className="mt-2 font-bold text-foreground">
                          <Money paise={pt.pricePaise} />
                        </span>
                        {soldOut ? (
                          <span className="mt-1 text-xs text-destructive">{tEvent("soldOut")}</span>
                        ) : pt.available < 100 ? (
                          <span className="mt-1 text-xs text-muted-foreground">{t("lowStock", { count: pt.available })}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Step 3 — Quantity */}
          {selectedPassType && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("step3Title")}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => cart.setQuantity(Math.max(selectedPassType.minPerOrder, cart.quantity - 1))}
                  disabled={cart.quantity <= selectedPassType.minPerOrder}
                  aria-label="Decrease quantity"
                >
                  −
                </Button>
                <span className="w-8 text-center font-semibold text-foreground">{cart.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => cart.setQuantity(Math.min(selectedPassType.maxPerOrder, cart.quantity + 1))}
                  disabled={cart.quantity >= selectedPassType.maxPerOrder}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t("min")} {selectedPassType.minPerOrder} · {t("max")} {selectedPassType.maxPerOrder}
                </span>
              </div>
            </section>
          )}

          {/* Step 4 — Add-ons */}
          {selectedPassType && addons.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("step4Title")}</h2>
              <div className="mt-3 space-y-2">
                {addons.map((a) => {
                  const checked = cart.addonIds.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => cart.toggleAddon(a.id)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        {a.name}
                      </span>
                      <Money paise={a.pricePaise} className="font-medium text-foreground" />
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Price breakdown — right rail on desktop, sticky bottom on mobile */}
        {selectedPassType && (
          <>
            <aside className="hidden md:block">
              <div className="sticky top-20 rounded-xl border border-border bg-surface p-4">
                <h2 className="text-sm font-semibold text-foreground">{t("priceBreakdown")}</h2>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {selectedPassType.name} × {cart.quantity}
                    </dt>
                    <dd>
                      <Money paise={cart.pricePaise * cart.quantity} />
                    </dd>
                  </div>
                  {addonsTotal > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t("addonsTitle")}</dt>
                      <dd>
                        <Money paise={addonsTotal} />
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Platform fee</dt>
                    <dd>
                      <Money paise={platformFee} />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Gateway fee</dt>
                    <dd>
                      <Money paise={gatewayFee} />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("gst")}</dt>
                    <dd>
                      <Money paise={gst} />
                    </dd>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold text-foreground">
                    <dt>{t("total")}</dt>
                    <dd>
                      <Money paise={total} />
                    </dd>
                  </div>
                </dl>
                <Button className="mt-4 w-full" size="lg" onClick={handleContinueToPay} disabled={isPending}>
                  {isPending ? "…" : t("continueToPay")}
                </Button>
              </div>
            </aside>

            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
              <div>
                <p className="text-xs text-muted-foreground">{t("total")}</p>
                <p className="text-base font-bold text-foreground">
                  <Money paise={total} />
                </p>
              </div>
              <Button size="lg" className="flex-1" onClick={handleContinueToPay} disabled={isPending}>
                {isPending ? "…" : t("continueToPay")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
