"use client";

import { create } from "zustand";

/** Phone in transit between /login and /login/verify — mirrors registration-store.ts. */
interface LoginStore {
  phone: string | null;
  setPhone: (phone: string) => void;
  reset: () => void;
}

export const useLoginStore = create<LoginStore>()((set) => ({
  phone: null,
  setPhone: (phone) => set({ phone }),
  reset: () => set({ phone: null }),
}));
