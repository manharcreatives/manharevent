"use client";

import { useState } from "react";
import { Button } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { Save } from "lucide-react";

const REFUND_TIERS = [
  { label: "14+ days before event", default: 100 },
  { label: "7–13 days before event", default: 75 },
  { label: "3–6 days before event", default: 50 },
  { label: "1–2 days before event", default: 25 },
  { label: "Event day / after", default: 0 },
];

export default function PolicyPage() {
  const { addAuditEntry } = useDashboardStore();
  const [tiers, setTiers] = useState(REFUND_TIERS.map((t) => ({ ...t, pct: t.default })));
  const [reentry, setReentry] = useState("unlimited");
  const [reentryWindow, setReentryWindow] = useState(30);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    addAuditEntry("policy.updated", "Refund and re-entry policy updated");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Refund & Re-entry Policy</h1>

      {/* Refund tiers */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Refund policy tiers</h2>
        <p className="text-xs text-muted-foreground">Percentage of ticket value refunded based on how far before the event the refund is requested.</p>
        <ul className="space-y-3">
          {tiers.map((tier, i) => (
            <li key={i} className="flex items-center justify-between gap-4">
              <span className="flex-1 text-sm text-foreground">{tier.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={100} step={25}
                  value={tier.pct}
                  onChange={(e) => setTiers((ts) => ts.map((t, j) => j === i ? { ...t, pct: Number(e.target.value) } : t))}
                  className="w-24 accent-primary"
                />
                <span className="w-12 text-right text-sm tabular-nums text-foreground">{tier.pct}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Re-entry policy */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Re-entry policy</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="radio" name="reentry" value="unlimited" checked={reentry === "unlimited"} onChange={() => setReentry("unlimited")} className="accent-primary" />
            Unlimited re-entry
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="radio" name="reentry" value="once" checked={reentry === "once"} onChange={() => setReentry("once")} className="accent-primary" />
            Single entry only (no re-entry)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="radio" name="reentry" value="timed" checked={reentry === "timed"} onChange={() => setReentry("timed")} className="accent-primary" />
            Timed re-entry window
          </label>
          {reentry === "timed" && (
            <div className="ml-6 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Allow re-entry within</span>
              <input
                type="number" min={5} max={120} step={5}
                value={reentryWindow}
                onChange={(e) => setReentryWindow(Number(e.target.value))}
                className="w-20 rounded-md border border-border bg-surface-raised px-2 py-1 text-sm text-foreground"
              />
              <span className="text-sm text-muted-foreground">minutes of exit</span>
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full sm:w-auto">
        <Save className="mr-1.5 h-4 w-4" />
        {saved ? "Saved!" : "Save policy"}
      </Button>
    </div>
  );
}
