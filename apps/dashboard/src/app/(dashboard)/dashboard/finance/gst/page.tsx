"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { Money } from "@manhar-garba/ui";
import { Download } from "lucide-react";

export default function GSTPage() {
  const { orders } = useDashboardStore();
  const paid = orders.filter((o) => o.status === "paid");
  const totalGST = paid.reduce((s, o) => s + o.gst_paise, 0);
  const cgst = Math.round(totalGST / 2);
  const sgst = totalGST - cgst;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">GST Reports</h1>
        <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Download className="h-4 w-4" />
          Export GSTR-1
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">GST summary — October 2026</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total taxable value</dt>
            <dd className="tabular-nums text-foreground"><Money paise={paid.reduce((s, o) => s + o.subtotal_paise, 0)} locale="en" /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">CGST (9%)</dt>
            <dd className="tabular-nums text-foreground"><Money paise={cgst} locale="en" /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">SGST (9%)</dt>
            <dd className="tabular-nums text-foreground"><Money paise={sgst} locale="en" /></dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <dt className="text-foreground">Total GST collected</dt>
            <dd className="tabular-nums text-foreground"><Money paise={totalGST} locale="en" /></dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Intra-state supply (Gujarat): CGST + SGST applies. HSN/SAC: 999246 — Live entertainment services.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Invoices</h2>
        <ul className="divide-y divide-border">
          {paid.slice(0, 5).map((o, i) => (
            <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-mono text-xs text-foreground">INV-2026-{String(i + 1001).padStart(4, "0")}</p>
                <p className="text-xs text-muted-foreground">{o.order_number} · {o.buyer_phone}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-muted-foreground"><Money paise={o.gst_paise} locale="en" /></span>
                <button className="text-primary text-xs hover:underline">PDF</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
