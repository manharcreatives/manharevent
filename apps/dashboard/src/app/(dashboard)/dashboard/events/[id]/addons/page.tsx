"use client";

import { useState } from "react";
import { Plus, Zap, Car, ShoppingBag, Pencil, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Field,
  Money,
  EmptyState,
  ConfirmDialog,
  toast,
} from "@manhar-garba/ui";
import type { AddOn } from "@manhar-garba/domain";
import { useDashboardStore, type AddonDraft } from "@/lib/dashboard-store";
import { useEventScope } from "@/lib/use-event";

const KIND_ICON: Record<AddOn["kind"], React.ReactNode> = {
  parking: <Car className="h-4 w-4" />,
  wallet_topup: <Zap className="h-4 w-4" />,
  merchandise: <ShoppingBag className="h-4 w-4" />,
};

const KIND_LABELS: Record<AddOn["kind"], string> = {
  parking: "Parking",
  wallet_topup: "Wallet top-up",
  merchandise: "Merchandise",
};

export default function AddonsPage() {
  const { event, addons, zones } = useEventScope();
  const { addAddon, updateAddon, removeAddon } = useDashboardStore();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AddOn | null>(null);

  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z.name]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Add-ons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Parking, food wallet, and merchandise sold alongside a pass.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setAdding((a) => !a);
            setEditingId(null);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add add-on
        </Button>
      </div>

      {adding && (
        <AddonForm
          onCancel={() => setAdding(false)}
          onSave={(draft) => {
            if (event) addAddon(event.id, draft);
            setAdding(false);
            toast.success(`${draft.name} added`);
          }}
        />
      )}

      {addons.length === 0 ? (
        <EmptyState
          icon={<Zap />}
          title="No add-ons yet"
          description="Parking and a pre-loaded food wallet are the two that sell best — buyers add them in the same checkout as their pass."
          action={
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first add-on
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {addons.map((a) =>
            editingId === a.id ? (
              <li key={a.id}>
                <AddonForm
                  initial={a}
                  onCancel={() => setEditingId(null)}
                  onSave={(draft) => {
                    updateAddon(a.id, draft);
                    setEditingId(null);
                    toast.success(`${draft.name} updated`);
                  }}
                />
              </li>
            ) : (
              <li key={a.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground">
                      {KIND_ICON[a.kind]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {KIND_LABELS[a.kind]} · <Money paise={a.price_paise} />
                        {a.zone_id && ` · ${zoneMap[a.zone_id] ?? "zone"}`}
                        {a.total_quantity !== null &&
                          ` · ${a.total_quantity.toLocaleString("en-IN")} available`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="tabular text-muted-foreground">
                      {a.sold_quantity.toLocaleString("en-IN")} sold
                    </span>
                    <span className={a.status === "on_sale" ? "text-success" : "text-muted-foreground"}>
                      {a.status === "on_sale" ? "Active" : a.status}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(a.id);
                        setAdding(false);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <button
                      onClick={() => setPendingDelete(a)}
                      aria-label={`Remove ${a.name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Remove ${pendingDelete?.name ?? "this add-on"}?`}
        description="It stops being offered at checkout. Add-ons people already bought are unaffected."
        confirmLabel="Remove add-on"
        onConfirm={() => {
          if (pendingDelete) {
            removeAddon(pendingDelete.id);
            toast.success(`${pendingDelete.name} removed`);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

function AddonForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: AddOn;
  onSave: (draft: AddonDraft) => void;
  onCancel: () => void;
}) {
  const { zones } = useEventScope();
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<AddOn["kind"]>(initial?.kind ?? "parking");
  const [rupees, setRupees] = useState(
    initial ? String(Math.round(initial.price_paise / 100)) : ""
  );
  const [limited, setLimited] = useState(initial ? initial.total_quantity !== null : false);
  const [quantity, setQuantity] = useState(String(initial?.total_quantity ?? 1000));
  const [zoneId, setZoneId] = useState(initial?.zone_id ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!name.trim()) {
      setError("Give the add-on a name.");
      return;
    }
    const value = Number(rupees);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a price in rupees.");
      return;
    }
    onSave({
      name: name.trim(),
      kind,
      pricePaise: Math.round(value * 100),
      totalQuantity: limited ? Math.max(1, Number(quantity) || 1) : null,
      zoneId: zoneId || null,
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/40 bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="4-Wheeler Parking (All 9 Nights)"
          />
        </Field>
        <Field label="Kind">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={kind}
            onChange={(e) => setKind(e.target.value as AddOn["kind"])}
          >
            {(Object.keys(KIND_LABELS) as AddOn["kind"][]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (₹)">
          <Input
            value={rupees}
            onChange={(e) => {
              setRupees(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
            }}
            inputMode="numeric"
            placeholder="1500"
            className="tabular"
          />
        </Field>
        <Field label="Restrict to a zone (optional)">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
          >
            <option value="">Any zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {kind === "wallet_topup" && (
        <p className="rounded-lg border border-info/30 bg-info/10 p-2.5 text-xs text-muted-foreground">
          A wallet top-up credits the buyer the same amount to spend at food and merchandise stalls,
          so the price and the credit always match.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={limited}
          onChange={(e) => setLimited(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Limited quantity
      </label>

      {limited && (
        <Field label="How many available">
          <Input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            className="tabular max-w-40"
          />
        </Field>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save}>
          {initial ? "Save changes" : "Create add-on"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
