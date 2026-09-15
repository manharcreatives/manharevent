"use client";

import { useState } from "react";
import { Plus, Tag, Users, Pencil, Trash2, IndianRupee, X, Moon, Check } from "lucide-react";
import {
  Button,
  Input,
  Field,
  Money,
  ConfirmDialog,
  EmptyState,
  toast,
} from "@manhar-garba/ui";
import type { PassType } from "@manhar-garba/domain";
import { paise } from "@manhar-garba/domain";
import { useDashboardStore, type PassTypeDraft } from "@/lib/dashboard-store";
import { useEventScope } from "@/lib/use-event";

/**
 * Garba doesn't sell "Gold / Silver / General" seats — it sells a *span of
 * nights* for a *number of people* in a *zone*. One pass admits N people to M
 * nights, and that single shape covers every real SKU: Season Couple Gold,
 * Weekend Family General, a one-night VIP. So the editor below asks for
 * exactly those three things and nothing else.
 */
const KIND_LABELS: Record<PassType["kind"], string> = {
  season: "Season — all nights",
  weekend: "Weekend nights only",
  daily: "Any single night (valid once)",
  single_night: "One specific night",
};

/** The combinations an organizer reaches for first; each fills the form, never saves on its own. */
const PRESETS: { label: string; patch: Partial<PassTypeDraft> }[] = [
  { label: "Season · Solo", patch: { kind: "season", admits: 1 } },
  { label: "Season · Couple", patch: { kind: "season", admits: 2 } },
  { label: "Season · Family (4)", patch: { kind: "season", admits: 4 } },
  { label: "Weekend · Couple", patch: { kind: "weekend", admits: 2 } },
  { label: "Single night · Solo", patch: { kind: "single_night", admits: 1 } },
];

export default function PassesPage() {
  const { event, passTypes, zones, nights, priceTiers } = useEventScope();
  const { addPassType, updatePassType, removePassType } = useDashboardStore();

  const [editorFor, setEditorFor] = useState<"new" | string | null>(null);
  const [seed, setSeed] = useState<Partial<PassTypeDraft>>({});
  const [tiersFor, setTiersFor] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PassType | null>(null);

  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z]));
  const editing = typeof editorFor === "string" && editorFor !== "new"
    ? passTypes.find((p) => p.id === editorFor)
    : undefined;

  // Quick-add: one single-night pass per night of the event in one click,
  // rather than opening the editor N times. Price defaults to ₹299 — meant
  // to be tuned per night with the inline price editor below, not shipped
  // as-is (a Thursday pass rarely sells for the same price as a Saturday).
  function addOneNightPerNightPasses() {
    if (!event || nights.length === 0) return;
    const zoneId = zones[0]?.id;
    if (!zoneId) {
      toast.error("Add a zone first — every pass type needs one.");
      return;
    }
    for (const night of nights) {
      addPassType(event.id, {
        name: `Single Night — ${night.theme ?? `Night ${night.night_number}`}`,
        zoneId,
        kind: "single_night",
        admits: 1,
        nightIds: [night.id],
        totalQuantity: 500,
        maxPerOrder: 10,
        pricePaise: 29900,
        description: `${night.theme ?? `Night ${night.night_number}`} only. Admits 1.`,
      });
    }
    toast.success(`${nights.length} single-night passes created`, {
      description: "Edit each one's price below — they were all created at ₹299.",
    });
  }

  function openNew(patch: Partial<PassTypeDraft> = {}) {
    setSeed(patch);
    setEditorFor("new");
    setTiersFor(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Pass types</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {passTypes.length} on sale · a pass admits N people to M nights in one zone
          </p>
        </div>
        <Button size="sm" onClick={() => openNew()}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add pass type
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Start from a common shape
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => openNew(p.patch)}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + {p.label}
            </button>
          ))}
          {nights.length > 1 && (
            <button
              onClick={addOneNightPerNightPasses}
              className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + Single night — one per night ({nights.length})
            </button>
          )}
        </div>
      </div>

      {editorFor === "new" && (
        <PassTypeEditor
          seed={seed}
          onCancel={() => setEditorFor(null)}
          onSave={(draft) => {
            if (event) addPassType(event.id, draft);
            setEditorFor(null);
            toast.success(`${draft.name} created`, {
              description: "It's on sale now. Add more price tiers if you run early-bird pricing.",
            });
          }}
        />
      )}

      {passTypes.length === 0 ? (
        <EmptyState
          icon={<Tag />}
          title="No pass types yet"
          description="Create at least one before you publish — an event with no pass type has nothing to sell."
          action={
            <Button size="sm" onClick={() => openNew()}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first pass type
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {passTypes.map((pt) => {
            const zone = zoneMap[pt.zone_id];
            const tiers = priceTiers
              .filter((t) => t.pass_type_id === pt.id)
              .sort((a, b) => a.sort_order - b.sort_order);
            const isEditing = editing?.id === pt.id;

            if (isEditing) {
              return (
                <li key={pt.id}>
                  <PassTypeEditor
                    initial={pt}
                    onCancel={() => setEditorFor(null)}
                    onSave={(draft) => {
                      updatePassType(pt.id, draft);
                      setEditorFor(null);
                      toast.success(`${draft.name} updated`);
                    }}
                  />
                </li>
              );
            }

            return (
              <li key={pt.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${zone?.color ?? "#888"}22` }}
                    >
                      <Tag className="h-4 w-4" style={{ color: zone?.color ?? undefined }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{pt.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {zone && (
                          <span className="flex items-center gap-1">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: zone.color ?? undefined }}
                            />
                            {zone.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Admits {pt.admits}
                        </span>
                        <span className="flex items-center gap-1">
                          <Moon className="h-3 w-3" />
                          {pt.night_ids.length === nights.length
                            ? `All ${nights.length} nights`
                            : `${pt.night_ids.length} night${pt.night_ids.length === 1 ? "" : "s"}`}
                        </span>
                        <span className={pt.status === "on_sale" ? "text-success" : ""}>
                          {pt.status === "on_sale" ? "On sale" : pt.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {pt.sold_quantity.toLocaleString("en-IN")} /{" "}
                        {pt.total_quantity.toLocaleString("en-IN")} sold
                        {tiers[0] && (
                          <>
                            {" · from "}
                            <Money paise={Math.min(...tiers.map((t) => t.price_paise))} />
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTiersFor(tiersFor === pt.id ? null : pt.id)}
                    >
                      <IndianRupee className="mr-1 h-3.5 w-3.5" />
                      Price tiers ({tiers.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditorFor(pt.id);
                        setTiersFor(null);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <button
                      onClick={() => setPendingDelete(pt)}
                      aria-label={`Delete ${pt.name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {tiersFor === pt.id && <PriceTierPanel passTypeId={pt.id} />}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name ?? "this pass type"}?`}
        description={
          pendingDelete && pendingDelete.sold_quantity > 0
            ? `${pendingDelete.sold_quantity} of these have already been sold. Deleting it removes it from sale — passes already issued stay valid at the gate.`
            : "It will be removed from sale immediately, along with its price tiers."
        }
        confirmLabel="Delete pass type"
        onConfirm={() => {
          if (pendingDelete) {
            removePassType(pendingDelete.id);
            toast.success(`${pendingDelete.name} deleted`);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

function PassTypeEditor({
  initial,
  seed,
  onSave,
  onCancel,
}: {
  initial?: PassType;
  seed?: Partial<PassTypeDraft>;
  onSave: (draft: PassTypeDraft) => void;
  onCancel: () => void;
}) {
  const { zones, nights, priceTiers, passTypes } = useEventScope();
  const existingPrice = initial
    ? priceTiers.find((t) => t.pass_type_id === initial.id)?.price_paise
    : undefined;

  const [name, setName] = useState(initial?.name ?? "");
  const [zoneId, setZoneId] = useState(initial?.zone_id ?? seed?.zoneId ?? zones[0]?.id ?? "");
  const [kind, setKind] = useState<PassType["kind"]>(initial?.kind ?? seed?.kind ?? "season");
  const [admits, setAdmits] = useState(String(initial?.admits ?? seed?.admits ?? 1));
  const [nightIds, setNightIds] = useState<string[]>(
    initial?.night_ids ?? (seed?.kind === "season" || !seed?.kind ? nights.map((n) => n.id) : [])
  );
  const [quantity, setQuantity] = useState(String(initial?.total_quantity ?? 1000));
  const [maxPerOrder, setMaxPerOrder] = useState(String(initial?.max_per_order ?? 4));
  const [priceRupees, setPriceRupees] = useState(
    existingPrice ? String(Math.round(existingPrice / 100)) : ""
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  // ADM-42: advisory only — sums every pass type's total_quantity×admits in
  // this zone for each selected night, against the zone's capacity. Doesn't
  // block save (an organizer may deliberately oversell general admission),
  // just surfaces it before it becomes a gate-night surprise.
  const zoneCapacity = zones.find((z) => z.id === zoneId)?.capacity;
  const admitsNum = Number(admits) || 0;
  const quantityNum = Number(quantity) || 0;
  const oversoldNights = nightIds.reduce<{ id: string; night_number: number }[]>((acc, nightId) => {
    const night = nights.find((n) => n.id === nightId);
    if (!night || zoneCapacity === undefined) return acc;
    const committed = passTypes
      .filter((pt) => pt.id !== initial?.id && pt.zone_id === zoneId && pt.night_ids.includes(night.id))
      .reduce((sum, pt) => sum + pt.total_quantity * pt.admits, 0);
    if (committed + quantityNum * admitsNum > zoneCapacity) acc.push(night);
    return acc;
  }, []);

  function toggleNight(id: string) {
    setError(null);
    setNightIds((cur) => (cur.includes(id) ? cur.filter((n) => n !== id) : [...cur, id]));
  }

  function save() {
    if (!name.trim()) {
      setError("Give the pass a name buyers will recognise, e.g. “Season Couple — Gold”.");
      return;
    }
    if (nightIds.length === 0) {
      setError("Pick at least one night. A pass that covers no night can't admit anyone.");
      return;
    }
    const admitsNum = Number(admits);
    if (!Number.isInteger(admitsNum) || admitsNum < 1) {
      setError("Admits must be at least 1.");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setError("Enter how many of these you're putting on sale.");
      return;
    }
    // ADM-42: this is a UI-level guard only — nothing here actually locks
    // inventory, so a second organizer editing the same pass type at the
    // same moment could still both pass this check. The real constraint
    // (a row lock / unique-capacity constraint) belongs to the DB phase.
    if (initial) {
      const committed = initial.sold_quantity + initial.held_quantity;
      if (qty < committed) {
        setError(
          `Can't drop quantity below ${committed} — ${initial.sold_quantity} already sold and ${initial.held_quantity} held can't be un-committed.`
        );
        return;
      }
    }
    const rupees = Number(priceRupees);
    if (!initial && (!Number.isFinite(rupees) || rupees <= 0)) {
      setError("Enter a price in rupees.");
      return;
    }
    onSave({
      name: name.trim(),
      zoneId,
      kind,
      admits: admitsNum,
      nightIds,
      totalQuantity: qty,
      maxPerOrder: Math.max(1, Number(maxPerOrder) || 1),
      pricePaise: Math.round(rupees * 100),
      description: description.trim(),
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/40 bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pass name">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Season Couple — Gold"
          />
        </Field>
        <Field label="Zone">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kind">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={kind}
            onChange={(e) => {
              const next = e.target.value as PassType["kind"];
              setKind(next);
              if (next === "season") setNightIds(nights.map((n) => n.id));
            }}
          >
            {(Object.keys(KIND_LABELS) as PassType["kind"][]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Admits (how many people enter on one pass)">
          <Input
            value={admits}
            onChange={(e) => {
              setAdmits(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
            }}
            inputMode="numeric"
            placeholder="2"
            className="tabular"
          />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Nights this pass covers
          </span>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setNightIds(nights.map((n) => n.id))}
              className="text-primary hover:underline"
            >
              All
            </button>
            <button
              onClick={() => setNightIds([])}
              className="text-muted-foreground hover:underline"
            >
              None
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {nights.map((n) => {
            const on = nightIds.includes(n.id);
            return (
              <button
                key={n.id}
                onClick={() => toggleNight(n.id)}
                aria-pressed={on}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  on
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Night {n.night_number}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Quantity on sale">
          <Input
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
            }}
            inputMode="numeric"
            className="tabular"
          />
        </Field>
        <Field label="Max per order">
          <Input
            value={maxPerOrder}
            onChange={(e) => setMaxPerOrder(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            className="tabular"
          />
        </Field>
        <Field label={initial ? "Price (edit under Price tiers)" : "Price (₹)"}>
          <Input
            value={priceRupees}
            onChange={(e) => {
              setPriceRupees(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
            }}
            inputMode="numeric"
            placeholder="8999"
            disabled={Boolean(initial)}
            className="tabular"
          />
        </Field>
      </div>

      <Field label="Description shown to buyers (optional)">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="All 9 nights, Gold Zone. Admits 2."
        />
      </Field>

      {oversoldNights.length > 0 && (
        <p className="text-xs text-warning">
          This oversells zone capacity ({zoneCapacity} admits) on{" "}
          {oversoldNights.map((n) => `Night ${n.night_number}`).join(", ")} once every pass type in this zone
          is counted at full admits × quantity.
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save}>
          {initial ? "Save changes" : "Create pass type"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Price tiers are how early-bird pricing works: the same pass at a lower price
 * until a date or a quantity cap is hit. An organizer running "first 500 at
 * ₹6,999" needs exactly this and nothing more elaborate.
 */
function PriceTierPanel({ passTypeId }: { passTypeId: string }) {
  const { priceTiers, addPriceTier, updatePriceTier, removePriceTier } = useDashboardStore();
  const tiers = priceTiers
    .filter((t) => t.pass_type_id === passTypeId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [name, setName] = useState("");
  const [rupees, setRupees] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editRupees, setEditRupees] = useState("");

  function startEdit(tierId: string, currentPaise: number) {
    setEditingTierId(tierId);
    setEditRupees(String(Math.round(currentPaise / 100)));
  }

  function saveEdit(tierId: string) {
    const value = Number(editRupees);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a price in rupees.");
      return;
    }
    // ADM-control pricing: this is the one place a tier's price changes —
    // every buyer-facing number (web "from ₹", checkout total) reads the
    // same price_paise, so this is what actually moves the public price.
    updatePriceTier(tierId, { price_paise: paise(Math.round(value * 100)) });
    setEditingTierId(null);
    toast.success("Price updated");
  }

  function add() {
    if (!name.trim()) {
      setError("Name the tier — Early Bird, Regular, At the gate.");
      return;
    }
    const value = Number(rupees);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter the tier price in rupees.");
      return;
    }
    addPriceTier(passTypeId, name.trim(), Math.round(value * 100));
    setName("");
    setRupees("");
    setError(null);
    toast.success("Price tier added");
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface-sunken p-3">
      <ul className="space-y-1.5">
        {tiers.map((t) => (
          <li key={t.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1 text-foreground">{t.name}</span>
            {editingTierId === t.id ? (
              <>
                <span className="flex items-center gap-1 text-muted-foreground">
                  ₹
                  <Input
                    value={editRupees}
                    onChange={(e) => setEditRupees(e.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    autoFocus
                    className="tabular h-7 w-20"
                  />
                </span>
                <button onClick={() => saveEdit(t.id)} aria-label={`Save ${t.name} price`} className="text-success hover:text-success/80">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingTierId(null)} aria-label="Cancel" className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="tabular text-muted-foreground">
                  <Money paise={t.price_paise} />
                </span>
                <span className="tabular text-xs text-muted-foreground">
                  {t.quantity_sold.toLocaleString("en-IN")} sold
                </span>
                <button
                  onClick={() => startEdit(t.id, t.price_paise)}
                  aria-label={`Edit ${t.name} price`}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (tiers.length === 1) {
                      toast.error("A pass type needs at least one price tier.");
                      return;
                    }
                    removePriceTier(t.id);
                    toast.success(`${t.name} tier removed`);
                  }}
                  aria-label={`Remove ${t.name} tier`}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="Early Bird"
          className="h-9 w-40"
        />
        <Input
          value={rupees}
          onChange={(e) => {
            setRupees(e.target.value.replace(/[^\d]/g, ""));
            setError(null);
          }}
          placeholder="6999"
          inputMode="numeric"
          className="tabular h-9 w-28"
        />
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add tier
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
