"use client";

import { useState } from "react";
import { useDashboardStore } from "@/lib/dashboard-store";
import { PrePublishChecklist } from "@/components/dashboard/pre-publish-checklist";
import { Button } from "@manhar-garba/ui";
import { Globe, Lock } from "lucide-react";

export default function PublishPage() {
  const { events, addAuditEntry } = useDashboardStore();
  const ev = events[0];
  const [published, setPublished] = useState(ev?.status === "published");

  function handleToggle() {
    const next = !published;
    setPublished(next);
    addAuditEntry(next ? "event.published" : "event.unpublished",
      `${ev?.title ?? "Event"} ${next ? "published" : "unpublished"}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Publish</h1>

      {/* Status */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {published
              ? <Globe className="h-5 w-5 text-success" />
              : <Lock className="h-5 w-5 text-muted-foreground" />
            }
            <div>
              <p className="font-medium text-foreground">{published ? "Live" : "Draft"}</p>
              <p className="text-xs text-muted-foreground">
                {published
                  ? "Your event is visible to attendees and accepting bookings."
                  : "Your event is not visible to the public."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={published ? "outline" : "primary"}
            onClick={handleToggle}
          >
            {published ? "Unpublish" : "Publish now"}
          </Button>
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Pre-publish checklist</h2>
        <PrePublishChecklist />
      </div>

      {/* Public URL */}
      {published && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Public URL</p>
          <a
            href={`http://localhost:3000/e/${ev?.slug}`}
            target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            localhost:3000/e/{ev?.slug}
          </a>
        </div>
      )}
    </div>
  );
}
