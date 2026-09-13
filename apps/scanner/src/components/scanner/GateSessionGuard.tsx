"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { loadSession, type GateSession } from "@/lib/session";

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
 * localStorage. The trade-off is a brief spinner on first paint, which is
 * cheaper than a scanner that refuses to start when the venue wifi drops.
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
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
