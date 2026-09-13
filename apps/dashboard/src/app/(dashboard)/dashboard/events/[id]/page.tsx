"use client";

import Link from "next/link";
import { ExternalLink, Eye, ArrowRight } from "lucide-react";
import { StatTile, Money, Button } from "@manhar-garba/ui";
import { useEventScope, publicEventUrl } from "@/lib/use-event";
import { seasonSales, currentNight } from "@/lib/metrics";

export default function EventOverviewPage() {
  const { event, nights, zones, passTypes, priceTiers, checkIns, unlisted } = useEventScope();
  if (!event) return null; // the layout renders the not-found state

  const sales = seasonSales(passTypes, priceTiers, zones);
  const scans = checkIns.filter((c) => c.result === "allowed").length;
  const upcoming = currentNight(nights);

  const statusChip =
    event.status === "published"
      ? unlisted
        ? { label: "Live · unlisted", cls: "bg-info/15 text-info" }
        : { label: "Live", cls: "bg-success/15 text-success" }
      : { label: event.status, cls: "bg-surface-raised text-muted-foreground" };

  const NEXT_STEPS =
    event.status === "draft"
      ? [
          { href: "passes", label: "Check your pass types and prices" },
          { href: "nights", label: "Add themes, dress codes and lineup" },
          { href: "policy", label: "Confirm refund and re-entry rules" },
          { href: "publish", label: "Publish and get your share link" },
        ]
      : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-foreground">{event.title}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusChip.cls}`}>
              {statusChip.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {event.starts_on} — {event.ends_on} · {nights.length} night{nights.length === 1 ? "" : "s"}
            {upcoming?.mode === "before" && ` · starts in ${upcoming.daysAway} days`}
            {upcoming?.mode === "tonight" && ` · Night ${upcoming.night.night_number} is tonight`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={publicEventUrl(event.slug)} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-1.5 h-4 w-4" />
              Preview
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/events/${event.id}/publish`}>
              {event.status === "published" ? "Share & publish" : "Publish"}
            </Link>
          </Button>
        </div>
      </div>

      {event.status === "draft" && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">This event is a draft — nobody can buy passes yet.</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {NEXT_STEPS.map((step, i) => (
              <li key={step.href}>
                <Link
                  href={`/dashboard/events/${event.id}/${step.href}`}
                  className="group flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/50"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1">{step.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Passes sold" value={sales.passesSold.toLocaleString("en-IN")} sub={`${sales.admitsSold.toLocaleString("en-IN")} people admitted`} />
        <StatTile label="Ticket sales" value={<Money paise={sales.grossPaise} />} sub="Season to date" />
        <StatTile label="Pass types" value={passTypes.length} sub={`${zones.length} zones`} />
        <StatTile label="Gate scans" value={scans.toLocaleString("en-IN")} sub="Admitted so far" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { href: "nights", label: "Manage nights", desc: "Themes, lineup, dress codes" },
          { href: "passes", label: "Pass types", desc: "Inventory, pricing, tiers" },
          { href: "attendees", label: "Attendees", desc: "Search, manage, export" },
          { href: "live", label: "Live ops", desc: "Gates and occupancy" },
          { href: "reports", label: "Reports", desc: "Sales by zone, night and pass" },
          { href: "comps", label: "Comp passes", desc: "Issue complimentary passes" },
        ].map((item) => (
          <Link
            key={item.href}
            href={`/dashboard/events/${event.id}/${item.href}`}
            className="group rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <p className="flex items-center justify-between font-medium text-foreground">
              {item.label}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
