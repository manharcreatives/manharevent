"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { StatTile, Money } from "@manhar-garba/ui";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinancePage() {
  const { orders } = useDashboardStore();

  const paid = orders.filter((o) => o.status === "paid");
  const refunded = orders.filter((o) => o.status === "refunded");
  const grossRevenue = paid.reduce((s, o) => s + o.total_paise, 0);
  const gstCollected = paid.reduce((s, o) => s + o.gst_paise, 0);
  const convFees = paid.reduce((s, o) => s + o.convenience_fee_paise, 0);
  const netRevenue = grossRevenue - gstCollected - convFees;

  const SECTIONS = [
    { href: "/dashboard/finance/orders", label: "Order ledger", desc: "All transactions with filters" },
    { href: "/dashboard/finance/refunds", label: "Refund queue", desc: "Pending approvals" },
    { href: "/dashboard/finance/payouts", label: "Payouts", desc: "Settlement schedule" },
    { href: "/dashboard/finance/gst", label: "GST reports", desc: "CGST/SGST/IGST invoices" },
  ];

  return (
    <div className="space-y-6 mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Finance</h1>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Gross revenue" value={<Money paise={grossRevenue} locale="en" />} className="border-primary/30" />
        <StatTile label="Net revenue" value={<Money paise={netRevenue} locale="en" />} className="border-primary/30" />
        <StatTile label="GST collected" value={<Money paise={gstCollected} locale="en" />} />
        <StatTile label="Pending refunds" value={refunded.length} />
      </div>

      {/* Revenue split donut (simplified CSS version) */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Revenue split</h2>
        <div className="flex items-center gap-6">
          <div
            className="h-24 w-24 shrink-0 rounded-full"
            style={{
              background: `conic-gradient(
                hsl(14 92% 56%) 0% 74%,
                hsl(42 96% 58%) 74% 88%,
                hsl(190 80% 50%) 88% 100%
              )`,
            }}
            role="img"
            aria-label="Revenue split donut chart"
          />
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-primary" /> Net to organizer (74%)</li>
            <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(42 96% 58%)" }} /> GST (14%)</li>
            <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(190 80% 50%)" }} /> Conv. fee (12%)</li>
          </ul>
        </div>
      </div>

      {/* Section links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 hover:border-primary/50 transition-colors"
          >
            <div>
              <p className="font-medium text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
