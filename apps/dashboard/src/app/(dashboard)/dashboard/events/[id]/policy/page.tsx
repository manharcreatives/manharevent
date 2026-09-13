"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Plus, X } from "lucide-react";
import { Button, toast } from "@manhar-garba/ui";
import { DEFAULT_REFUND_TIERS, describeRefundTier, type RefundTier } from "@manhar-garba/domain";
import { useDashboardStore, type EventPolicy, type ReentryMode } from "@/lib/dashboard-store";
import { useEventScope } from "@/lib/use-event";

const FALLBACK: EventPolicy = { refundTiers: DEFAULT_REFUND_TIERS, reentry: "unlimited", reentryWindowMinutes: 30 };

export default function PolicyPage() {
  const { event, policy } = useEventScope();
  const updatePolicy = useDashboardStore((s) => s.updatePolicy);

  const saved = policy ?? FALLBACK;
  const [draft, setDraft] = useState<EventPolicy>(saved);
  useEffect(() => setDraft(saved), [saved]);

  if (!event) return null;

  const tiers = draft.refundTiers.slice().sort((a, b) => b.minDaysBefore - a.minDaysBefore);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // A later tier paying more than an earlier one would mean cancelling closer
  // to the event gets you *more* money back — almost always a typo.
  const nonMonotonic = tiers.some((t, i) => i > 0 && t.percent > tiers[i - 1]!.percent);

  function setTier(minDaysBefore: number, patch: Partial<RefundTier>) {
    setDraft((d) => ({
      ...d,
      refundTiers: d.refundTiers.map((t) => (t.minDaysBefore === minDaysBefore ? { ...t, ...patch } : t)),
    }));
  }

  function addTier() {
    const used = new Set(draft.refundTiers.map((t) => t.minDaysBefore));
    const candidate = [30, 21, 10, 5, 2, 1].find((d) => !used.has(d));
    if (candidate === undefined) return;
    setDraft((d) => ({ ...d, refundTiers: [...d.refundTiers, { minDaysBefore: candidate, percent: 50 }] }));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Refund &amp; re-entry policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyers see these rules at checkout and on their refund screen, and refund amounts are calculated
          from them. Platform and gateway fees are never refunded.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Refund tiers</h2>
          <button onClick={addTier} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add tier
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Measured from the first night the buyer&rsquo;s pass covers.</p>

        <ul className="space-y-3">
          {tiers.map((tier) => (
            <li key={tier.minDaysBefore} className="flex flex-wrap items-center gap-3">
              <span className="min-w-44 flex-1 text-sm text-foreground">{describeRefundTier(tier, tiers)}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={tier.percent}
                onChange={(e) => setTier(tier.minDaysBefore, { percent: Number(e.target.value) })}
                className="w-32 accent-primary"
                aria-label={`Refund percent for ${describeRefundTier(tier, tiers)}`}
              />
              <span className="tabular w-12 text-right text-sm text-foreground">{tier.percent}%</span>
              {tier.minDaysBefore !== 0 && tiers.length > 2 ? (
                <button
                  onClick={() =>
                    setDraft((d) => ({ ...d, refundTiers: d.refundTiers.filter((t) => t.minDaysBefore !== tier.minDaysBefore) }))
                  }
                  aria-label="Remove tier"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <span className="w-4" />
              )}
            </li>
          ))}
        </ul>

        {nonMonotonic && (
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            A closer-to-the-event tier refunds more than an earlier one. Buyers would get more back by waiting.
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Re-entry</h2>
        <p className="text-xs text-muted-foreground">
          The gate scanner enforces this: a pass scanned out and back in is admitted or refused by this rule.
        </p>
        {(
          [
            ["unlimited", "Unlimited re-entry", "Out for food or parking and back in, as often as they like."],
            ["once", "Single entry only", "Once scanned in, a second entry that night is refused."],
            ["timed", "Timed re-entry window", "Re-entry allowed only within a set time of scanning out."],
          ] as [ReentryMode, string, string][]
        ).map(([value, label, desc]) => (
          <label key={value} className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="radio"
              name="reentry"
              checked={draft.reentry === value}
              onChange={() => setDraft((d) => ({ ...d, reentry: value }))}
              className="mt-1 accent-primary"
            />
            <span>
              <span className="font-medium text-foreground">{label}</span>
              <span className="block text-xs text-muted-foreground">{desc}</span>
            </span>
          </label>
        ))}
        {draft.reentry === "timed" && (
          <div className="ml-6 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Within</span>
            <input
              type="number"
              min={5}
              max={180}
              step={5}
              value={draft.reentryWindowMinutes}
              onChange={(e) => setDraft((d) => ({ ...d, reentryWindowMinutes: Math.max(5, Number(e.target.value) || 5) }))}
              className="w-20 rounded-md border border-border bg-surface-raised px-2 py-1 text-foreground"
            />
            <span className="text-muted-foreground">minutes of scanning out</span>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!dirty}
          onClick={() => {
            updatePolicy(event.id, draft);
            toast.success("Policy saved", { description: "Refund quotes and the gate scanner now use these rules." });
          }}
        >
          <Save className="mr-1.5 h-4 w-4" />
          Save policy
        </Button>
        {dirty ? (
          <Button variant="ghost" onClick={() => setDraft(saved)}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Discard
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">All changes saved</span>
        )}
        <button
          onClick={() => setDraft((d) => ({ ...d, refundTiers: DEFAULT_REFUND_TIERS }))}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        >
          Reset tiers to ManharEvent defaults
        </button>
      </div>
    </div>
  );
}
