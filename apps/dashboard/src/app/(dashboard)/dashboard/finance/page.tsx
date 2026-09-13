"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatTile, Money } from "@manhar-garba/ui";
import { computeFees, bpsToPercent, PLATFORM_FEE_BPS, GATEWAY_FEE_BPS } from "@manhar-garba/domain";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useHydrated } from "@/lib/use-hydrated";
import { seasonSales } from "@/lib/metrics";
import { payoutTranches } from "@/lib/payouts";

const SECTIONS = [
  { href: "/dashboard/finance/orders", label: "Order ledger", desc: "Every transaction, exportable" },
  { href: "/dashboard/finance/refunds", label: "Refund queue", desc: "Approve or reject requests" },
  { href: "/dashboard/finance/payouts", label: "Payouts", desc: "Tranche schedule and TDS" },
  { href: "/dashboard/finance/gst", label: "GST reports", desc: "Invoices and GSTR-1 export" },
];

export default function FinancePage() {
  const hydrated = useHydrated();
  const s = useDashboardStore();
  const event = s.events.find((e) => e.id === s.currentEventId) ?? s.events[0];
  if (!hydrated || !event) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const passTypes = s.passTypes.filter((p) => p.event_id === event.id);
  const zones = s.zones.filter((z) => z.event_id === event.id);
  const nights = s.nights.filter((n) => n.event_id === event.id);
  const orderIds = new Set(s.orders.filter((o) => o.event_id === event.id).map((o) => o.id));
  const refunds = s.refunds.filter((r) => orderIds.has(r.order_id));

  // Same sources as Payouts and Reports, so the three screens agree to the rupee.
  const sales = seasonSales(passTypes, s.priceTiers, zones);
  const fees = computeFees(sales.grossPaise);
  const tranches = payoutTranches(nights, passTypes, s.priceTiers, refunds);
  const netPayout = tranches.reduce((sum, t) => sum + t.netPaise, 0);
  const tds = tranches.reduce((sum, t) => sum + t.tdsPaise, 0);
  const refunded = refunds
    .filter((r) => r.status === "approved" || r.status === "processing" || r.status === "completed")
    .reduce((sum, r) => sum + r.amount_paise, 0);
  const pendingRefunds = refunds.filter((r) => r.status === "requested").length;

  const slices = [
    { label: "Net payout to you", paise: netPayout, color: "hsl(14 92% 56%)" },
    { label: "GST (remitted)", paise: fees.gstPaise, color: "hsl(42 96% 58%)" },
    { label: `Platform fee (${bpsToPercent(PLATFORM_FEE_BPS)}, paid by buyers)`, paise: fees.platformFeePaise, color: "hsl(282 74% 62%)" },
    { label: `Gateway fee (${bpsToPercent(GATEWAY_FEE_BPS)}, paid by buyers)`, paise: fees.gatewayFeePaise, color: "hsl(190 80% 50%)" },
    { label: "TDS withheld", paise: tds, color: "hsl(240 6% 50%)" },
    { label: "Refunded", paise: refunded, color: "hsl(0 84% 58%)" },
  ].filter((x) => x.paise > 0);

  const sliceTotal = slices.reduce((sum, x) => sum + x.paise, 0) || 1;
  let cursor = 0;
  const stops = slices.map((x) => {
    const start = (cursor / sliceTotal) * 100;
    cursor += x.paise;
    return `${x.color} ${start.toFixed(2)}% ${((cursor / sliceTotal) * 100).toFixed(2)}%`;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Finance</h1>
        <p className="mt-1 text-sm text-muted-foreground">{event.title} · what buyers paid, what came out, what reaches your account.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Buyers paid" value={<Money paise={fees.totalPaise} />} sub="Passes + fees + GST" className="border-primary/30" />
        <StatTile label="Net payout" value={<Money paise={netPayout} />} sub="After TDS and refunds" trend="up" className="border-primary/30" />
        <StatTile label="Ticket sales" value={<Money paise={sales.grossPaise} />} sub="Your pass prices" />
        <StatTile
          label="Refunds"
          value={<Money paise={refunded} />}
          sub={pendingRefunds > 0 ? `${pendingRefunds} waiting for you` : "None waiting"}
          trend={pendingRefunds > 0 ? "down" : "neutral"}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Where the money goes</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Platform and gateway fees are added on top of your pass price and paid by buyers as two separate lines — they
          don&rsquo;t come out of your payout.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <div className="h-24 w-24 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops.join(", ")})` }} role="img" aria-label="Revenue split" />
          <ul className="space-y-1.5 text-sm">
            {slices.map((x) => (
              <li key={x.label} className="flex flex-wrap items-center gap-2">
                <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: x.color }} />
                <span className="text-foreground">{x.label}</span>
                <span className="tabular text-muted-foreground">
                  <Money paise={x.paise} /> · {((x.paise / sliceTotal) * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map((sec) => (
          <Link
            key={sec.href}
            href={sec.href}
            className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
          >
            <div>
              <p className="font-medium text-foreground">{sec.label}</p>
              <p className="text-xs text-muted-foreground">{sec.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
