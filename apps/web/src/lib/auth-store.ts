"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Attendee session.
 *
 * The number is what identifies a buyer everywhere — passes, orders, refunds
 * and the gate all key off it — so `confirmPhone` (called once the OTP step
 * clears) is what makes a session real. The display name is optional: someone
 * who skips it is still signed in, which the previous version got wrong. It
 * only set `isAuthenticated` inside `setName`, so anyone who tapped "Skip for
 * now" landed in /me half-signed-in, seeing empty tabs with no way to fix it.
 */
interface AuthStore {
  phone: string | null;
  name: string | null;
  isAuthenticated: boolean;
  /** Remember the number while the OTP step is in flight. Not a sign-in. */
  setPhone: (phone: string) => void;
  /** OTP cleared — this is the moment the session becomes real. */
  confirmPhone: (phone: string) => void;
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
      confirmPhone: (phone) => set({ phone, isAuthenticated: true }),
      setName: (name) => set({ name, isAuthenticated: true }),
      signOut: () => set({ phone: null, name: null, isAuthenticated: false }),
    }),
    { name: "manhar-auth" }
  )
);
