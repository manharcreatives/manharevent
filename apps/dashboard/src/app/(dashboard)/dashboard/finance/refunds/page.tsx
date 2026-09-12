"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { Button, EmptyState, Money } from "@manhar-garba/ui";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

const MOCK_REFUNDS = [
  { id: "r1", orderId: "ord-rina-kaushik-001", orderNumber: "#1001", buyerName: "Rina Kaushik", amount: 498000, reason: "Cannot attend due to illness", status: "requested" },
  { id: "r2", orderId: "ord-priya-shah-001", orderNumber: "#1002", buyerName: "Priya Shah", amount: 249000, reason: "Change of plans", status: "requested" },
];

export default function RefundsPage() {
  const { addAuditEntry } = useDashboardStore();

  function handleApprove(id: string, name: string) {
    addAuditEntry("refund.approved", `Refund approved for ${name}`);
    toast.success(`Refund approved for ${name}`, { description: "Payout will be processed within 5–7 business days." });
  }

  function handleReject(id: string, name: string) {
    addAuditEntry("refund.rejected", `Refund rejected for ${name}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">Refund Queue</h1>

      {MOCK_REFUNDS.length === 0 ? (
        <EmptyState
          icon={<RefreshCw />}
          title="No pending refund requests"
          description="Refund requests from buyers will appear here. You can approve or reject each one."
        />
      ) : (
        <ul className="space-y-3">
          {MOCK_REFUNDS.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{r.buyerName}</p>
                  <p className="text-xs text-muted-foreground">{r.orderNumber} · Requesting <Money paise={r.amount} locale="en" /></p>
                  <p className="mt-1 text-sm text-muted-foreground">&ldquo;{r.reason}&rdquo;</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleReject(r.id, r.buyerName)}>
                    <XCircle className="mr-1.5 h-4 w-4 text-destructive" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => handleApprove(r.id, r.buyerName)}>
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
