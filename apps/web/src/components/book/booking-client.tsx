"use client";

import { useState, useTransition } from "react";
import type { Event, Zone, PassType, PriceTier, EventNight, AddOn } from "@manhar-garba/domain";
import { Button, Money, ZoneMap } from "@manhar-garba/ui";
import type { ZoneRegion } from "@manhar-garba/ui";
import { useCartStore } from "@/lib/cart-store";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { createMockOrder } from "@/app/actions/order";
import { CheckCircle, ChevronRight, Minus, Plus, Shield, Users, Calendar } from "lucide-react";

const ZONE_TOKENS: Record<string, ZoneRegion["token"]> = {
  VIP: "vip",
  GOLD: "gold",
  GENERAL: "general",
};

const ZONE_PATHS: Record<string, string> = {
  VIP: "M 80 40 L 220 40 L 220 120 L 80 120 Z",
  GOLD: "M 40 130 L 260 130 L 260 220 L 40 220 Z",
  GENERAL: "M 20 230 L 280 230 L 280 340 L 20 340 Z",
};

function getCurrentPrice(passTypeId: string, priceTiers: PriceTier[]): number {
  const now = new Date().toISOString();
  const tiers = priceTiers
    .filter((t) => t.pass_type_id === passTypeId)
    .filter((t) => (!t.starts_at || t.starts_at <= now) && (!t.ends_at || t.ends_at >= now));
  if (!tiers.length) {
    const allTiers = priceTiers.filter((t) => t.pass_type_id === passTypeId);
    return allTiers.at(-1)?.price_paise ?? 0;
  }
  return tiers.sort((a, b) => b.sort_order - a.sort_order)[0]?.price_paise ?? 0;
}

interface Props {
  event: Event;
  zones: Zone[];
  passTypes: PassType[];
  priceTiers: PriceTier[];
  nights: EventNight[];
  addons: AddOn[];
}

export function BookingClient({ event, zones, passTypes, priceTiers, addons }: Props) {
  const router = useRouter();
  const cart = useCartStore();
  const { phone, name } = useAuthStore();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<0 | 1>(0);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(cart.zoneId);
  const [selectedPassTypeId, setSelectedPassTypeId] = useState<string | null>(cart.passTypeId);
  const [quantity, setQuantity] = useState(cart.quantity || 1);
  const [checkedAddons, setCheckedAddons] = useState<Set<string>>(new Set());

  const zoneRegions: ZoneRegion[] = zones.map((z) => ({
    id: z.id,
    label: z.name.replace(" Zone", ""),
    token: ZONE_TOKENS[z.code] ?? "general",
    path: ZONE_PATHS[z.code] ?? ZONE_PATHS["GENERAL"]!,
    available: true,
  }));

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const zonePassTypes = passTypes.filter((pt) => pt.zone_id === selectedZoneId && pt.status === "on_sale");
  const selectedPassType = passTypes.find((pt) => pt.id === selectedPassTypeId);

  const currentPrice = selectedPassTypeId ? getCurrentPrice(selectedPassTypeId, priceTiers) : 0;
  const zoneAddons = addons.filter((a) => a.status === "on_sale" && (a.zone_id === null || a.zone_id === selectedZoneId));

  const addonTotal = [...checkedAddons].reduce((acc, addonId) => {
    const a = addons.find((ad) => ad.id === addonId);
    return acc + (a?.price_paise ?? 0);
  }, 0);

  const subtotal = currentPrice * quantity + addonTotal;
  const convFee = Math.round(subtotal * 0.025);
  const gst = Math.round((subtotal + convFee) * 0.18);
  const total = subtotal + convFee + gst;

  function handleZoneSelect(zoneId: string) {
    setSelectedZoneId(zoneId);
    setSelectedPassTypeId(null);
    setStep(1);
    const z = zones.find((z) => z.id === zoneId);
    if (z) cart.setZone(z.id, z.name, z.color);
  }

  function handlePassTypeSelect(passTypeId: string) {
    const pt = passTypes.find((p) => p.id === passTypeId);
    if (!pt) return;
    const price = getCurrentPrice(passTypeId, priceTiers);
    setSelectedPassTypeId(passTypeId);
    setQuantity(1);
    cart.setPassType(passTypeId, pt.name, pt.admits, pt.night_ids, price);
  }

  function toggleAddon(addonId: string) {
    setCheckedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
    cart.toggleAddon(addonId);
  }

  function handleContinueToPay() {
    if (!selectedPassType) return;
    startTransition(async () => {
      const buyerPhone = phone ?? "+919900000000";
      const buyerName = name ?? "Guest";
      const { orderId } = await createMockOrder({
        tenantId: event.tenant_id,
        eventId: event.id,
        buyerPhone,
        buyerName,
      });
      cart.setOrderId(orderId);
      router.push(`/checkout/${orderId}`);
    });
  }

  // ── Step 0: Zone selection ───────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Select your zone</h1>
        <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Zone map */}
          <ZoneMap
            zones={zoneRegions}
            selected={selectedZoneId ?? undefined}
            onSelect={handleZoneSelect}
            className="w-48 shrink-0"
          />

          {/* Zone cards */}
          <div className="w-full space-y-3">
            {zones.map((zone) => {
              const zPassTypes = passTypes.filter((pt) => pt.zone_id === zone.id && pt.status === "on_sale");
              const lowestPrice = Math.min(...zPassTypes.map((pt) => getCurrentPrice(pt.id, priceTiers)));
              const availCount = zone.capacity - (passTypes.filter((pt) => pt.zone_id === zone.id).reduce((s, pt) => s + pt.sold_quantity, 0));

              return (
                <button
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone.id)}
                  className="group w-full rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-pressed={selectedZoneId === zone.id}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: zone.color ?? undefined }}
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{zone.name}</p>
                      {zone.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{zone.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        {lowestPrice > 0 && (
                          <span>
                            From <Money paise={lowestPrice} locale="en" />
                          </span>
                        )}
                        {availCount > 0 && <span>{availCount.toLocaleString()} seats left</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Pass type + quantity + addons + summary ──────────────────────
  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      {/* Back to zone */}
      <button
        onClick={() => { setStep(0); setSelectedPassTypeId(null); }}
        className="-ml-1 mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to zone selection
      </button>

      {/* Selected zone */}
      {selectedZone && (
        <div className="mb-5 flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: selectedZone.color ?? undefined }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-foreground">{selectedZone.name}</span>
        </div>
      )}

      <h1 className="font-display text-xl font-bold text-foreground">Choose your pass</h1>

      {/* Pass types */}
      <div className="mt-4 space-y-3">
        {zonePassTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">No passes available for this zone.</p>
        )}
        {zonePassTypes.map((pt) => {
          const price = getCurrentPrice(pt.id, priceTiers);
          const isSelected = selectedPassTypeId === pt.id;
          const remaining = pt.total_quantity - pt.sold_quantity - pt.held_quantity;

          return (
            <button
              key={pt.id}
              onClick={() => handlePassTypeSelect(pt.id)}
              className={`group w-full rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface hover:border-primary"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{pt.name}</p>
                    {isSelected && <CheckCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  </div>
                  {pt.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{pt.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Admits {pt.admits}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {pt.night_ids.length} {pt.night_ids.length === 1 ? "night" : "nights"}
                    </span>
                    {remaining < 50 && remaining > 0 && (
                      <span className="text-destructive">Only {remaining} left</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-foreground">
                    <Money paise={price} locale="en" />
                  </p>
                  <p className="text-xs text-muted-foreground">per pass</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quantity + addons — only show after pass type selected */}
      {selectedPassType && (
        <>
          {/* Quantity stepper */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground">How many passes?</h2>
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(selectedPassType.min_per_order, quantity - 1))}
                disabled={quantity <= selectedPassType.min_per_order}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-lg font-bold text-foreground">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedPassType.max_per_order, quantity + 1))}
                disabled={quantity >= selectedPassType.max_per_order}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="ml-1 text-sm text-muted-foreground">
                Max {selectedPassType.max_per_order} per order
              </span>
            </div>
          </div>

          {/* Add-ons — NEVER pre-checked */}
          {zoneAddons.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-foreground">Add-ons</h2>
              <p className="text-xs text-muted-foreground">Optional — select only what you need</p>
              <div className="mt-3 space-y-2">
                {zoneAddons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface p-3 hover:border-primary"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checkedAddons.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{addon.name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      <Money paise={addon.price_paise} locale="en" />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price breakdown */}
          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">Price breakdown</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {selectedPassType.name} × {quantity}
                </dt>
                <dd className="text-foreground">
                  <Money paise={currentPrice * quantity} locale="en" />
                </dd>
              </div>
              {[...checkedAddons].map((addonId) => {
                const a = addons.find((ad) => ad.id === addonId);
                if (!a) return null;
                return (
                  <div key={addonId} className="flex justify-between">
                    <dt className="text-muted-foreground">{a.name}</dt>
                    <dd className="text-foreground"><Money paise={a.price_paise} locale="en" /></dd>
                  </div>
                );
              })}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Convenience fee</dt>
                <dd className="text-foreground"><Money paise={convFee} locale="en" /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">GST (18%)</dt>
                <dd className="text-foreground"><Money paise={gst} locale="en" /></dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt className="text-foreground">Total</dt>
                <dd className="text-foreground"><Money paise={total} locale="en" /></dd>
              </div>
            </dl>
          </div>

          {/* Trust + CTA */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
            <span>Secured by Razorpay. Your QR appears instantly after payment.</span>
          </div>

          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={handleContinueToPay}
            disabled={isPending || !selectedPassType}
          >
            {isPending ? "Creating order…" : "Continue to Pay →"}
          </Button>
        </>
      )}
    </div>
  );
}
