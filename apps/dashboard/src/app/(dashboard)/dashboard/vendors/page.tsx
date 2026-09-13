"use client";

import { useState } from "react";
import { Plus, Store, Trash2, Pencil, Check, X } from "lucide-react";
import {
  Button,
  EmptyState,
  Input,
  Field,
  Money,
  ConfirmDialog,
  toast,
} from "@manhar-garba/ui";
import { useDashboardStore, type VendorRecord } from "@/lib/dashboard-store";
import { zones as allZones } from "@manhar-garba/mock-data";

const CATEGORIES = ["Food & Beverages", "Merchandise", "Parking", "Photography", "Other"];

export default function VendorsPage() {
  const { vendors, addVendor, updateVendor, removeVendor } = useDashboardStore();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VendorRecord | null>(null);

  const totalPaise = vendors.reduce((sum, v) => sum + v.revenuePaise, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Vendors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {vendors.length} stall{vendors.length === 1 ? "" : "s"} ·{" "}
            <Money paise={totalPaise} /> tracked this season
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
          Add vendor
        </Button>
      </div>

      {adding && (
        <VendorForm
          onCancel={() => setAdding(false)}
          onSave={(draft) => {
            addVendor(draft);
            setAdding(false);
            toast.success(`${draft.name} added`);
          }}
        />
      )}

      {vendors.length === 0 ? (
        <EmptyState
          icon={<Store />}
          title="No vendors yet"
          description="Add food stalls, merchandise sellers, and parking operators. Each vendor's sales are tracked separately."
          action={
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first vendor
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {vendors.map((v) =>
            editingId === v.id ? (
              <li key={v.id}>
                <VendorForm
                  initial={v}
                  onCancel={() => setEditingId(null)}
                  onSave={(draft) => {
                    updateVendor(v.id, draft);
                    setEditingId(null);
                    toast.success(`${draft.name} updated`);
                  }}
                />
              </li>
            ) : (
              <li key={v.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                    <Store className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{v.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.category} · {v.zone} · {v.contact} · {v.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="tabular text-muted-foreground">
                      <Money paise={v.revenuePaise} />
                    </span>
                    <button
                      onClick={() => {
                        updateVendor(v.id, { active: !v.active });
                        toast.success(`${v.name} marked ${v.active ? "inactive" : "active"}`);
                      }}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                        v.active
                          ? "bg-success/15 text-success hover:bg-success/25"
                          : "bg-surface-raised text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {v.active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {v.active ? "Active" : "Inactive"}
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(v.id);
                        setAdding(false);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <button
                      onClick={() => setPendingDelete(v)}
                      aria-label={`Remove ${v.name}`}
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
        title={`Remove ${pendingDelete?.name ?? "this vendor"}?`}
        description="Their recorded sales stay in your reports — only the vendor listing is removed."
        confirmLabel="Remove vendor"
        onConfirm={() => {
          if (pendingDelete) {
            removeVendor(pendingDelete.id);
            toast.success(`${pendingDelete.name} removed`);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

type VendorDraft = Omit<VendorRecord, "id" | "revenuePaise" | "active">;

function VendorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: VendorRecord;
  onSave: (draft: VendorDraft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]!);
  const [zone, setZone] = useState(initial?.zone ?? "All zones");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!name.trim()) {
      setError("Give the stall a name.");
      return;
    }
    if (!contact.trim()) {
      setError("Add a contact person — someone has to be reachable on the night.");
      return;
    }
    onSave({ name: name.trim(), category, zone, contact: contact.trim(), phone: phone.trim() });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stall name">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Patel Food Corner"
          />
        </Field>
        <Field label="Category">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Zone">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            <option value="All zones">All zones</option>
            {allZones.map((z) => (
              <option key={z.id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contact person">
          <Input
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              setError(null);
            }}
            placeholder="Haresh Patel"
          />
        </Field>
        <Field label="Mobile number">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98250 22001"
            inputMode="tel"
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save}>
          {initial ? "Save changes" : "Add vendor"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
