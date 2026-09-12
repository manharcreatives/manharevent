"use client";

import { Button } from "@manhar-garba/ui";
import { Smartphone, Wifi, WifiOff, Plus } from "lucide-react";

const MOCK_DEVICES = [
  { id: "d1", label: "Gate 1 — Main Entry", staffName: "Ramesh Patel", gate: "G1", lastSync: "2 min ago", online: true },
  { id: "d2", label: "Gate 2 — Gold North", staffName: "Suresh Mehta", gate: "G2", lastSync: "45 sec ago", online: true },
  { id: "d3", label: "Gate 3 — Gold South", staffName: "Kiran Joshi", gate: "G3", lastSync: "8 min ago", online: false },
  { id: "d4", label: "Gate 4 — General", staffName: "Dipesh Bhatt", gate: "G4", lastSync: "1 min ago", online: true },
];

export default function GateStaffPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Gate Staff & Devices</h1>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add device
        </Button>
      </div>

      <ul className="space-y-3">
        {MOCK_DEVICES.map((d) => (
          <li key={d.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{d.label}</p>
                  {d.online
                    ? <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs text-success"><Wifi className="h-3 w-3" /> Online</span>
                    : <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive"><WifiOff className="h-3 w-3" /> Offline</span>
                  }
                </div>
                <p className="text-xs text-muted-foreground">{d.staffName} · Gate {d.gate} · last sync {d.lastSync}</p>
              </div>
              <Button size="sm" variant="ghost">Reassign</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
