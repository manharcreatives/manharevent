"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/lib/dashboard-store";
import type { CheckIn } from "@manhar-garba/domain";
import { cn } from "@manhar-garba/ui";

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function CheckinFeed() {
  const { checkIns, liveSimRunning, addMockCheckIn, lastSimAt } = useDashboardStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!liveSimRunning) return;
    const interval = setInterval(() => {
      addMockCheckIn();
    }, 3000);
    return () => clearInterval(interval);
  }, [liveSimRunning, addMockCheckIn]);

  const staleSeconds = Math.round((now - lastSimAt) / 1000);
  const isStale = !liveSimRunning && staleSeconds > 10;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Live check-ins</span>
        {isStale
          ? <span suppressHydrationWarning className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">stale · {staleSeconds}s</span>
          : <span suppressHydrationWarning className="text-xs text-muted-foreground">updated {staleSeconds}s ago</span>
        }
      </div>
      <ul className="space-y-1.5">
        {checkIns.slice(0, 8).map((ci: CheckIn) => (
          <li
            key={ci.id}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-xs",
              ci.result === "allowed" ? "bg-success/10 text-success"
              : ci.result === "denied" ? "bg-destructive/10 text-destructive"
              : "bg-warning/10 text-warning"
            )}
          >
            <span className="font-mono">{ci.pass_id.slice(-8)}</span>
            <span className="capitalize">{ci.result}</span>
            <span suppressHydrationWarning className="text-right opacity-60">{timeAgo(ci.scanned_at)}</span>
          </li>
        ))}
        {checkIns.length === 0 && (
          <li className="text-xs text-muted-foreground">No check-ins yet</li>
        )}
      </ul>
    </div>
  );
}
