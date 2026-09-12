"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { Money, StatTile } from "@manhar-garba/ui";

const MOCK_PAYOUTS = [
  { id: "p1", period: "Night 1–3", gross: 8745000, fee: 262350, gst: 1534920, tds: 131175, net: 6816555, status: "completed", utr: "UTR123456789", paidAt: "2026-10-05" },
  { id: "p2", period: "Night 4–6", gross: 11234000, fee: 337020, gst: 1971492, tds: 168510, net: 8756978, status: "processing", utr: null, paidAt: null },
  { id: "p3", period: "Night 7–9", gross: 6789000, fee: 203670, gst: 1190772, tds: 101835, net: 5292723, status: "pending", utr: null, paidAt: null },
];

export default function PayoutsPage() {
  const { orders } = useDashboardStore();
  const netTotal = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total_paise, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Payouts</h1>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
        <strong>Net liability to organizer: <Money paise={netTotal} locale="en" /></strong>
        <p className="mt-0.5 text-xs opacity-80">Settled in tranches after each 3-night block, per payout schedule.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Completed" value="₹68.2L" />
        <StatTile label="Processing" value="₹87.6L" />
        <StatTile label="Pending" value="₹52.9L" />
      </div>

      <ul className="space-y-3">
        {MOCK_PAYOUTS.map((p) => (
          <li key={p.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">{p.period}</p>
                <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>Gross: <Money paise={p.gross} locale="en" /></span>
                  <span>Fees: <Money paise={p.fee} locale="en" /></span>
                  <span>GST: <Money paise={p.gst} locale="en" /></span>
                  <span>TDS: <Money paise={p.tds} locale="en" /></span>
                  <span className="col-span-2 font-semibold text-foreground">Net: <Money paise={p.net} locale="en" /></span>
                </div>
                {p.utr && <p className="mt-1 font-mono text-xs text-muted-foreground">UTR: {p.utr} · {p.paidAt}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                p.status === "completed" ? "bg-success/15 text-success"
                : p.status === "processing" ? "bg-warning/15 text-warning"
                : "bg-surface-raised text-muted-foreground"
              }`}>
                {p.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
