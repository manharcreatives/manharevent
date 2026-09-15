"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Field, toast } from "@manhar-garba/ui";
import { Plus, X } from "lucide-react";
import { createMyEventAction } from "@/app/actions/org";

interface PassRow {
  name: string;
  admits: string;
  priceRupees: string;
  totalQuantity: string;
}

const EMPTY_PASS: PassRow = { name: "Season Pass", admits: "1", priceRupees: "", totalQuantity: "500" };

/**
 * The new-organizer "Create Event" — intentionally the simple open-ground
 * shape (one general zone, all-night passes), not the full zoned/clone
 * wizard Manhar's own team uses. See createEventForTenant (packages/
 * mock-data/src/repo.ts) for what this actually creates.
 */
export function OrgCreateEvent() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [totalCapacity, setTotalCapacity] = useState("500");
  const [nightCount, setNightCount] = useState("3");
  const [startDate, setStartDate] = useState("");
  const [passes, setPasses] = useState<PassRow[]>([EMPTY_PASS]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updatePass(i: number, patch: Partial<PassRow>) {
    setPasses((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function handleCreate() {
    setError(null);
    if (!title.trim()) return setError("Give your event a name.");
    if (!city.trim()) return setError("Which city is it in?");
    const cap = Number(totalCapacity);
    if (!Number.isInteger(cap) || cap < 1) return setError("Enter a capacity of at least 1.");
    const nights = Number(nightCount);
    if (!Number.isInteger(nights) || nights < 1) return setError("Enter at least 1 night.");
    if (!startDate) return setError("Pick the first night's date.");
    if (passes.length === 0) return setError("Add at least one pass.");

    const parsedPasses = [];
    for (const p of passes) {
      const admits = Number(p.admits);
      const price = Number(p.priceRupees);
      const qty = Number(p.totalQuantity);
      if (!p.name.trim()) return setError("Every pass needs a name.");
      if (!Number.isInteger(admits) || admits < 1) return setError(`"${p.name}": admits must be at least 1.`);
      if (!Number.isFinite(price) || price <= 0) return setError(`"${p.name}": enter a price in rupees.`);
      if (!Number.isInteger(qty) || qty < 1) return setError(`"${p.name}": enter a quantity.`);
      // Money = integer paise, always — never a float.
      parsedPasses.push({ name: p.name.trim(), admits, pricePaise: Math.round(price * 100), totalQuantity: qty });
    }

    setSubmitting(true);
    const result = await createMyEventAction({
      title: title.trim(),
      city: city.trim(),
      totalCapacity: cap,
      nightCount: nights,
      startDate,
      passTypes: parsedPasses,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error("Couldn't create the event — sign in again and retry.");
      return;
    }
    toast.success(`${result.event.title} created`, { description: "It's a draft — publish it from My Events when ready." });
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Create event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One general ground, no zones — the way most Garba grounds actually sell tickets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event name" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Satellite Garba Nights" />
        </Field>
        <Field label="City" required>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ahmedabad" />
        </Field>
        <Field label="Ground capacity" required>
          <Input type="number" min={1} value={totalCapacity} onChange={(e) => setTotalCapacity(e.target.value)} />
        </Field>
        <Field label="Number of nights" required>
          <Input type="number" min={1} value={nightCount} onChange={(e) => setNightCount(e.target.value)} />
        </Field>
        <Field label="First night" required>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Starter passes (all covering every night)
          </span>
          <button
            type="button"
            onClick={() => setPasses((rows) => [...rows, { ...EMPTY_PASS, name: "" }])}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add pass
          </button>
        </div>
        <div className="space-y-3">
          {passes.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_6rem_6rem_auto] items-end gap-2 rounded-lg border border-border bg-surface p-3">
              <Field label="Name">
                <Input value={p.name} onChange={(e) => updatePass(i, { name: e.target.value })} placeholder="Season Pass" />
              </Field>
              <Field label="Admits">
                <Input type="number" min={1} value={p.admits} onChange={(e) => updatePass(i, { admits: e.target.value })} />
              </Field>
              <Field label="Price (₹)">
                <Input type="number" min={1} value={p.priceRupees} onChange={(e) => updatePass(i, { priceRupees: e.target.value })} placeholder="2500" />
              </Field>
              <Field label="Quantity">
                <Input type="number" min={1} value={p.totalQuantity} onChange={(e) => updatePass(i, { totalQuantity: e.target.value })} />
              </Field>
              {passes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPasses((rows) => rows.filter((_, idx) => idx !== i))}
                  aria-label="Remove pass"
                  className="mb-2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-raised hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={submitting}>
          {submitting ? "Creating…" : "Create draft event"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>Cancel</Button>
      </div>
      <p className="text-xs text-muted-foreground">Saved as a draft — publish it from My Events when you&rsquo;re ready.</p>
    </div>
  );
}
