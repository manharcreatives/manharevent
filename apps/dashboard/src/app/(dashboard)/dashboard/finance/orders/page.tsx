"use client";

import { useState } from "react";
import { useDashboardStore } from "@/lib/dashboard-store";
import { DataTable, EmptyState, Money } from "@manhar-garba/ui";
import { Download, ReceiptText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Order } from "@manhar-garba/domain";

const STATUSES = ["all", "paid", "pending_payment", "refunded", "cancelled"];

const COLUMNS: ColumnDef<Order>[] = [
  { header: "Order #", accessorKey: "order_number" },
  { header: "Phone", accessorKey: "buyer_phone" },
  { header: "Subtotal", accessorKey: "subtotal_paise", cell: ({ row }) => <Money paise={row.original.subtotal_paise} locale="en" /> },
  { header: "Fees", accessorKey: "convenience_fee_paise", cell: ({ row }) => <Money paise={row.original.convenience_fee_paise} locale="en" /> },
  { header: "GST", accessorKey: "gst_paise", cell: ({ row }) => <Money paise={row.original.gst_paise} locale="en" /> },
  { header: "Total", accessorKey: "total_paise", cell: ({ row }) => <Money paise={row.original.total_paise} locale="en" /> },
  { header: "Status", accessorKey: "status", cell: ({ row }) => (
    <span className={`capitalize text-xs font-medium ${row.original.status === "paid" ? "text-success" : row.original.status === "refunded" ? "text-warning" : "text-muted-foreground"}`}>
      {row.original.status.replace("_", " ")}
    </span>
  ) },
];

export default function OrdersPage() {
  const { orders } = useDashboardStore();
  const [status, setStatus] = useState("all");

  const filtered = status === "all" ? orders : orders.filter((o) => o.status === status);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Order Ledger</h1>
        <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* URL-synced filters (status) */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              status === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={status === "all" ? "No orders yet" : `No ${status.replace("_", " ")} orders`}
          description={
            status === "all"
              ? "Orders will appear here the moment a buyer completes checkout."
              : `No orders with status "${status.replace("_", " ")}" — try changing the filter.`
          }
        />
      ) : (
        <DataTable columns={COLUMNS} data={filtered} />
      )}
    </div>
  );
}
