"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Money, ZoneMap, cn } from "@manhar-garba/ui";
import type { ZoneRegion } from "@manhar-garba/ui";
import { computeFees } from "@manhar-garba/domain";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { createMockOrder } from "@/app/actions/order";
import { inkOn } from "@/lib/contrast";
import { Check, Users, Moon, ShieldCheck, Clock, ChevronDown, ArrowRight } from "lucide-react";

export interface BookZone {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  capacity: number;
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
  eventTitle: string;
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
const ZONE_RECT: Record<"vip" | "gold" | "general", { x: number; y: number; width: number; height: number }> = {
  vip: { x: 80, y: 46, width: 140, height: 78 },
  gold: { x: 40, y: 136, width: 220, height: 88 },
  general: { x: 20, y: 236, width: 260, height: 108 },
};

const TOTAL_STEPS = 4;

export function BookClient({
  eventSlug,
  eventId,
  eventTitle,
  tenantId,
  zones,
  passTypes,
  addons,
}: BookClientProps) {
  const router = useRouter();
  const t = useTranslations("Book");
  const tEvent = useTranslations("Event");
  const cart = useCartStore();
  const { phone, name } = useAuthStore();
  const [isPending, setIsPending] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (cart.eventSlug !== eventSlug) cart.initForEvent(eventSlug, eventId);
    // Only re-init when the event actually changes — cart actions are stable
    // zustand setters and would otherwise re-trigger this every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug, eventId, cart.eventSlug]);

  // Cheapest on-sale price per zone — drives the "from ₹X" on each zone card
  // and the default selection below.
  const zoneFromPaise = useMemo(() => {
    const map = new Map<string, number>();
    for (const pt of passTypes) {
      if (pt.available <= 0) continue;
      const current = map.get(pt.zoneId);
      if (current === undefined || pt.pricePaise < current) map.set(pt.zoneId, pt.pricePaise);
    }
    return map;
  }, [passTypes]);

  // Arriving with nothing chosen used to render a zone map, three cards and an
  // ocean of white space — every later step was hidden behind `cart.zoneId`.
  // Now the flow opens on the cheapest zone that is actually on sale, so the
  // page is useful on first paint and choosing a dearer zone is a deliberate
  // upgrade rather than the only way to see any prices at all.
  useEffect(() => {
    if (cart.zoneId || cart.eventSlug !== eventSlug) return;
    const candidates = zones.filter((z) => zoneFromPaise.has(z.id));
    if (candidates.length === 0) return;
    const cheapest = candidates.reduce((best, z) =>
      (zoneFromPaise.get(z.id) ?? Infinity) < (zoneFromPaise.get(best.id) ?? Infinity) ? z : best
    );
    cart.setZone(cheapest.id, cheapest.name, cheapest.color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.zoneId, cart.eventSlug, eventSlug, zones, zoneFromPaise]);

  const zoneRegions: ZoneRegion[] = zones.map((z) => {
    const token = ZONE_TOKEN[z.code] ?? "general";
    return { id: z.id, label: z.name, token, ...ZONE_RECT[token], available: zoneFromPaise.has(z.id) };
  });

  const selectedZone = zones.find((z) => z.id === cart.zoneId) ?? null;
  const passTypesForZone = cart.zoneId ? passTypes.filter((pt) => pt.zoneId === cart.zoneId) : [];
  const selectedPassType = passTypes.find((pt) => pt.id === cart.passTypeId) ?? null;
  const selectedAddons = addons.filter((a) => cart.addonIds.includes(a.id));

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.pricePaise, 0);
  const subtotal = cart.pricePaise * cart.quantity + addonsTotal;
  // Same `computeFees` the checkout page uses — the number quoted here and
  // the number charged there are the same number, by construction.
  const {
    platformFeePaise: platformFee,
    gatewayFeePaise: gatewayFee,
    gstPaise: gst,
    totalPaise: total,
  } = computeFees(subtotal);

  const stepDone = [Boolean(selectedZone), Boolean(selectedPassType), Boolean(selectedPassType), Boolean(selectedPassType)];
  const currentStep = selectedPassType ? 3 : selectedZone ? 2 : 1;
  const canPay = Boolean(selectedPassType) && cart.quantity > 0;

  function handleSelectZone(zoneId: string) {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) cart.setZone(zone.id, zone.name, zone.color);
  }

  function handleSelectPassType(pt: BookPassType) {
    if (pt.available <= 0) return;
    cart.setPassType(pt.id, pt.name, pt.admits, pt.nightIds, pt.pricePaise);
    if (cart.quantity < pt.minPerOrder) cart.setQuantity(pt.minPerOrder);
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

  function jumpToStep(n: number) {
    document.getElementById(`book-step-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const summaryLines = (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">
          {selectedPassType ? `${selectedPassType.name} × ${cart.quantity}` : t("step2Title")}
        </dt>
        <dd className="tabular-nums text-foreground">
          <Money paise={cart.pricePaise * cart.quantity} />
        </dd>
      </div>
      {selectedAddons.map((a) => (
        <div key={a.id} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{a.name}</dt>
          <dd className="tabular-nums text-foreground">
            <Money paise={a.pricePaise} />
          </dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-border pt-1.5">
        <dt className="text-muted-foreground">{t("subtotal")}</dt>
        <dd className="tabular-nums text-foreground">
          <Money paise={subtotal} />
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{t("platformFee")}</dt>
        <dd className="tabular-nums text-foreground">
          <Money paise={platformFee} />
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{t("gatewayFee")}</dt>
        <dd className="tabular-nums text-foreground">
          <Money paise={gatewayFee} />
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{t("gst")}</dt>
        <dd className="tabular-nums text-foreground">
          <Money paise={gst} />
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-bold text-foreground">
        <dt>{t("total")}</dt>
        <dd className="tabular-nums">
          <Money paise={total} />
        </dd>
      </div>
    </dl>
  );

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-44 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eventTitle}</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">{t("title")}</h1>
      </header>

      {/* Progress rail — four steps, always visible, so the shape of the task is
          obvious before anything has been chosen. */}
      <ol className="mt-5 flex items-center gap-1.5 sm:gap-2" aria-label={t("title")}>
        {[1, 2, 3, 4].map((n) => {
          const done = stepDone[n - 1];
          const active = n === currentStep;
          return (
            <li key={n} className="flex flex-1 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => jumpToStep(n)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "border-2 border-primary bg-primary/10 text-primary"
                      : "border border-border bg-surface text-muted-foreground"
                )}
                aria-label={t("stepOf", { current: n, total: TOTAL_STEPS })}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : n}
              </button>
              {n < TOTAL_STEPS && (
                <span
                  className={cn("h-0.5 flex-1 rounded-full", done ? "bg-primary/60" : "bg-border")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="space-y-10">
          {/* ── Step 1 — Zone ───────────────────────────────────────────── */}
          <Step id={1} title={t("step1Title")} subtitle={t("step1Sub")} stepLabel={t("stepOf", { current: 1, total: TOTAL_STEPS })}>
            <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-start">
              <div className="mx-auto w-full max-w-[240px] sm:mx-0">
                <ZoneMap zones={zoneRegions} selected={cart.zoneId ?? undefined} onSelect={handleSelectZone} />
              </div>
              <div className="flex flex-col gap-2">
                {zones.map((z) => {
                  const fromPaise = zoneFromPaise.get(z.id);
                  const isSelected = cart.zoneId === z.id;
                  const soldOut = fromPaise === undefined;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => handleSelectZone(z.id)}
                      disabled={soldOut}
                      aria-pressed={isSelected}
                      className={cn(
                        "group flex min-h-[56px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                        soldOut && "cursor-not-allowed opacity-55",
                        isSelected
                          ? "border-primary bg-primary/8 ring-1 ring-primary/40"
                          : "border-border bg-surface hover:border-primary/50"
                      )}
                    >
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: z.color ?? undefined, color: inkOn(z.color) }}
                        aria-hidden="true"
                      >
                        {z.code.slice(0, 3)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">{z.name}</span>
                        {z.description && (
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{z.description}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-right">
                        {soldOut ? (
                          <span className="text-xs font-medium text-muted-foreground">{t("soldOutZone")}</span>
                        ) : (
                          <>
                            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                              {tEvent("priceFrom", { price: "" })}
                            </span>
                            <span className="block text-sm font-bold tabular-nums text-foreground">
                              <Money paise={fromPaise} />
                            </span>
                          </>
                        )}
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </Step>

          {/* ── Step 2 — Pass type ──────────────────────────────────────── */}
          <Step
            id={2}
            title={t("step2Title")}
            subtitle={t("step2Sub")}
            stepLabel={t("stepOf", { current: 2, total: TOTAL_STEPS })}
            muted={!selectedZone}
          >
            {!selectedZone ? (
              <Placeholder>{t("selectZonePrompt")}</Placeholder>
            ) : passTypesForZone.length === 0 ? (
              <Placeholder>{t("noPassesInZone")}</Placeholder>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {passTypesForZone.map((pt) => {
                  const soldOut = pt.available <= 0;
                  const isSelected = cart.passTypeId === pt.id;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => handleSelectPassType(pt)}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative flex flex-col rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                        isSelected
                          ? "border-primary bg-primary/8 ring-1 ring-primary/40"
                          : "border-border bg-surface hover:border-primary/50"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">{t("selected")}</span>
                        </span>
                      )}
                      <span className="pr-6 font-semibold text-foreground">{pt.name}</span>
                      {pt.description && (
                        <span className="mt-1 text-xs leading-snug text-muted-foreground">{pt.description}</span>
                      )}
                      <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          {t("admits", { count: pt.admits })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                          {t("nightsCovered", { count: pt.nightIds.length })}
                        </span>
                      </span>
                      <span className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          <Money paise={pt.pricePaise} />
                        </span>
                        <span className="text-xs text-muted-foreground">{t("perPass")}</span>
                      </span>
                      {soldOut ? (
                        <span className="mt-1 text-xs font-medium text-destructive">{tEvent("soldOut")}</span>
                      ) : pt.available < 100 ? (
                        <span className="mt-1 text-xs font-medium text-warning">{t("lowStock", { count: pt.available })}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          {/* ── Step 3 — Quantity ───────────────────────────────────────── */}
          <Step
            id={3}
            title={t("step3Title")}
            subtitle={t("step3Sub")}
            stepLabel={t("stepOf", { current: 3, total: TOTAL_STEPS })}
            muted={!selectedPassType}
          >
            {!selectedPassType ? (
              <Placeholder>{t("pickPassFirst")}</Placeholder>
            ) : (
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 text-lg"
                    onClick={() => cart.setQuantity(Math.max(selectedPassType.minPerOrder, cart.quantity - 1))}
                    disabled={cart.quantity <= selectedPassType.minPerOrder}
                    aria-label={t("decreaseQuantity")}
                  >
                    −
                  </Button>
                  <span
                    className="w-10 text-center font-display text-xl font-bold tabular-nums text-foreground"
                    aria-live="polite"
                  >
                    {cart.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 text-lg"
                    onClick={() => cart.setQuantity(Math.min(selectedPassType.maxPerOrder, cart.quantity + 1))}
                    disabled={cart.quantity >= selectedPassType.maxPerOrder}
                    aria-label={t("increaseQuantity")}
                  >
                    +
                  </Button>
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-foreground">
                    {t("admitsTotal", { count: selectedPassType.admits * cart.quantity })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("min")} {selectedPassType.minPerOrder} · {t("max")} {selectedPassType.maxPerOrder}
                  </p>
                </div>
              </div>
            )}
          </Step>

          {/* ── Step 4 — Add-ons ────────────────────────────────────────── */}
          <Step
            id={4}
            title={t("step4Title")}
            subtitle={t("step4Sub")}
            stepLabel={t("stepOf", { current: 4, total: TOTAL_STEPS })}
            muted={!selectedPassType}
            optionalLabel={t("addonsTitle")}
          >
            {addons.length === 0 ? (
              <Placeholder>{t("noAddons")}</Placeholder>
            ) : !selectedPassType ? (
              <Placeholder>{t("selectPassPrompt")}</Placeholder>
            ) : (
              <div className="space-y-2">
                {addons.map((a) => {
                  const checked = cart.addonIds.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        "flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                        checked ? "border-primary bg-primary/8" : "border-border bg-surface hover:border-primary/50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => cart.toggleAddon(a.id)}
                          className="h-4.5 w-4.5 rounded border-border accent-primary"
                        />
                        <span className="font-medium text-foreground">{a.name}</span>
                      </span>
                      <Money paise={a.pricePaise} className="shrink-0 font-semibold tabular-nums text-foreground" />
                    </label>
                  );
                })}
              </div>
            )}
          </Step>
        </div>

        {/* ── Summary: right rail on desktop ──────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-base font-bold text-foreground">{t("yourOrder")}</h2>
            {selectedZone && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: selectedZone.color ?? undefined }}
                  aria-hidden="true"
                />
                {selectedZone.name}
              </p>
            )}

            <div className="mt-4">
              {selectedPassType ? (
                summaryLines
              ) : (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  {t("emptyTotalHint")}
                </p>
              )}
            </div>

            <Button
              className="mt-5 w-full"
              size="lg"
              onClick={canPay ? handleContinueToPay : () => jumpToStep(2)}
              disabled={isPending}
            >
              {isPending ? "…" : canPay ? t("continueToPay") : t("step2Title")}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Button>

            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t("holdNote")}
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                {t("feeNote")}
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* ── Summary: sticky bar on mobile ───────────────────────────────
          Sits above the bottom tab bar, expands to the full breakdown so the
          fee lines are never something a buyer only meets at checkout. */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        {summaryOpen && selectedPassType && (
          <div className="max-h-[46vh] overflow-y-auto border-b border-border px-4 py-3">{summaryLines}</div>
        )}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            {selectedPassType ? (
              <button
                type="button"
                onClick={() => setSummaryOpen((v) => !v)}
                aria-expanded={summaryOpen}
                className="flex min-h-[44px] flex-col justify-center text-left"
              >
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {t("total")}
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", summaryOpen && "rotate-180")}
                    aria-hidden="true"
                  />
                  <span className="underline underline-offset-2">
                    {summaryOpen ? t("hideSummary") : t("showSummary")}
                  </span>
                </span>
                <span className="text-lg font-bold tabular-nums text-foreground">
                  <Money paise={total} />
                </span>
              </button>
            ) : (
              <p className="py-1 text-xs leading-snug text-muted-foreground">{t("emptyTotalHint")}</p>
            )}
          </div>
          <Button
            size="lg"
            className="shrink-0"
            onClick={canPay ? handleContinueToPay : () => jumpToStep(2)}
            disabled={isPending}
          >
            {isPending ? "…" : canPay ? t("continueToPay") : t("step2Title")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** One numbered step. Rendered whether or not it can be acted on yet — the
 *  scaffolding is what tells a first-time visitor how long the task is. */
function Step({
  id,
  title,
  subtitle,
  stepLabel,
  muted = false,
  optionalLabel,
  children,
}: {
  id: number;
  title: string;
  subtitle: string;
  stepLabel: string;
  muted?: boolean;
  optionalLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`book-step-${id}`} aria-label={`${stepLabel}: ${title}`} className="scroll-mt-24">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            muted ? "border border-border bg-surface text-muted-foreground" : "bg-primary text-primary-foreground"
          )}
          aria-hidden="true"
        >
          {id}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold leading-tight text-foreground">
            {title}
            {optionalLabel && (
              <span className="ml-2 align-middle text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {optionalLabel}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className={cn("mt-4 pl-0 sm:pl-10", muted && "opacity-70")}>{children}</div>
    </section>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
