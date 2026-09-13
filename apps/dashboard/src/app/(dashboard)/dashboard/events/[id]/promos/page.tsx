"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ToggleLeft, ToggleRight, TicketPercent, Copy, Check } from "lucide-react";
import { Button, EmptyState, Input, Field, toast } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEventScope, publicEventUrl } from "@/lib/use-event";

export default function PromosPage() {
  const { promos, addPromo, togglePromo } = useDashboardStore();
  const { event } = useEventScope();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"flat" | "percent">("percent");
  const [value, setValue] = useState(10);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const active = promos.filter((p) => p.active).length;
  const redeemed = promos.reduce((sum, p) => sum + p.usedCount, 0);

  function handleAdd() {
    const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
    if (normalized.length < 3) {
      setError("Give the code at least three characters — buyers type this by hand.");
      return;
    }
    if (promos.some((p) => p.code === normalized)) {
      setError(`${normalized} already exists.`);
      return;
    }
    if (type === "percent" && (value <= 0 || value > 100)) {
      setError("A percentage discount has to be between 1 and 100.");
      return;
    }
    if (type === "flat" && value <= 0) {
      setError("Enter how many rupees to take off.");
      return;
    }
    // Flat discounts are entered in rupees and stored in paise, like every
    // other amount in this codebase.
    addPromo({ code: normalized, type, value: type === "flat" ? value * 100 : value, maxUses, active: true });
    toast.success(`${normalized} is live`, { description: "Buyers can enter it at checkout straight away." });
    setCode("");
    setError(null);
    setShowForm(false);
  }

  /** Share link with the code pre-filled — what actually gets sent to a WhatsApp group. */
  function shareLink(promoCode: string): string {
    return event ? `${publicEventUrl(event.slug)}?promo=${promoCode}` : "";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Promo codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {promos.length === 0
              ? "Discounts buyers type at checkout."
              : `${active} of ${promos.length} active · ${redeemed.toLocaleString("en-IN")} redemption${redeemed === 1 ? "" : "s"} so far.`}
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowForm((s) => !s); setError(null); }}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add promo
        </Button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code">
              <Input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
                placeholder="NAVRATRI10"
                className="font-mono uppercase"
                autoFocus
              />
            </Field>
            <Field label="Type">
              <select
                aria-label="Discount type"
                className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
                value={type}
                onChange={(e) => { setType(e.target.value as "flat" | "percent"); setError(null); }}
              >
                <option value="percent">% discount</option>
                <option value="flat">Flat ₹ off</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={type === "percent" ? "Discount %" : "Discount ₹"}>
              <Input
                type="number"
                value={value}
                onChange={(e) => { setValue(Number(e.target.value)); setError(null); }}
                inputMode="numeric"
              />
            </Field>
            <Field label="Max uses (blank = unlimited)">
              <Input
                type="number"
                value={maxUses ?? ""}
                onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                placeholder="Unlimited"
                inputMode="numeric"
              />
            </Field>
          </div>

          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Save promo</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {promos.length === 0 ? (
        <EmptyState
          icon={<TicketPercent />}
          title="No promo codes yet"
          description="An early-bird code for the family WhatsApp group, or a flat discount for a sponsor's staff — buyers enter it at checkout and the discount shows before they pay."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create your first code
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {promos.map((p) => {
            const exhausted = p.maxUses !== null && p.usedCount >= p.maxUses;
            const link = shareLink(p.code);
            return (
              <li key={p.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-bold text-foreground">{p.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.type === "percent" ? `${p.value}% off` : `₹${(p.value / 100).toLocaleString("en-IN")} off`}
                      {" · "}
                      {p.usedCount.toLocaleString("en-IN")} used{p.maxUses ? ` of ${p.maxUses.toLocaleString("en-IN")}` : " · unlimited"}
                      {exhausted && " · fully redeemed"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {link && (
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(link);
                          setCopied(p.id);
                          toast.success("Share link copied", { description: link });
                          setTimeout(() => setCopied(null), 2000);
                        }}
                        aria-label={`Copy the share link for promo code ${p.code}`}
                        className="flex h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground sm:h-9"
                      >
                        {copied === p.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        Share link
                      </button>
                    )}
                    <span
                      className={`text-xs ${p.active ? "text-success" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    >
                      {p.active ? "Active" : "Paused"}
                    </span>
                    {/* Icon-only before this: a screen reader announced "button"
                        and nothing else, on the one control that stops a
                        discount from being redeemed. */}
                    <button
                      onClick={() => {
                        togglePromo(p.id);
                        toast.success(p.active ? `${p.code} paused` : `${p.code} is live again`);
                      }}
                      role="switch"
                      aria-checked={p.active}
                      aria-label={`${p.code} — ${p.active ? "active, pause this code" : "paused, make this code active"}`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground sm:h-9 sm:w-9"
                    >
                      {p.active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {promos.length > 0 && event && (
        <p className="text-xs text-muted-foreground">
          Redemptions are counted on the{" "}
          <Link href={`/dashboard/events/${event.id}/reports`} className="text-primary hover:underline">
            sales report
          </Link>
          , and every code change is recorded in the{" "}
          <Link href="/dashboard/settings/audit" className="text-primary hover:underline">
            audit log
          </Link>
          .
        </p>
      )}
    </div>
  );
}
