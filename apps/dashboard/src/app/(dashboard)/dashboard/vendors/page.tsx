"use client";

import { Button, EmptyState } from "@manhar-garba/ui";
import { Plus, Store } from "lucide-react";

const MOCK_VENDORS = [
  { id: "v1", name: "Patel Food Corner", category: "Food & Beverages", zone: "General", contact: "Haresh Patel", revenue: 48600, status: "active" },
  { id: "v2", name: "Garba Merchandise", category: "Merchandise", zone: "Gold", contact: "Nita Desai", revenue: 22300, status: "active" },
  { id: "v3", name: "Parking Services", category: "Parking", zone: "All zones", contact: "Bharat Shah", revenue: 18900, status: "active" },
];

export default function VendorsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Vendors</h1>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add vendor
        </Button>
      </div>

      {MOCK_VENDORS.length === 0 && (
        <EmptyState
          icon={<Store />}
          title="No vendors yet"
          description="Add food stalls, merchandise sellers, and parking operators. Each vendor's sales are tracked separately."
          action={<Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Add your first vendor</Button>}
        />
      )}
      <ul className="space-y-3">
        {MOCK_VENDORS.map((v) => (
          <li key={v.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                <Store className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.category} · {v.zone} · {v.contact}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="tabular-nums text-muted-foreground">₹{(v.revenue / 100).toLocaleString("en-IN")}</span>
                <span className="text-success text-xs">{v.status}</span>
                <Button size="sm" variant="ghost">Manage</Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
