"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEventScope } from "@/lib/use-event";

interface CheckItem {
  key: string;
  label: string;
  blocking: boolean;
  passed: boolean;
  /** Where to go to fix it — every failing item links somewhere real. */
  fixHref: string;
}

/**
 * Every check reads real state. Previously five of the eight were hardcoded
 * `passed: true`, so the checklist approved events that had no refund policy
 * and no payout account.
 */
export function usePrePublishChecks(): { checks: CheckItem[]; blockingFailed: number } {
  const { event, passTypes, priceTiers, zones, nights, policy, venue } = useEventScope();
  const bankAccount = useDashboardStore((s) => s.bankAccount);
  const base = `/dashboard/events/${event?.id ?? ""}`;

  const pricedPassOnSale = passTypes.some(
    (p) => p.status === "on_sale" && priceTiers.some((t) => t.pass_type_id === p.id && t.price_paise > 0)
  );

  const checks: CheckItem[] = [
    { key: "payment", label: "Payout bank account added", blocking: true, passed: bankAccount.accountNumber.replace(/\D/g, "").length >= 9, fixHref: "/dashboard/settings/payments" },
    { key: "refund_policy", label: "Refund policy set", blocking: true, passed: Boolean(policy && policy.refundTiers.length > 0), fixHref: `${base}/policy` },
    { key: "pass_types", label: "At least one priced pass type on sale", blocking: true, passed: pricedPassOnSale, fixHref: `${base}/passes` },
    { key: "nights", label: "Nights scheduled", blocking: true, passed: nights.length > 0, fixHref: `${base}/nights` },
    { key: "venue", label: "Venue and zones configured", blocking: true, passed: Boolean(venue) && zones.length > 0, fixHref: `${base}/venue` },
    { key: "themes", label: "Every night has a theme", blocking: false, passed: nights.length > 0 && nights.every((n) => Boolean(n.theme)), fixHref: `${base}/nights` },
    { key: "cover", label: "Cover image uploaded", blocking: false, passed: Boolean(event?.cover_url), fixHref: "/dashboard/settings/branding" },
    { key: "description", label: "Event description added", blocking: false, passed: Boolean(event?.description), fixHref: `${base}` },
  ];

  return { checks, blockingFailed: checks.filter((c) => c.blocking && !c.passed).length };
}

export function PrePublishChecklist() {
  const { checks, blockingFailed } = usePrePublishChecks();
  const warnings = checks.filter((c) => !c.blocking && !c.passed).length;

  return (
    <div className="space-y-2">
      {checks.map((c) => (
        <div key={c.key} className="flex items-center gap-3">
          {c.passed ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          ) : c.blocking ? (
            <XCircle className="h-4 w-4 shrink-0 text-destructive" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
          )}
          <span className={`text-sm ${c.passed ? "text-foreground" : c.blocking ? "text-destructive" : "text-muted-foreground"}`}>
            {c.label}
          </span>
          {!c.passed && (
            <Link href={c.fixHref} className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline">
              {c.blocking ? "Fix" : "Add"} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      ))}

      {blockingFailed > 0 && (
        <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {blockingFailed} blocking issue{blockingFailed > 1 ? "s" : ""} must be fixed before publishing.
        </p>
      )}
      {blockingFailed === 0 && warnings > 0 && (
        <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          {warnings} recommended item{warnings > 1 ? "s" : ""} incomplete. You can still publish.
        </p>
      )}
      {blockingFailed === 0 && warnings === 0 && (
        <p className="mt-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">All checks passed. Ready to publish.</p>
      )}
    </div>
  );
}
