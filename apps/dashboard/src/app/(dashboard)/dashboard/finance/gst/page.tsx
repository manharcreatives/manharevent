"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Money, Button, toast } from "@manhar-garba/ui";
import type { Order } from "@manhar-garba/domain";
import { useDashboardStore } from "@/lib/dashboard-store";
import { downloadCsv, openPrintable, paiseToRupees, todayStamp } from "@/lib/export";
import { useHydrated } from "@/lib/use-hydrated";

const SAC = "999692"; // Other amusement and recreational services (event admission)
const PLACE_OF_SUPPLY = "24-Gujarat";

/** Indian financial year for a date: April to March. */
function fiscalYear(iso: string): string {
  const d = new Date(iso);
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/**
 * Invoice numbers are derived from the order number, so the same order always
 * gets the same invoice number — the old list numbered invoices by their
 * position on screen, which changed whenever the list did.
 */
function invoiceNumber(order: Order): string {
  const seq = order.order_number.split("-").pop() ?? order.id.slice(-6);
  return `INV/${fiscalYear(order.paid_at ?? order.created_at)}/${seq}`;
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function GSTPage() {
  const hydrated = useHydrated();
  const { orders, bankAccount } = useDashboardStore();
  const [month, setMonth] = useState<string>("all");

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const invoiced = orders.filter((o) => (o.status === "paid" || o.status === "partially_refunded") && o.paid_at);
  const months = [...new Set(invoiced.map((o) => monthKey(o.paid_at!)))].sort().reverse();
  const inPeriod = month === "all" ? invoiced : invoiced.filter((o) => monthKey(o.paid_at!) === month);

  const taxable = inPeriod.reduce((s, o) => s + o.subtotal_paise - o.discount_paise + o.convenience_fee_paise, 0);
  const totalGST = inPeriod.reduce((s, o) => s + o.gst_paise, 0);
  const cgst = Math.round(totalGST / 2);
  const sgst = totalGST - cgst;
  const periodLabel = month === "all" ? "All periods" : monthLabel(month);

  function exportGstr1() {
    downloadCsv(
      `gstr1-b2cs-${month}-${todayStamp()}`,
      ["Invoice number", "Invoice date", "Order", "Buyer phone", "Place of supply", "SAC", "Rate (%)", "Taxable value (INR)", "CGST (INR)", "SGST (INR)", "Invoice value (INR)"],
      inPeriod.map((o) => {
        const g = o.gst_paise;
        return [
          invoiceNumber(o), o.paid_at?.slice(0, 10), o.order_number, o.buyer_phone, PLACE_OF_SUPPLY, SAC, 18,
          paiseToRupees(o.subtotal_paise - o.discount_paise + o.convenience_fee_paise),
          paiseToRupees(Math.round(g / 2)), paiseToRupees(g - Math.round(g / 2)), paiseToRupees(o.total_paise),
        ];
      })
    );
    toast.success("GSTR-1 B2CS export downloaded", { description: `${inPeriod.length} invoices · ${periodLabel}` });
  }

  function printInvoice(o: Order) {
    const g = o.gst_paise;
    const rupee = (p: number) => `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    const ok = openPrintable(
      invoiceNumber(o),
      `<h1>Tax invoice</h1>
       <div class="muted">${invoiceNumber(o)} · ${new Date(o.paid_at ?? o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
       <div class="row">
         <div><strong>Supplier</strong><br>${bankAccount.accountHolder}<br>GSTIN 24AAACM1234C1Z5<br>Ahmedabad, Gujarat</div>
         <div><strong>Billed to</strong><br>${o.buyer_name ?? "Buyer"}<br>${o.buyer_phone}<br>Place of supply: ${PLACE_OF_SUPPLY}</div>
       </div>
       <table>
         <tr><th>Description</th><th>SAC</th><th class="num">Amount</th></tr>
         <tr><td>Event admission — order ${o.order_number}</td><td>${SAC}</td><td class="num">${rupee(o.subtotal_paise - o.discount_paise)}</td></tr>
         <tr><td>Platform and payment gateway fees</td><td>${SAC}</td><td class="num">${rupee(o.convenience_fee_paise)}</td></tr>
         <tr><td>CGST 9%</td><td></td><td class="num">${rupee(Math.round(g / 2))}</td></tr>
         <tr><td>SGST 9%</td><td></td><td class="num">${rupee(g - Math.round(g / 2))}</td></tr>
         <tr class="total"><td>Total</td><td></td><td class="num">${rupee(o.total_paise)}</td></tr>
       </table>
       <p class="muted" style="margin-top:24px">Computer-generated invoice. Issued via ManharEvent.</p>`
    );
    if (!ok) toast.error("Allow pop-ups for this site to open the invoice");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground">GST reports</h1>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground"
            aria-label="Period"
          >
            <option value="all">All periods</option>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={exportGstr1} disabled={inPeriod.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            Export GSTR-1
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">GST summary — {periodLabel}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxable value ({inPeriod.length} invoices)</dt>
            <dd className="tabular text-foreground"><Money paise={taxable} /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">CGST (9%)</dt>
            <dd className="tabular text-foreground"><Money paise={cgst} /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">SGST (9%)</dt>
            <dd className="tabular text-foreground"><Money paise={sgst} /></dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <dt className="text-foreground">Total GST collected</dt>
            <dd className="tabular text-foreground"><Money paise={totalGST} /></dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Intra-state supply (Gujarat): CGST + SGST. SAC {SAC}. The export is shaped for the B2C (small) table of GSTR-1.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Invoices</h2>
        {inPeriod.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices in this period.</p>
        ) : (
          <ul className="divide-y divide-border">
            {inPeriod.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-foreground">{invoiceNumber(o)}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.order_number} · {o.buyer_name ?? o.buyer_phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-muted-foreground"><Money paise={o.gst_paise} /></span>
                  <button onClick={() => printInvoice(o)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
