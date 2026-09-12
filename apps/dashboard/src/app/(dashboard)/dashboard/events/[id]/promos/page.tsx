"use client";

import { useState } from "react";
import { useDashboardStore } from "@/lib/dashboard-store";
import { Button, Input, Field } from "@manhar-garba/ui";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";

export default function PromosPage() {
  const { promos, addPromo, togglePromo } = useDashboardStore();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"flat" | "percent">("percent");
  const [value, setValue] = useState(10);
  const [maxUses, setMaxUses] = useState<number | null>(null);

  function handleAdd() {
    if (!code.trim()) return;
    addPromo({ code: code.toUpperCase(), type, value: type === "flat" ? value * 100 : value, maxUses, active: true });
    setCode(""); setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Promo Codes</h1>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add promo
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="NAVRATRI10" />
            </Field>
            <Field label="Type">
              <select
                className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
                value={type} onChange={(e) => setType(e.target.value as "flat" | "percent")}
              >
                <option value="percent">% discount</option>
                <option value="flat">Flat ₹ off</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={type === "percent" ? "Discount %" : "Discount ₹"}>
              <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
            </Field>
            <Field label="Max uses (blank = unlimited)">
              <Input type="number" value={maxUses ?? ""} onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Save promo</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {promos.map((p) => (
          <li key={p.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-bold text-foreground">{p.code}</p>
                <p className="text-xs text-muted-foreground">
                  {p.type === "percent" ? `${p.value}% off` : `₹${(p.value / 100).toFixed(0)} off`}
                  {" · "}
                  {p.usedCount} used{p.maxUses ? ` / ${p.maxUses}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={p.active ? "text-success text-xs" : "text-muted-foreground text-xs"}>
                  {p.active ? "Active" : "Inactive"}
                </span>
                <button onClick={() => togglePromo(p.id)} className="text-muted-foreground hover:text-foreground">
                  {p.active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
