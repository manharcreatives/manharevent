"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { Button } from "@manhar-garba/ui";
import { Plus, Tag, Users } from "lucide-react";

const QUICK_PRESETS = ["Season", "Weekend", "Daily", "Single-night", "Couple", "Family", "Group"];

export default function PassesPage() {
  const { passTypes, zones } = useDashboardStore();

  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Pass Types</h1>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add pass type
        </Button>
      </div>

      {/* Quick-add presets */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick presets</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((p) => (
            <button
              key={p}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + {p}
            </button>
          ))}
        </div>
      </div>

      {/* Pass type list */}
      <ul className="space-y-3">
        {passTypes.map((pt) => {
          const zone = zoneMap[pt.zone_id];
          return (
            <li key={pt.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${zone?.color}22` }}
                  >
                    <Tag className="h-4 w-4" style={{ color: zone?.color ?? undefined }} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{pt.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {zone && (
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: zone.color ?? undefined }} />
                          {zone.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Admits {pt.admits}
                      </span>
                      <span>{pt.night_ids.length === 9 ? "All 9 nights" : `${pt.night_ids.length} nights`}</span>
                      <span className={pt.status === "on_sale" ? "text-success" : "text-muted-foreground"}>
                        {pt.status === "on_sale" ? "On sale" : pt.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pt.sold_quantity} / {pt.total_quantity} sold
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline">Price tiers</Button>
                  <Button size="sm" variant="ghost">Edit</Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
