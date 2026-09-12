"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { Button } from "@manhar-garba/ui";
import { Music, Palette, Shirt, Edit } from "lucide-react";

export default function NightsPage() {
  const { nights } = useDashboardStore();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-foreground mb-4">Nights & Themes</h1>
      <ul className="space-y-3">
        {nights.map((night) => (
          <li key={night.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: night.theme_color ?? "hsl(var(--primary))" }}
                >
                  {night.night_number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">Night {night.night_number}</p>
                    <span className="text-sm text-muted-foreground">{night.date}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {night.theme && (
                      <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
                        <Palette className="h-3 w-3" /> {night.theme}
                      </span>
                    )}
                    {night.dress_code && (
                      <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
                        <Shirt className="h-3 w-3" /> {night.dress_code}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Gates open {night.gates_open_at?.slice(11, 16)} IST · Show {night.starts_at?.slice(11, 16)} IST
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="ghost">
                  <Music className="mr-1.5 h-3.5 w-3.5" />
                  Lineup
                </Button>
                <Button size="sm" variant="ghost">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
