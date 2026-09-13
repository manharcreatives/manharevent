"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Everything the organizer typed on the details step. Kept client-side so the
 *  status and provisioned screens can show their real answers back to them
 *  even when the mock repo (in-memory, per server process) has forgotten the
 *  application — which is exactly what happens after a redeploy or a restart
 *  mid-demo. */
export interface RegistrationDraft {
  orgName: string;
  contactName: string;
  city: string;
  roughCapacity: string;
  desiredDomain: string;
}

export const EMPTY_DRAFT: RegistrationDraft = {
  orgName: "",
  contactName: "",
  city: "",
  roughCapacity: "",
  desiredDomain: "",
};

interface RegistrationStore {
  phone: string | null;
  /** Set once the OTP step is cleared, so /register/verify can't be deep-linked
   *  into the details form without a number. */
  otpVerifiedAt: string | null;
  applicationId: string | null;
  submittedAt: string | null;
  draft: RegistrationDraft;
  setPhone: (phone: string) => void;
  setOtpVerified: () => void;
  setDraft: (patch: Partial<RegistrationDraft>) => void;
  setApplicationId: (id: string) => void;
  reset: () => void;
}

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      phone: null,
      otpVerifiedAt: null,
      applicationId: null,
      submittedAt: null,
      draft: EMPTY_DRAFT,
      setPhone: (phone) => set({ phone }),
      setOtpVerified: () => set({ otpVerifiedAt: new Date().toISOString() }),
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      setApplicationId: (applicationId) =>
        set({ applicationId, submittedAt: new Date().toISOString() }),
      reset: () =>
        set({
          phone: null,
          otpVerifiedAt: null,
          applicationId: null,
          submittedAt: null,
          draft: EMPTY_DRAFT,
        }),
    }),
    { name: "manhar-registration" }
  )
);

/**
 * These pages are statically prerendered with an empty store, then zustand
 * rehydrates from localStorage synchronously on the client. Rendering store
 * values before this flips would be a hydration mismatch, so every screen that
 * branches on saved state waits for it.
 */
export function useRegistrationHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
