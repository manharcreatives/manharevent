"use client";

import Link from "next/link";
import { Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { Badge, Button, Money, StatTile } from "@manhar-garba/ui";
import {
  tenantApplications,
  tenant as manharTenant,
  event as manharEvent,
  orders as allOrders,
  checkIns as allCheckIns,
  passes as allPasses,
} from "@manhar-garba/mock-data";
import { usePlatformStore, hasActiveEmergency } from "@/lib/platform-store";

/**
 * Platform overview for Manhar Creatives — every tenant on one screen.
 *
 * This used to redirect straight to `/admin/tenants`, which meant the only
 * internal-ops view was an approvals inbox. The questions actually asked on a
 * Navratri night are "is money still coming in", "are gates still scanning",
 * and "is anything on fire" — so those come first, and approvals are one card
 * among several.
 */
export default function AdminOverviewPage() {
  const platform = usePlatformStore();
  const emergencyActive = hasActiveEmergency(platform);

  const pendingApplications = tenantApplications.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  );
  // Live = the seeded running tenant plus any registration already approved
  // and provisioned. This tile used to be the literal string "1".
  const approvedApplications = tenantApplications.filter((a) => a.status === "approved");
  const liveOrganizers = 1 + approvedApplications.filter((a) => a.provisionedAt).length;

  const paidOrders = allOrders.filter((o) => o.status === "paid");
  const grossPaise = paidOrders.reduce((sum, o) => sum + o.total_paise, 0);
  const scannedTonight = allCheckIns.filter((c) => c.result === "allowed").length;

  const activeEmergencies = platform.actions.filter((a) => a.active);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Platform overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything Manhar Creatives runs, across every organizer.
          </p>
        </div>
        <Link href="/admin/emergency">
          <Button size="sm" variant={emergencyActive ? "destructive" : "outline"}>
            <ShieldAlert className="mr-1.5 h-4 w-4" />
            {emergencyActive ? "Emergency active" : "Emergency controls"}
          </Button>
        </Link>
      </div>

      {emergencyActive && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            {activeEmergencies.length} emergency override
            {activeEmergencies.length === 1 ? "" : "s"} currently in force
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {activeEmergencies.slice(0, 4).map((a) => (
              <li key={a.id}>
                {a.scope} — {a.reason}
              </li>
            ))}
          </ul>
          <Link
            href="/admin/emergency"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
          >
            Review and lift
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Live organizers"
          value={liveOrganizers.toLocaleString("en-IN")}
          sub={`${pendingApplications.length} awaiting approval · ${approvedApplications.filter((a) => !a.provisionedAt).length} provisioning`}
        />
        <StatTile
          label="Gross ticket sales"
          value={<Money paise={grossPaise} />}
          sub={`${paidOrders.length} paid orders`}
        />
        <StatTile
          label="Passes issued"
          value={allPasses.length.toLocaleString("en-IN")}
          sub="Across every organizer"
        />
        <StatTile
          label="Check-ins recorded"
          value={scannedTonight.toLocaleString("en-IN")}
          sub="Admitted at the gates"
        />
      </div>

      <section className="rounded-xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Organizers</h2>
          <Link href="/admin/tenants" className="text-sm text-primary hover:underline">
            All registrations
          </Link>
        </header>
        <ul className="divide-y divide-border">
          <li className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
              {manharTenant.display_name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{manharTenant.display_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {manharEvent.title} · {allPasses.length.toLocaleString("en-IN")} passes issued
              </p>
            </div>
            {platform.frozenTenantIds.includes(manharTenant.id) ? (
              <Badge variant="destructive">Frozen</Badge>
            ) : (
              <Badge variant="success">Live</Badge>
            )}
          </li>
          {approvedApplications.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/tenants/${a.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-sm font-semibold text-muted-foreground">
                  {a.orgName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{a.orgName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.city} · {a.desiredDomain}.manharevent.com · ~{a.roughCapacity.toLocaleString("en-IN")} capacity
                  </p>
                </div>
                <Badge variant={a.provisionedAt ? "success" : "primary"}>{a.provisionedAt ? "Live" : "Provisioning"}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Waiting on you
          </h2>
          <Link href="/admin/tenants" className="text-sm text-primary hover:underline">
            Open approvals
          </Link>
        </header>
        {pendingApplications.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted-foreground">
            No organizer registrations waiting for review.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pendingApplications.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/tenants/${a.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{a.orgName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.city} · {a.contactName} · {a.phone}
                    </p>
                  </div>
                  <Badge variant={a.status === "submitted" ? "warning" : "primary"}>
                    {a.status === "submitted" ? "New" : "Under review"}
                  </Badge>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
