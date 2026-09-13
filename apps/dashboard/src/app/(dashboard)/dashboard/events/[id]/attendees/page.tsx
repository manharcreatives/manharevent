"use client";

import { useState } from "react";
import { useEventScope } from "@/lib/use-event";
import { downloadCsv, paiseToRupees, todayStamp } from "@/lib/export";
import { DataTable, Money } from "@manhar-garba/ui";
import { Search, Download } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Order } from "@manhar-garba/domain";

const COLUMNS: ColumnDef<Order>[] = [
  { header: "Order #", accessorKey: "order_number" },
  { header: "Phone", accessorKey: "buyer_phone" },
  { header: "Name", accessorKey: "buyer_name", cell: ({ row }) => row.original.buyer_name ?? "—" },
  { header: "Total", accessorKey: "total_paise", cell: ({ row }) => <Money paise={row.original.total_paise} locale="en" /> },
  { header: "Status", accessorKey: "status", cell: ({ row }) => (
    <span className={`capitalize text-xs font-medium ${row.original.status === "paid" ? "text-success" : "text-muted-foreground"}`}>
      {row.original.status}
    </span>
  ) },
];

export default function AttendeesPage() {
  const { event, orders } = useEventScope();
  const [query, setQuery] = useState("");

  const filtered = orders.filter(
    (o) =>
      o.buyer_phone.includes(query) ||
      (o.buyer_name?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
      o.order_number.includes(query)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Attendees</h1>
        <button
          onClick={() =>
            downloadCsv(
              `${event?.slug ?? "event"}-attendees-${todayStamp()}`,
              ["Order", "Name", "Phone", "Email", "Status", "Total (INR)", "Paid at"],
              filtered.map((o) => [o.order_number, o.buyer_name, o.buyer_phone, o.buyer_email, o.status, paiseToRupees(o.total_paise), o.paid_at])
            )
          }
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV{query ? ` (${filtered.length})` : ""}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search by phone, name, or order number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <DataTable columns={COLUMNS} data={filtered} />
    </div>
  );
}
