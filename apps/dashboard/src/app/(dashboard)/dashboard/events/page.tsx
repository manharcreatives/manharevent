"use client";

import Link from "next/link";
import { useDashboardStore } from "@/lib/dashboard-store";
import { Button } from "@manhar-garba/ui";
import { Plus, Copy, Calendar, ArrowRight } from "lucide-react";

const STATUS_CHIP: Record<string, { bg: string; text: string }> = {
  published: { bg: "bg-success/15", text: "text-success" },
  draft: { bg: "bg-muted/30", text: "text-muted-foreground" },
  ended: { bg: "bg-surface-raised", text: "text-muted-foreground" },
};

export default function EventsPage() {
  const { events } = useDashboardStore();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Events</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/events/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New event
          </Link>
        </Button>
      </div>

      <ul className="space-y-3">
        {events.map((ev) => {
          const chip = STATUS_CHIP[ev.status] ?? { bg: "bg-muted/30", text: "text-muted-foreground" };
          return (
            <li key={ev.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground truncate">{ev.title}</h2>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${chip.bg} ${chip.text}`}>
                      {ev.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{ev.starts_on} — {ev.ends_on}</p>
                  <p className="text-sm text-muted-foreground">{ev.subtitle}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground" title="Clone event">
                    <Copy className="h-4 w-4" />
                  </button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/events/${ev.id}`}>
                      Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
