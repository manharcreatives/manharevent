"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { StatTile, Money } from "@manhar-garba/ui";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { LiveOccupancyMeter } from "@/components/dashboard/live-occupancy-meter";
import { CheckinFeed } from "@/components/dashboard/checkin-feed";
import { Play, Pause } from "lucide-react";

// Simulated nightly sales data for the chart
const NIGHTLY_SALES = [
  { label: "N1", value: 1240 },
  { label: "N2", value: 1560 },
  { label: "N3", value: 1380 },
  { label: "N4", value: 1750 },
  { label: "N5", value: 1920 },
  { label: "N6", value: 1420 },
  { label: "N7", value: 1100 },
  { label: "N8", value: 980 },
  { label: "N9", value: 0 },
];

export default function LiveOverviewPage() {
  const {
    orders, checkIns, zones,
    liveSimRunning, startLiveSim, pauseLiveSim,
  } = useDashboardStore();

  const totalRevenuePaise = orders.reduce((s, o) => s + o.total_paise, 0);
  const totalSold = orders.filter((o) => o.status === "paid").length;
  const insideNow = checkIns.filter((c) => c.direction === "in" && c.result === "allowed").length;
  const tonightQ = Math.max(0, insideNow - 20);

  const occupancyZones = zones.map((z) => ({
    name: z.name,
    color: z.color ?? "#888888",
    current: Math.round(z.capacity * 0.62),
    capacity: z.capacity,
  }));

  const topPassTypes = [
    { name: "Season Couple Gold", sold: 412 },
    { name: "Season Solo Gold", sold: 287 },
    { name: "Weekend Couple Gold", sold: 193 },
    { name: "VIP Season", sold: 56 },
    { name: "Season Solo General", sold: 341 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Live Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manhar Navratri 2026 · Night 5</p>
        </div>
        <button
          onClick={liveSimRunning ? pauseLiveSim : startLiveSim}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {liveSimRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {liveSimRunning ? "Pause sim" : "Resume sim"}
        </button>
      </div>

      {/* Stat tiles: 3 primary (border-primary/30) + 1 secondary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Tickets Sold" value={totalSold.toLocaleString("en-IN")} className="border-primary/30" />
        <StatTile label="Revenue" value={<Money paise={totalRevenuePaise} locale="en" />} className="border-primary/30" />
        <StatTile label="Inside Now" value={insideNow.toLocaleString("en-IN")} className="border-primary/30" />
        <StatTile label="Tonight Queue" value={tonightQ.toLocaleString("en-IN")} />
      </div>

      {/* Chart + feed */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-4">
          <SalesChart data={NIGHTLY_SALES} label="Sales by night" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <CheckinFeed />
        </div>
      </div>

      {/* Occupancy + top pass types */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Zone occupancy</h2>
          <LiveOccupancyMeter zones={occupancyZones} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Top pass types</h2>
          <ul className="space-y-2">
            {topPassTypes.map((pt, i) => (
              <li key={pt.name} className="flex items-center gap-3 text-sm">
                <span className="w-5 text-right text-muted-foreground">{i + 1}</span>
                <span className="flex-1 text-foreground">{pt.name}</span>
                <span className="tabular-nums text-muted-foreground">{pt.sold.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
