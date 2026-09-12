"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RegistrationStore {
  phone: string | null;
  applicationId: string | null;
  setPhone: (phone: string) => void;
  setApplicationId: (id: string) => void;
  reset: () => void;
}

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      phone: null,
      applicationId: null,
      setPhone: (phone) => set({ phone }),
      setApplicationId: (applicationId) => set({ applicationId }),
      reset: () => set({ phone: null, applicationId: null }),
    }),
    { name: "manhar-registration" }
  )
);
