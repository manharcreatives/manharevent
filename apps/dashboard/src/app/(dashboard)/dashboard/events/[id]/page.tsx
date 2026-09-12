"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { StatTile, Money, Button } from "@manhar-garba/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, Eye } from "lucide-react";

export default function EventOverviewPage() {
  const params = useParams<{ id: string }>();
  const { events, orders, passTypes, checkIns } = useDashboardStore();
  const ev = events.find((e) => e.id === params.id) ?? events[0];

  if (!ev) return <p className="text-muted-foreground">Event not found.</p>;

  const paidOrders = orders.filter((o) => o.status === "paid");
  const revenue = paidOrders.reduce((s, o) => s + o.total_paise, 0);
  const totalScans = checkIns.filter((c) => c.result === "allowed").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-foreground">{ev.title}</h1>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success capitalize">{ev.status}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{ev.starts_on} — {ev.ends_on} · 9 nights</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={`http://localhost:3000/e/${ev.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-1.5 h-4 w-4" />
              Preview
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/events/${ev.id}/publish`}>
              Publish settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Paid orders" value={paidOrders.length} />
        <StatTile label="Revenue" value={<Money paise={revenue} locale="en" />} />
        <StatTile label="Pass types" value={passTypes.length} />
        <StatTile label="Total scans" value={totalScans} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { href: "nights", label: "Manage nights", desc: "Themes, lineup, dress codes" },
          { href: "passes", label: "Pass types", desc: "Inventory, pricing, tiers" },
          { href: "attendees", label: "Attendees", desc: "Search, manage, export" },
          { href: "live", label: "Live ops", desc: "Realtime dashboard" },
          { href: "reports", label: "Reports", desc: "Sales analytics" },
          { href: "comps", label: "Comp passes", desc: "Issue complimentary passes" },
        ].map((item) => (
          <Link
            key={item.href}
            href={`/dashboard/events/${ev.id}/${item.href}`}
            className="rounded-xl border border-border bg-surface p-4 hover:border-primary/50 transition-colors"
          >
            <p className="font-medium text-foreground">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
