"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound, LogOut } from "lucide-react";
import { clearSession } from "@/lib/session";
import { useGateSession } from "./GateSessionGuard";

/**
 * Names the person scanning, always on screen.
 *
 * Two reasons it's not tucked into a menu: a guard handing the phone to the
 * next shift needs to see at a glance that it's still signed in as them, and a
 * supervisor walking the line can check the right person is on the right gate
 * without touching anything.
 */
export function GateIdentityBar({ nightLabel }: { nightLabel?: string } = {}) {
  const session = useGateSession();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div
      className="flex items-center gap-2 border-b border-border/60 px-3 py-2"
      style={{ backgroundColor: "hsl(240 12% 6% / 0.95)" }}
    >
      <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-foreground">{session.staffName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {session.gateLabel}
          {nightLabel && <span className="ml-1.5 text-muted-foreground/70">· {nightLabel}</span>}
        </p>
      </div>

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={signOut}
            className="min-h-[36px] rounded-lg bg-destructive px-3 text-xs font-semibold text-white active:scale-95"
          >
            Sign out
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="min-h-[36px] rounded-lg border border-border px-3 text-xs text-muted-foreground active:scale-95"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          aria-label="Sign out"
          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-muted-foreground active:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
