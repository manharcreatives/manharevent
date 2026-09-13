"use client";

import { useState } from "react";
import { Plus, Star, Trash2, Pencil } from "lucide-react";
import {
  Button,
  EmptyState,
  Input,
  Field,
  Money,
  ConfirmDialog,
  toast,
} from "@manhar-garba/ui";
import {
  useDashboardStore,
  type SponsorRecord,
  type SponsorStatus,
} from "@/lib/dashboard-store";

const TIERS = ["Title Sponsor", "Gold Sponsor", "Silver Sponsor", "Partner", "In-kind"];

const STATUS_STYLE: Record<SponsorStatus, string> = {
  confirmed: "bg-success/15 text-success hover:bg-success/25",
  pending: "bg-warning/15 text-warning hover:bg-warning/25",
  declined: "bg-destructive/10 text-destructive hover:bg-destructive/20",
};

/** Clicking the status chip cycles it — faster than opening a form to flip one field. */
const NEXT_STATUS: Record<SponsorStatus, SponsorStatus> = {
  pending: "confirmed",
  confirmed: "declined",
  declined: "pending",
};

export default function SponsorsPage() {
  const { sponsors, addSponsor, updateSponsor, removeSponsor } = useDashboardStore();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SponsorRecord | null>(null);

  const confirmedPaise = sponsors
    .filter((s) => s.status === "confirmed")
    .reduce((sum, s) => sum + s.budgetPaise, 0);
  const pipelinePaise = sponsors
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.budgetPaise, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Sponsors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Money paise={confirmedPaise} /> confirmed
            {pipelinePaise > 0 && (
              <>
                {" · "}
                <Money paise={pipelinePaise} /> still pending
              </>
            )}
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
          Add sponsor
        </Button>
      </div>

      {adding && (
        <SponsorForm
          onCancel={() => setAdding(false)}
          onSave={(draft) => {
            addSponsor(draft);
            setAdding(false);
            toast.success(`${draft.name} added`);
          }}
        />
      )}

      {sponsors.length === 0 ? (
        <EmptyState
          icon={<Star />}
          title="No sponsors yet"
          description="Add title sponsors, gold sponsors, and partners. Budgets and confirmation status are tracked here."
          action={
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first sponsor
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {sponsors.map((s) =>
            editingId === s.id ? (
              <li key={s.id}>
                <SponsorForm
                  initial={s}
                  onCancel={() => setEditingId(null)}
                  onSave={(draft) => {
                    updateSponsor(s.id, draft);
                    setEditingId(null);
                    toast.success(`${draft.name} updated`);
                  }}
                />
              </li>
            ) : (
              <li key={s.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15">
                    <Star className="h-5 w-5 text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.tier} · <Money paise={s.budgetPaise} />
                      {s.contact && ` · ${s.contact}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const next = NEXT_STATUS[s.status];
                        updateSponsor(s.id, { status: next });
                        toast.success(`${s.name} marked ${next}`);
                      }}
                      title="Click to change status"
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${STATUS_STYLE[s.status]}`}
                    >
                      {s.status}
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(s.id);
                        setAdding(false);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <button
                      onClick={() => setPendingDelete(s)}
                      aria-label={`Remove ${s.name}`}
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
        title={`Remove ${pendingDelete?.name ?? "this sponsor"}?`}
        description="This only removes them from your sponsor list. Any signage or credits already published stay as they are."
        confirmLabel="Remove sponsor"
        onConfirm={() => {
          if (pendingDelete) {
            removeSponsor(pendingDelete.id);
            toast.success(`${pendingDelete.name} removed`);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

type SponsorDraft = Omit<SponsorRecord, "id">;

function SponsorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: SponsorRecord;
  onSave: (draft: SponsorDraft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [tier, setTier] = useState(initial?.tier ?? TIERS[0]!);
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  // Entered in rupees because that is how a sponsorship is negotiated; stored
  // in paise because that is how every amount in this codebase is held.
  const [budgetRupees, setBudgetRupees] = useState(
    initial ? String(Math.round(initial.budgetPaise / 100)) : ""
  );
  const [status, setStatus] = useState<SponsorStatus>(initial?.status ?? "pending");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!name.trim()) {
      setError("Give the sponsor a name.");
      return;
    }
    const rupees = Number(budgetRupees);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setError("Enter the sponsorship amount in rupees.");
      return;
    }
    onSave({
      name: name.trim(),
      tier,
      contact: contact.trim(),
      phone: phone.trim(),
      budgetPaise: Math.round(rupees * 100),
      status,
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sponsor name">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Gujarat Textiles Co."
          />
        </Field>
        <Field label="Tier">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount (₹)">
          <Input
            value={budgetRupees}
            onChange={(e) => {
              setBudgetRupees(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
            }}
            placeholder="500000"
            inputMode="numeric"
            className="tabular"
          />
        </Field>
        <Field label="Status">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={status}
            onChange={(e) => setStatus(e.target.value as SponsorStatus)}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
          </select>
        </Field>
        <Field label="Contact person">
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Rajesh Modi"
          />
        </Field>
        <Field label="Mobile number">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98250 33001"
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
          {initial ? "Save changes" : "Add sponsor"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
