"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  phone: string | null;
  name: string | null;
  isAuthenticated: boolean;
  setPhone: (phone: string) => void;
  setName: (name: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      phone: null,
      name: null,
      isAuthenticated: false,
      setPhone: (phone) => set({ phone }),
      setName: (name) => set({ name, isAuthenticated: true }),
      signOut: () => set({ phone: null, name: null, isAuthenticated: false }),
    }),
    { name: "manhar-auth" }
  )
);
