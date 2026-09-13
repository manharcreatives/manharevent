"use client";

import { useState } from "react";
import { MapPin, DoorOpen, Pencil, AlertTriangle } from "lucide-react";
import { ZoneMap, Button, Input, Field, toast } from "@manhar-garba/ui";
import type { Gate, Venue, Zone } from "@manhar-garba/domain";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEventScope } from "@/lib/use-event";

const DIRECTION_LABELS: Record<Gate["direction"], string> = {
  entry: "Entry only",
  exit: "Exit only",
  both: "Entry & exit",
};

export default function VenuePage() {
  const { zones, gates, venue } = useEventScope();

  const [editingVenue, setEditingVenue] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingGateId, setEditingGateId] = useState<string | null>(null);

  const zoneCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  // A zone plan that adds up to more than the ground holds is a safety problem
  // long before it's a ticketing one, so it gets said out loud here.
  const overCapacity =
    venue?.total_capacity != null && zoneCapacity > venue.total_capacity;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Venue &amp; zones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {zones.length} zones · {gates.length} gates · {zoneCapacity.toLocaleString("en-IN")}{" "}
            zone capacity
          </p>
        </div>
        {!editingVenue && venue && (
          <Button size="sm" variant="outline" onClick={() => setEditingVenue(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit venue
          </Button>
        )}
      </div>

      {overCapacity && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-foreground">
            Your zones add up to {zoneCapacity.toLocaleString("en-IN")}, more than the venue&rsquo;s
            stated capacity of {venue?.total_capacity?.toLocaleString("en-IN")}. Fix one or the other
            before you publish.
          </p>
        </div>
      )}

      {!venue ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No venue linked to this event.</p>
      ) : editingVenue ? (
        <VenueEditor venue={venue} onDone={() => setEditingVenue(false)} />
      ) : (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">{venue.name}</p>
              <p className="text-sm text-muted-foreground">
                {[venue.address, venue.city, venue.pincode].filter(Boolean).join(", ")}
              </p>
              {venue.total_capacity !== null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Total capacity: {venue.total_capacity.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Zone layout</h2>
          <ZoneMap className="max-w-[280px]" />
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Zones</h2>
          <ul className="space-y-3">
            {zones.map((z) =>
              editingZoneId === z.id ? (
                <li key={z.id}>
                  <ZoneEditor zone={z} onDone={() => setEditingZoneId(null)} />
                </li>
              ) : (
                <li key={z.id} className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: z.color ?? undefined }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{z.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{z.description}</p>
                  </div>
                  <span className="tabular shrink-0 text-sm text-muted-foreground">
                    {z.capacity.toLocaleString("en-IN")} cap
                  </span>
                  <button
                    onClick={() => setEditingZoneId(z.id)}
                    aria-label={`Edit ${z.name}`}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Gate ↔ zone assignment</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          A gate&rsquo;s zone decides which passes the scanner accepts there — a Gold pass presented
          at the General gate is turned away.
        </p>
        <ul className="divide-y divide-border">
          {gates.map((g) =>
            editingGateId === g.id ? (
              <li key={g.id} className="py-3">
                <GateEditor gate={g} onDone={() => setEditingGateId(null)} />
              </li>
            ) : (
              <li key={g.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DIRECTION_LABELS[g.direction]} · code {g.code}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditingGateId(g.id)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}

function VenueEditor({ venue, onDone }: { venue: Venue; onDone: () => void }) {
  const updateVenue = useDashboardStore((s) => s.updateVenue);
  const [name, setName] = useState(venue.name);
  const [address, setAddress] = useState(venue.address ?? "");
  const [city, setCity] = useState(venue.city);
  const [pincode, setPincode] = useState(venue.pincode ?? "");
  const [capacity, setCapacity] = useState(String(venue.total_capacity ?? ""));
  const [mapsUrl, setMapsUrl] = useState(venue.google_maps_url ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!name.trim() || !city.trim()) {
      setError("Venue name and city are both required — they appear on every pass.");
      return;
    }
    updateVenue(venue.id, {
      name: name.trim(),
      address: address.trim() || null,
      city: city.trim(),
      pincode: pincode.trim() || null,
      total_capacity: capacity ? Number(capacity) : null,
      google_maps_url: mapsUrl.trim() || null,
    });
    toast.success("Venue updated");
    onDone();
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/40 bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Venue name">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
        </Field>
        <Field label="City">
          <Input
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setError(null);
            }}
          />
        </Field>
      </div>
      <Field label="Address">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pincode">
          <Input
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            className="font-mono"
          />
        </Field>
        <Field label="Total capacity">
          <Input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            className="tabular"
          />
        </Field>
      </div>
      <Field label="Google Maps link (shown to buyers)">
        <Input
          value={mapsUrl}
          onChange={(e) => setMapsUrl(e.target.value)}
          placeholder="https://maps.app.goo.gl/…"
        />
      </Field>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save}>
          Save venue
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ZoneEditor({ zone, onDone }: { zone: Zone; onDone: () => void }) {
  const updateZone = useDashboardStore((s) => s.updateZone);
  const [name, setName] = useState(zone.name);
  const [description, setDescription] = useState(zone.description ?? "");
  const [capacity, setCapacity] = useState(String(zone.capacity ?? ""));

  return (
    <div className="space-y-3 rounded-lg border border-primary/40 bg-surface-sunken p-3">
      <Field label="Zone name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Description shown to buyers">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Capacity">
        <Input
          value={capacity}
          onChange={(e) => setCapacity(e.target.value.replace(/[^\d]/g, ""))}
          inputMode="numeric"
          className="tabular max-w-40"
        />
      </Field>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            updateZone(zone.id, {
              name: name.trim() || zone.name,
              description: description.trim() || null,
              capacity: Number(capacity) || 0,
            });
            toast.success(`${name} updated`);
            onDone();
          }}
        >
          Save zone
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function GateEditor({ gate, onDone }: { gate: Gate; onDone: () => void }) {
  const updateGate = useDashboardStore((s) => s.updateGate);
  const [name, setName] = useState(gate.name);
  const [direction, setDirection] = useState<Gate["direction"]>(gate.direction);

  return (
    <div className="space-y-3 rounded-lg border border-primary/40 bg-surface-sunken p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Gate name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Direction">
          <select
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            value={direction}
            onChange={(e) => setDirection(e.target.value as Gate["direction"])}
          >
            {(Object.keys(DIRECTION_LABELS) as Gate["direction"][]).map((d) => (
              <option key={d} value={d}>
                {DIRECTION_LABELS[d]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            updateGate(gate.id, { name: name.trim() || gate.name, direction });
            toast.success(`${name} updated`);
            onDone();
          }}
        >
          Save gate
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
