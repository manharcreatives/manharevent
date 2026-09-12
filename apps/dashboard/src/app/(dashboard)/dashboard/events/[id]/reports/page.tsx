"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { StatTile, Money } from "@manhar-garba/ui";

const DAILY_SALES = [
  { label: "N1", value: 234 },
  { label: "N2", value: 312 },
  { label: "N3", value: 276 },
  { label: "N4", value: 354 },
  { label: "N5", value: 411 },
  { label: "N6", value: 289 },
  { label: "N7", value: 198 },
  { label: "N8", value: 167 },
  { label: "N9", value: 0 },
];

const ZONE_BREAKDOWN = [
  { zone: "VIP", pct: 8, revenue: 2985000 },
  { zone: "Gold", pct: 54, revenue: 20148000 },
  { zone: "General", pct: 38, revenue: 7614000 },
];

export default function ReportsPage() {
  const { orders, passTypes } = useDashboardStore();
  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((s, o) => s + o.total_paise, 0);
  const avgOrder = paid.length ? Math.round(revenue / paid.length) : 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Reports & Analytics</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total revenue" value={<Money paise={revenue} locale="en" />} />
        <StatTile label="Paid orders" value={paid.length} />
        <StatTile label="Avg order" value={<Money paise={avgOrder} locale="en" />} />
        <StatTile label="Pass types" value={passTypes.length} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <SalesChart data={DAILY_SALES} label="Orders by night" />
      </div>

      {/* Zone revenue split */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Revenue by zone</h2>
        <div className="space-y-3">
          {ZONE_BREAKDOWN.map((z) => (
            <div key={z.zone}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-foreground font-medium">{z.zone}</span>
                <span className="text-muted-foreground tabular-nums"><Money paise={z.revenue} locale="en" /> ({z.pct}%)</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                <div className="h-full rounded-full bg-primary" style={{ width: `${z.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pass type breakdown */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Sales by pass type</h2>
        <ul className="divide-y divide-border">
          {passTypes.map((pt) => (
            <li key={pt.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-foreground">{pt.name}</span>
              <span className="tabular-nums text-muted-foreground">{pt.sold_quantity.toLocaleString("en-IN")} sold</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
