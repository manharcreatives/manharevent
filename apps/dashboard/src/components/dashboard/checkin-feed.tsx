"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useDashboardStore } from "@/lib/dashboard-store";
import type { CheckIn } from "@manhar-garba/domain";
import { cn } from "@manhar-garba/ui";
import { passHolders, passes as allPasses, zones as allZones } from "@manhar-garba/mock-data";

/**
 * The seeded check-ins are stamped with the event's own dates, which are in
 * the future until the season starts — so this has to read forwards as well as
 * backwards, and in days once it passes a day. It used to subtract blindly and
 * print "-2005090s ago" on the overview on every screenshot before October.
 */
function timeAgo(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const ahead = seconds < 0;
  const diff = Math.abs(seconds);

  const amount =
    diff < 60 ? `${diff}s` :
    diff < 3600 ? `${Math.floor(diff / 60)}m` :
    diff < 86400 ? `${Math.floor(diff / 3600)}h` :
    `${Math.floor(diff / 86400)}d`;

  return ahead ? `in ${amount}` : `${amount} ago`;
}

/** Primary holder's name for a pass, falling back to its zone then its code. */
function holderFor(passId: string): string {
  const holder = passHolders.find((h) => h.pass_id === passId && h.holder_index === 1);
  if (holder?.full_name) return holder.full_name;
  const pass = allPasses.find((p) => p.id === passId);
  const zone = pass ? allZones.find((z) => z.id === pass.zone_id) : undefined;
  return zone ? `${zone.name} guest` : "Guest";
}

/** Short pass code, so a disputed scan is still traceable at the gate. */
function codeFor(passId: string): string {
  return allPasses.find((p) => p.id === passId)?.pass_code ?? passId.slice(-8);
}

export function CheckinFeed() {
  const { checkIns, liveSimRunning, addMockCheckIn, lastSimAt, currentEventId } = useDashboardStore();
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

  const staleSeconds = Math.max(0, Math.round((now - lastSimAt) / 1000));
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
            {/* A gate operator reads names, not ids. The code stays as the
                secondary line so a disputed scan can still be looked up. */}
            <span className="min-w-0 flex-1 truncate text-left">
              <span className="font-medium">{holderFor(ci.pass_id)}</span>
              <span className="ml-1.5 font-mono opacity-60">{codeFor(ci.pass_id)}</span>
            </span>
            <span className="capitalize">{ci.result}</span>
            <span suppressHydrationWarning className="text-right opacity-60">{timeAgo(ci.scanned_at)}</span>
          </li>
        ))}
        {checkIns.length === 0 && (
          <li className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            No scans yet tonight. Gate staff need a scanner code before doors open —{" "}
            <Link href="/dashboard/team/gate-staff" className="text-primary hover:underline">
              check gate coverage
            </Link>
            .
          </li>
        )}
      </ul>
      {checkIns.length > 0 && (
        <Link
          href={`/dashboard/events/${currentEventId}/checkins`}
          className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Every scan, gate by gate
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
