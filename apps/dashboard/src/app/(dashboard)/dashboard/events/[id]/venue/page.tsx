"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { ZoneMap } from "@manhar-garba/ui";
import { Button } from "@manhar-garba/ui";
import { MapPin, DoorOpen, Edit } from "lucide-react";

export default function VenuePage() {
  const { zones } = useDashboardStore();


  const GATES = [
    { id: "G1", name: "Gate 1 — VIP Entrance", zones: ["VIP Zone"], direction: "Entry only" },
    { id: "G2", name: "Gate 2 — Gold North", zones: ["Gold Zone"], direction: "Entry & Exit" },
    { id: "G3", name: "Gate 3 — Gold South", zones: ["Gold Zone"], direction: "Entry & Exit" },
    { id: "G4", name: "Gate 4 — General", zones: ["General Zone"], direction: "Entry & Exit" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Venue & Zones</h1>
        <Button size="sm" variant="outline">
          <Edit className="mr-1.5 h-4 w-4" />
          Edit venue
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Sardar Patel Ground</p>
            <p className="text-sm text-muted-foreground">Near Law Garden, Ellisbridge, Ahmedabad — 380006</p>
            <p className="mt-1 text-sm text-muted-foreground">Total capacity: 25,000</p>
          </div>
        </div>
      </div>

      {/* Zone map + list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Zone layout</h2>
          <ZoneMap className="max-w-[280px]" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Zones</h2>
          <ul className="space-y-3">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: z.color ?? undefined }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{z.name}</p>
                  <p className="text-xs text-muted-foreground">{z.description}</p>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{z.capacity?.toLocaleString("en-IN")} cap</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Gate ↔ zone matrix */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Gate ↔ Zone assignment</h2>
        <ul className="divide-y divide-border">
          {GATES.map((g) => (
            <li key={g.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.direction} · {g.zones.join(", ")}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost">Edit</Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
