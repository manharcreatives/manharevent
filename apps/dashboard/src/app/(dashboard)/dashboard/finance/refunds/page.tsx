"use client";

import { useState } from "react";
import { CheckCircle, RefreshCw, XCircle, Clock } from "lucide-react";
import { Button, EmptyState, Money, Badge, Input, toast } from "@manhar-garba/ui";
import type { Refund } from "@manhar-garba/domain";
import { useDashboardStore } from "@/lib/dashboard-store";
import { RoleGate } from "@/components/dashboard/role-gate";
import { useHydrated } from "@/lib/use-hydrated";

const STATUS_VARIANT: Record<Refund["status"], "default" | "primary" | "success" | "warning" | "destructive"> = {
  requested: "warning",
  approved: "primary",
  processing: "primary",
  completed: "success",
  rejected: "destructive",
  failed: "destructive",
};

type Tab = "open" | "resolved";

export default function RefundsPage() {
  const hydrated = useHydrated();
  const { refunds, orders, approveRefund, rejectRefund } = useDashboardStore();
  const [tab, setTab] = useState<Tab>("open");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const open = refunds.filter((r) => r.status === "requested");
  const resolved = refunds.filter((r) => r.status !== "requested");
  const list = (tab === "open" ? open : resolved).slice().sort((a, b) => b.requested_at.localeCompare(a.requested_at));
  const owed = open.reduce((s, r) => s + r.amount_paise, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Refund queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {open.length} waiting · <Money paise={owed} /> if all approved. Amounts follow each event&rsquo;s refund policy.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {(["open", "resolved"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "open" ? `Waiting (${open.length})` : `Resolved (${resolved.length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<RefreshCw />}
          title={tab === "open" ? "No refund requests waiting" : "Nothing resolved yet"}
          description="When a buyer asks for a refund from their My Refunds screen, it lands here for you to approve or reject."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const order = orders.find((o) => o.id === r.order_id);
            const snap = (r.policy_snapshot ?? {}) as { percent?: number; daysBefore?: number; rejectionReason?: string };
            return (
              <li key={r.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{order?.buyer_name ?? r.requested_by ?? "Buyer"}</p>
                      <Badge variant={STATUS_VARIANT[r.status]} className="capitalize">{r.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order?.order_number ?? r.order_id} · paid <Money paise={order?.total_paise ?? 0} /> · refunding{" "}
                      <strong className="text-foreground"><Money paise={r.amount_paise} /></strong>
                      {snap.percent !== undefined && ` (${snap.percent}% of pass price)`}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Asked {new Date(r.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {snap.daysBefore !== undefined && `, ${snap.daysBefore} days before the first night`}
                    </p>
                    {r.reason && <p className="mt-1 text-sm text-muted-foreground">&ldquo;{r.reason}&rdquo;</p>}
                    {r.status === "rejected" && snap.rejectionReason && (
                      <p className="mt-1 text-xs text-destructive">Rejected: {snap.rejectionReason}</p>
                    )}
                    {(r.status === "processing" || r.status === "completed") && r.approved_by && (
                      <p className="mt-1 text-xs text-success">
                        Approved by {r.approved_by} — back to the buyer&rsquo;s original payment method in 5–7 business days.
                      </p>
                    )}
                  </div>

                  {r.status === "requested" && (
                    <RoleGate allow={["owner", "finance"]}>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setRejecting(r.id); setReason(""); }}>
                          <XCircle className="mr-1.5 h-4 w-4 text-destructive" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            approveRefund(r.id);
                            toast.success(`Refund approved for ${order?.buyer_name ?? "buyer"}`, {
                              description: "It comes out of your next payout tranche.",
                            });
                          }}
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </RoleGate>
                  )}
                </div>

                {rejecting === r.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason the buyer will see, e.g. outside refund window"
                      className="h-9 min-w-64 flex-1"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={reason.trim().length < 5}
                      onClick={() => {
                        rejectRefund(r.id, reason.trim());
                        setRejecting(null);
                        toast.success("Refund rejected");
                      }}
                    >
                      Confirm reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Demo: requests raised on the attendee site reach this queue once the apps share a database. The queue, approval and
        payout deduction already work end to end here.
      </p>
    </div>
  );
}
