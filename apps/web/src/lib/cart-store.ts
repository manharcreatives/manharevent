"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartState {
  eventSlug: string | null;
  eventId: string | null;
  zoneId: string | null;
  zoneName: string | null;
  zoneColor: string | null;
  passTypeId: string | null;
  passTypeName: string | null;
  passTypeAdmits: number;
  passTypeNightIds: string[];
  pricePaise: number;
  quantity: number;
  addonIds: string[];
  promoCode: string | null;
  promoDiscountPaise: number;
  orderId: string | null;
  step: 0 | 1 | 2 | 3;
}

interface CartActions {
  initForEvent: (slug: string, eventId: string) => void;
  setZone: (zoneId: string, zoneName: string, zoneColor: string | null) => void;
  setPassType: (
    passTypeId: string,
    passTypeName: string,
    admits: number,
    nightIds: string[],
    pricePaise: number
  ) => void;
  setQuantity: (qty: number) => void;
  setNightIds: (nightIds: string[]) => void;
  toggleAddon: (addonId: string) => void;
  setPromo: (code: string, discountPaise: number) => void;
  clearPromo: () => void;
  setOrderId: (orderId: string) => void;
  setStep: (step: 0 | 1 | 2 | 3) => void;
  reset: () => void;
}

const defaultState: CartState = {
  eventSlug: null,
  eventId: null,
  zoneId: null,
  zoneName: null,
  zoneColor: null,
  passTypeId: null,
  passTypeName: null,
  passTypeAdmits: 1,
  passTypeNightIds: [],
  pricePaise: 0,
  quantity: 1,
  addonIds: [],
  promoCode: null,
  promoDiscountPaise: 0,
  orderId: null,
  step: 0,
};

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set) => ({
      ...defaultState,

      initForEvent: (slug, eventId) =>
        set({ ...defaultState, eventSlug: slug, eventId }),

      setZone: (zoneId, zoneName, zoneColor) =>
        set({ zoneId, zoneName, zoneColor, passTypeId: null, step: 1 }),

      setPassType: (passTypeId, passTypeName, admits, nightIds, pricePaise) =>
        set({ passTypeId, passTypeName, passTypeAdmits: admits, passTypeNightIds: nightIds, pricePaise, step: 2 }),

      setQuantity: (qty) => set({ quantity: qty, step: 3 }),

      // USR-31: single-night passes don't have a fixed night_ids — the buyer
      // picks one, and this is what flows into the pass/QR at pay time.
      setNightIds: (nightIds) => set({ passTypeNightIds: nightIds }),

      toggleAddon: (addonId) =>
        set((s) => ({
          addonIds: s.addonIds.includes(addonId)
            ? s.addonIds.filter((id) => id !== addonId)
            : [...s.addonIds, addonId],
        })),

      setPromo: (code, discountPaise) => set({ promoCode: code, promoDiscountPaise: discountPaise }),
      clearPromo: () => set({ promoCode: null, promoDiscountPaise: 0 }),

      setOrderId: (orderId) => set({ orderId }),

      setStep: (step) => set({ step }),

      reset: () => set(defaultState),
    }),
    { name: "manhar-cart" }
  )
);
