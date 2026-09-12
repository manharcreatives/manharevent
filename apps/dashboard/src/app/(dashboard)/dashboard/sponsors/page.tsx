"use client";

import { Button, EmptyState } from "@manhar-garba/ui";
import { Plus, Star } from "lucide-react";

const MOCK_SPONSORS = [
  { id: "s1", name: "Gujarat Textiles Co.", tier: "Title Sponsor", budget: 500000, status: "confirmed" },
  { id: "s2", name: "Parle Agro", tier: "Gold Sponsor", budget: 250000, status: "confirmed" },
  { id: "s3", name: "Lifestyle Stores", tier: "Silver Sponsor", budget: 100000, status: "pending" },
];

export default function SponsorsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Sponsors</h1>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add sponsor
        </Button>
      </div>

      {MOCK_SPONSORS.length === 0 && (
        <EmptyState
          icon={<Star />}
          title="No sponsors yet"
          description="Add title sponsors, gold sponsors, and partners. Sponsor budgets and status are tracked here."
          action={<Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Add your first sponsor</Button>}
        />
      )}
      <ul className="space-y-3">
        {MOCK_SPONSORS.map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15">
                <Star className="h-5 w-5 text-gold" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.tier} · ₹{(s.budget / 100).toLocaleString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${s.status === "confirmed" ? "text-success" : "text-warning"}`}>
                  {s.status}
                </span>
                <Button size="sm" variant="ghost">Manage</Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
