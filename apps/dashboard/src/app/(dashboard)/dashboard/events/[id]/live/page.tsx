"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { StatTile, Money } from "@manhar-garba/ui";
import { LiveOccupancyMeter } from "@/components/dashboard/live-occupancy-meter";
import { CheckinFeed } from "@/components/dashboard/checkin-feed";
import { Megaphone } from "lucide-react";
import { useState } from "react";

export default function LiveOpsPage() {
  const { orders, zones, checkIns } = useDashboardStore();
  const paidOrders = orders.filter((o) => o.status === "paid");
  const revenue = paidOrders.reduce((s, o) => s + o.total_paise, 0);
  const insideNow = checkIns.filter((c) => c.direction === "in" && c.result === "allowed").length;
  const [announcement, setAnnouncement] = useState("");
  const [sentAnnouncements, setSent] = useState<string[]>([]);

  const occupancyZones = zones.map((z) => ({
    name: z.name, color: z.color ?? "#888888",
    current: Math.round(z.capacity * 0.62), capacity: z.capacity,
  }));

  function handleSend() {
    if (!announcement.trim()) return;
    setSent((a) => [announcement, ...a.slice(0, 4)]);
    setAnnouncement("");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Live Ops Console</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Inside Now" value={insideNow.toLocaleString("en-IN")} className="border-primary/30" />
        <StatTile label="Paid Orders" value={paidOrders.length} className="border-primary/30" />
        <StatTile label="Revenue" value={<Money paise={revenue} locale="en" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Zone occupancy</h2>
          <LiveOccupancyMeter zones={occupancyZones} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <CheckinFeed />
        </div>
      </div>

      {/* Announcements */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          Broadcast announcement
        </h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Message to all gate staff devices…"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />
          <button onClick={handleSend} className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            Send
          </button>
        </div>
        {sentAnnouncements.length > 0 && (
          <ul className="space-y-1">
            {sentAnnouncements.map((msg, i) => (
              <li key={i} className="text-xs text-muted-foreground">✓ {msg}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
