"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { Download } from "lucide-react";

function timeStr(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ACTION_COLOR: Record<string, string> = {
  "event.published": "text-success",
  "event.unpublished": "text-warning",
  "comp.issued": "text-primary",
  "refund.approved": "text-warning",
  "refund.rejected": "text-destructive",
  "team.added": "text-info",
  "team.removed": "text-destructive",
  "branding.updated": "text-accent",
  "policy.updated": "text-muted-foreground",
  "promo.created": "text-primary",
};

export default function AuditPage() {
  const { auditLog } = useDashboardStore();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Audit Log</h1>
        <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
        {auditLog.map((entry) => (
          <li key={entry.id} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-mono font-medium ${ACTION_COLOR[entry.action] ?? "text-muted-foreground"}`}>
                    {entry.action}
                  </span>
                  <span className="text-xs text-foreground">{entry.detail}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{entry.actor} · {timeStr(entry.timestamp)}</p>
              </div>
            </div>
          </li>
        ))}
        {auditLog.length === 0 && (
          <li className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Audit log is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">Every action — publish, refund, team changes — will appear here automatically.</p>
          </li>
        )}
      </ul>
    </div>
  );
}
