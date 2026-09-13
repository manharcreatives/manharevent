"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, Download, Landmark } from "lucide-react";
import { Money, StatTile, Button } from "@manhar-garba/ui";
import { useDashboardStore, maskedAccountNumber } from "@/lib/dashboard-store";
import { payoutTranches, TDS_194O_BPS } from "@/lib/payouts";
import { downloadCsv, paiseToRupees, todayStamp } from "@/lib/export";
import { useHydrated } from "@/lib/use-hydrated";

export default function PayoutsPage() {
  const hydrated = useHydrated();
  const { events, currentEventId, nights, passTypes, priceTiers, refunds, orders, bankAccount } = useDashboardStore();

  const event = events.find((e) => e.id === currentEventId) ?? events[0];
  if (!hydrated || !event) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const eventOrderIds = new Set(orders.filter((o) => o.event_id === event.id).map((o) => o.id));
  const tranches = payoutTranches(
    nights.filter((n) => n.event_id === event.id),
    passTypes.filter((p) => p.event_id === event.id),
    priceTiers,
    refunds.filter((r) => eventOrderIds.has(r.order_id))
  );

  const settled = tranches.filter((t) => t.status === "settled").reduce((s, t) => s + t.netPaise, 0);
  const scheduled = tranches.filter((t) => t.status === "scheduled").reduce((s, t) => s + t.netPaise, 0);
  const tds = tranches.reduce((s, t) => s + t.tdsPaise, 0);

  function exportStatement() {
    downloadCsv(
      `${event!.slug}-payout-statement-${todayStamp()}`,
      ["Tranche", "Settles on", "Gross (INR)", "TDS 194-O (INR)", "Refunds (INR)", "Net payout (INR)", "Status"],
      tranches.map((t) => [t.label, t.settlesOn, paiseToRupees(t.grossPaise), paiseToRupees(t.tdsPaise), paiseToRupees(t.refundsPaise), paiseToRupees(t.netPaise), t.status])
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">{event.title} · settled in blocks of three nights, two days after each block</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportStatement} disabled={tranches.length === 0}>
          <Download className="mr-1.5 h-4 w-4" />
          Statement CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Paid to you" value={<Money paise={settled} />} sub="Settled tranches" />
        <StatTile label="Scheduled" value={<Money paise={scheduled} />} sub="Not yet due" className="border-primary/30" />
        <StatTile label="TDS withheld" value={<Money paise={tds} />} sub={`Sec. 194-O at ${TDS_194O_BPS / 100}% — claim in your ITR`} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
        <Landmark className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">
          To {bankAccount.accountHolder} · {maskedAccountNumber(bankAccount.accountNumber)} · {bankAccount.ifsc}
        </span>
        <Link href="/dashboard/settings/payments" className="ml-auto text-xs text-primary hover:underline">
          Change account
        </Link>
      </div>

      {tranches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          This event has no nights yet, so there is nothing to settle.
        </p>
      ) : (
        <ul className="space-y-3">
          {tranches.map((t) => (
            <li key={t.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{t.label}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {t.status === "settled" ? "Settled" : "Settles"}{" "}
                    {new Date(`${t.settlesOn}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
                    <div>Gross <Money paise={t.grossPaise} /></div>
                    <div>TDS −<Money paise={t.tdsPaise} /></div>
                    <div>Refunds −<Money paise={t.refundsPaise} /></div>
                    <div className="font-semibold text-foreground">Net <Money paise={t.netPaise} /></div>
                  </dl>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.status === "settled" ? "bg-success/15 text-success" : "bg-surface-raised text-muted-foreground"
                  }`}
                >
                  {t.status === "settled" && <CheckCircle2 className="h-3 w-3" />}
                  {t.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        A pass&rsquo;s price is spread evenly over the nights it covers. Platform and gateway fees are paid by buyers on top
        of your price, so they never reduce your payout. Demo: amounts are calculated live; the bank transfer and UTR arrive
        with the payments backend.
      </p>
    </div>
  );
}
