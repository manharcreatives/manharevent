"use client";

import Link from "next/link";
import { Play, Pause, ArrowRight } from "lucide-react";
import { StatTile, Money } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { LiveOccupancyMeter } from "@/components/dashboard/live-occupancy-meter";
import { CheckinFeed } from "@/components/dashboard/checkin-feed";
import { useHydrated } from "@/lib/use-hydrated";
import { seasonSales, expectedAttendanceByNight, currentNight, insideByZone } from "@/lib/metrics";

/** The seeded Manhar tenant's rich dashboard home — client-store-driven, demo
 * mode only (see (dashboard)/dashboard/page.tsx for who gets routed here). */
export function ManharOverview() {
  const hydrated = useHydrated();
  const s = useDashboardStore();

  const event = s.events.find((e) => e.id === s.currentEventId) ?? s.events[0];
  if (!hydrated || !event) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const nights = s.nights.filter((n) => n.event_id === event.id);
  const zones = s.zones.filter((z) => z.event_id === event.id);
  const passTypes = s.passTypes.filter((p) => p.event_id === event.id);
  const passTypeIds = new Set(passTypes.map((p) => p.id));
  const priceTiers = s.priceTiers.filter((t) => passTypeIds.has(t.pass_type_id));
  const checkIns = s.checkIns.filter((c) => c.event_id === event.id);

  // All derived. This page used to show a hardcoded sales array, "Night 5"
  // in the heading, occupancy at capacity × 0.62, and a made-up top-five list.
  const sales = seasonSales(passTypes, priceTiers, zones);
  const attendance = expectedAttendanceByNight(nights, passTypes);
  const upcoming = currentNight(nights);
  const occupancy = insideByZone(checkIns, zones, upcoming?.mode === "tonight" ? upcoming.night.id : undefined);
  const inside = occupancy.reduce((sum, z) => sum + z.current, 0);
  const expectedNext = attendance.find((a) => a.nightId === upcoming?.night.id)?.value ?? 0;

  const subtitle = !upcoming
    ? "No nights scheduled"
    : upcoming.mode === "tonight"
      ? `Night ${upcoming.night.night_number} is tonight`
      : upcoming.mode === "after"
        ? "Season complete"
        : `Night ${upcoming.night.night_number} in ${upcoming.daysAway} day${upcoming.daysAway === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <Link href={`/dashboard/events/${event.id}`} className="hover:text-foreground">{event.title}</Link> · {subtitle}
          </p>
        </div>
        <button
          onClick={s.liveSimRunning ? s.pauseLiveSim : s.startLiveSim}
          title="Adds a simulated gate scan every few seconds so the live panels move during a demo"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {s.liveSimRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {s.liveSimRunning ? "Pause gate simulation" : "Simulate gate scans"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Passes sold" value={sales.passesSold.toLocaleString("en-IN")} sub={`${sales.admitsSold.toLocaleString("en-IN")} people`} className="border-primary/30" />
        <StatTile label="Ticket sales" value={<Money paise={sales.grossPaise} />} sub="Season to date" className="border-primary/30" />
        <StatTile label="Inside now" value={inside.toLocaleString("en-IN")} sub="From gate scans" className="border-primary/30" />
        <StatTile label={upcoming?.mode === "tonight" ? "Expected tonight" : "Expected next night"} value={expectedNext.toLocaleString("en-IN")} sub="Valid passes" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
          <SalesChart data={attendance} label="Expected attendance by night" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <CheckinFeed />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Zone occupancy</h2>
          <LiveOccupancyMeter zones={occupancy} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Top pass types</h2>
            <Link href={`/dashboard/events/${event.id}/reports`} className="flex items-center gap-1 text-xs text-primary hover:underline">
              Reports <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {sales.byPassType.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pass types yet.</p>
          ) : (
            <ul className="space-y-2">
              {sales.byPassType.slice(0, 5).map((pt, i) => (
                <li key={pt.passTypeId} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 truncate text-foreground">{pt.name}</span>
                  <span className="tabular text-muted-foreground">{pt.sold.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
