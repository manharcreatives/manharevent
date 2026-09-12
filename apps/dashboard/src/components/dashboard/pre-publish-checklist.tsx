"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface CheckItem {
  key: string;
  label: string;
  blocking: boolean;
  passed: boolean;
}

export function PrePublishChecklist() {
  const { events, passTypes, zones } = useDashboardStore();
  const ev = events[0];

  const checks: CheckItem[] = [
    { key: "payment", label: "Payment account verified", blocking: true, passed: true },
    { key: "gstin", label: "GSTIN present", blocking: true, passed: true },
    { key: "refund_policy", label: "Refund policy set", blocking: true, passed: true },
    { key: "pass_types", label: "At least 1 pass type on sale", blocking: true, passed: passTypes.some((p) => p.status === "on_sale") },
    { key: "venue", label: "Venue & zones configured", blocking: true, passed: zones.length > 0 },
    { key: "terms", label: "Organizer terms accepted", blocking: true, passed: true },
    { key: "cover", label: "Cover image uploaded", blocking: false, passed: !!ev?.cover_url },
    { key: "description", label: "Event description added", blocking: false, passed: !!ev?.description },
  ];

  const blocking = checks.filter((c) => c.blocking && !c.passed);
  const warnings = checks.filter((c) => !c.blocking && !c.passed);
  const allBlockingPass = blocking.length === 0;

  return (
    <div className="space-y-2">
      {checks.map((c) => (
        <div key={c.key} className="flex items-center gap-3">
          {c.passed
            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            : c.blocking
              ? <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              : <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
          }
          <span className={`text-sm ${c.passed ? "text-foreground" : c.blocking ? "text-destructive" : "text-muted-foreground"}`}>
            {c.label}
          </span>
          {!c.blocking && !c.passed && (
            <span className="ml-auto text-xs text-muted-foreground">(recommended)</span>
          )}
        </div>
      ))}

      {!allBlockingPass && (
        <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {blocking.length} blocking issue{blocking.length > 1 ? "s" : ""} must be resolved before publishing.
        </p>
      )}
      {allBlockingPass && warnings.length > 0 && (
        <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          {warnings.length} recommended item{warnings.length > 1 ? "s" : ""} incomplete. You can still publish.
        </p>
      )}
      {allBlockingPass && warnings.length === 0 && (
        <p className="mt-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
          All checks passed. Ready to publish.
        </p>
      )}
    </div>
  );
}
