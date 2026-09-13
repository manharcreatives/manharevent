"use client";

import { useState } from "react";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEventScope } from "@/lib/use-event";
import { Button, Input, Field } from "@manhar-garba/ui";
import { Plus, Gift } from "lucide-react";

export default function CompsPage() {
  const { passTypes } = useEventScope();
  const { comps, addCompPass } = useDashboardStore();
  const [showForm, setShowForm] = useState(false);
  const [holderName, setHolderName] = useState("");
  const [passTypeId, setPassTypeId] = useState(passTypes[0]?.id ?? "");
  const [reason, setReason] = useState("");

  function handleIssue() {
    if (!holderName.trim() || !reason.trim()) return;
    const pt = passTypes.find((p) => p.id === passTypeId);
    addCompPass({ holderName, passTypeName: pt?.name ?? "Pass", reason });
    setHolderName(""); setReason(""); setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Complimentary Passes</h1>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Issue comp pass
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Recipient name" required>
              <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Pass type">
              <select
                className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
                value={passTypeId} onChange={(e) => setPassTypeId(e.target.value)}
              >
                {passTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>{pt.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Reason (required for audit trail)" required>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Media team, sponsor, VIP guest…" />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleIssue} disabled={!holderName.trim() || !reason.trim()}>Issue pass</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {comps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Gift className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-foreground">No complimentary passes yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Issue a comp pass to media, sponsors, or VIP guests. Each issue is logged automatically for audit.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Issue your first comp pass →
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {comps.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{c.holderName}</p>
                  <p className="text-xs text-muted-foreground">{c.passTypeName} · {c.reason}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(c.issuedAt).toLocaleDateString("en-IN")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
