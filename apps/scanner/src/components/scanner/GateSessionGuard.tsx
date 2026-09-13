"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { loadSession, type GateSession } from "@/lib/session";
import { ScannerShell } from "./ScannerShell";

const SessionContext = createContext<GateSession | null>(null);

/**
 * Every scanner screen must know *who* is scanning — the check-in record needs
 * a real staff id, not a bare device id, or a lost phone is untraceable. This
 * hook is only callable below the guard, so that id is never null downstream.
 */
export function useGateSession(): GateSession {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useGateSession must be used inside <GateSessionGuard>");
  }
  return session;
}

/**
 * Client-side guard rather than middleware: the session lives in localStorage
 * so that the scanner still opens with no network, and middleware can't read
 * localStorage. The trade-off is that the server has nothing to render until the
 * bundle runs — which is why the fallback is a full shell and not a spinner.
 * This one component is what every /scan/* route paints first, so a bare
 * <Loader2/> here meant the entire app server-rendered an empty screen.
 */
export function GateSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<GateSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const existing = loadSession();
    if (!existing) {
      router.replace("/login");
      return;
    }
    setSession(existing);
    setChecked(true);
  }, [router]);

  if (!checked || !session) {
    return <ScannerShell subtitle="Checking this phone's gate sign-in" />;
  }

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
