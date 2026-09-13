"use client";

import { Download } from "lucide-react";
import { StatTile, Money, Button } from "@manhar-garba/ui";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { useEventScope } from "@/lib/use-event";
import { seasonSales, expectedAttendanceByNight } from "@/lib/metrics";
import { downloadCsv, paiseToRupees, todayStamp } from "@/lib/export";

export default function ReportsPage() {
  const { event, nights, zones, passTypes, priceTiers } = useEventScope();
  if (!event) return null;

  // Every figure below is derived from the pass types and price tiers — the
  // "orders by night" chart and zone split used to be hardcoded arrays.
  const sales = seasonSales(passTypes, priceTiers, zones);
  const attendance = expectedAttendanceByNight(nights, passTypes);
  const avgPass = sales.passesSold > 0 ? Math.round(sales.grossPaise / sales.passesSold) : 0;
  const capacity = zones.reduce((s, z) => s + z.capacity, 0);
  const busiest = attendance.reduce((m, n) => (n.value > (m?.value ?? -1) ? n : m), attendance[0]);

  function exportReport() {
    downloadCsv(
      `${event!.slug}-sales-by-pass-type-${todayStamp()}`,
      ["Pass type", "Sold", "Gross (INR)"],
      sales.byPassType.map((p) => [p.name, p.sold, paiseToRupees(p.grossPaise)])
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground">Reports &amp; analytics</h1>
        <Button size="sm" variant="outline" onClick={exportReport} disabled={sales.byPassType.length === 0}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Ticket sales" value={<Money paise={sales.grossPaise} />} sub="Season to date" />
        <StatTile label="Passes sold" value={sales.passesSold.toLocaleString("en-IN")} sub={`${sales.admitsSold.toLocaleString("en-IN")} people`} />
        <StatTile label="Avg pass price" value={<Money paise={avgPass} />} />
        <StatTile
          label="Busiest night"
          value={busiest && busiest.value > 0 ? busiest.label.replace("N", "Night ") : "—"}
          sub={busiest && busiest.value > 0 ? `${busiest.value.toLocaleString("en-IN")} expected of ${capacity.toLocaleString("en-IN")} capacity` : "No sales yet"}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <SalesChart data={attendance} label="Expected attendance by night — people holding a valid pass for that night" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Sales by zone</h2>
        {sales.grossPaise === 0 ? (
          <p className="text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          <div className="space-y-3">
            {sales.byZone.map((z) => (
              <div key={z.zoneId}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-foreground">{z.name}</span>
                  <span className="tabular text-muted-foreground">
                    <Money paise={z.grossPaise} /> · {z.passesSold.toLocaleString("en-IN")} passes ({Math.round(z.share * 100)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div className="h-full rounded-full" style={{ width: `${Math.round(z.share * 100)}%`, backgroundColor: z.color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Sales by pass type</h2>
        <ul className="divide-y divide-border">
          {sales.byPassType.map((pt) => (
            <li key={pt.passTypeId} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-foreground">{pt.name}</span>
              <span className="tabular text-muted-foreground">
                {pt.sold.toLocaleString("en-IN")} sold · <Money paise={pt.grossPaise} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
