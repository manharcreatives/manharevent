"use client";

import { useEffect, useState, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { Button, EmptyState, Money, Skeleton, Badge, toast } from "@manhar-garba/ui";
import { RotateCcw, MessageCircle, Clock } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  getRefundsDataAction,
  requestRefundAction,
  type RefundableOrder,
  type RefundRow,
} from "@/app/actions/refunds";

const STATUS_VARIANT: Record<string, "default" | "primary" | "success" | "warning" | "destructive"> = {
  requested: "warning",
  approved: "primary",
  processed: "success",
  rejected: "destructive",
};

export default function RefundsPage() {
  const { phone, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<{ refundable: RefundableOrder[]; requests: RefundRow[] } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  function load(p: string) {
    setLoading(true);
    getRefundsDataAction(p)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!phone) {
      setLoading(false);
      return;
    }
    load(phone);
  }, [phone]);

  if (!isAuthenticated || !phone) {
    return (
      <div className="py-12 text-center">
        <RotateCcw className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">Refunds</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to see which of your orders can still be refunded.
        </p>
        <Button asChild className="mt-6">
          <Link href="/auth/start">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Refunds</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        How much you get back depends on how far ahead of the first night you cancel — the exact
        tiers are in our{" "}
        <Link href="/legal/refund-policy" className="text-primary hover:underline">
          refund policy
        </Link>
        .
      </p>

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {data && data.requests.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-foreground">Your requests</h2>
              <ul className="mt-2 space-y-2">
                {data.requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">Order {r.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested{" "}
                        {new Date(r.requestedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                        {r.reason ? ` · ${r.reason}` : ""}
                      </p>
                    </div>
                    <span className="tabular font-semibold text-foreground">
                      <Money paise={r.amountPaise} />
                    </span>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "default"} className="capitalize">
                      {r.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-foreground">Your paid orders</h2>
            {!data || data.refundable.length === 0 ? (
              <EmptyState
                icon={<RotateCcw />}
                title="Nothing to refund"
                description="You don't have any paid orders on this number yet."
                action={
                  <Button asChild size="sm">
                    <Link href="/">Browse passes</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="mt-2 space-y-3">
                {data.refundable.map((o) => (
                  <li key={o.orderId} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{o.eventTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          Order {o.orderNumber} · paid <Money paise={o.paidPaise} />
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {o.daysBefore >= 0
                            ? `${o.daysBefore} days before the first night`
                            : "The event has started"}
                        </p>
                      </div>

                      <div className="text-right">
                        {o.eligible ? (
                          <>
                            <p className="text-xs text-muted-foreground">
                              You&rsquo;d get back ({o.percent}%)
                            </p>
                            <p className="tabular text-lg font-bold text-foreground">
                              <Money paise={o.refundablePaise} />
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Outside the refund window
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {o.alreadyRequested ? (
                        <span className="text-xs text-warning">
                          A refund request is already open on this order.
                        </span>
                      ) : o.eligible ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const result = await requestRefundAction(
                                o.orderId,
                                "Requested from My Refunds"
                              );
                              if (result.ok) {
                                toast.success(result.message, {
                                  description:
                                    "The organizer reviews it and the money returns to your original payment method in 5–7 business days.",
                                });
                                if (phone) load(phone);
                              } else {
                                toast.error(result.message);
                              }
                            })
                          }
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          Request refund
                        </Button>
                      ) : null}

                      <a
                        href="https://wa.me/919876500000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Ask on WhatsApp
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
