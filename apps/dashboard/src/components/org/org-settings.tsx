"use client";

import { useEffect, useState } from "react";
import type { Tenant } from "@manhar-garba/domain";
import { getMyDashboardAction } from "@/app/actions/org";

/**
 * Deliberately minimal — branding/domain/payments/notifications editors are
 * Manhar-only this week (see PROGRESS.md decision log). Honest placeholder,
 * not a fake "coming soon" screen dressed up as a real settings page.
 */
export function OrgSettings() {
  const [tenant, setTenant] = useState<Tenant | null | undefined>(undefined);

  useEffect(() => {
    getMyDashboardAction().then((data) => setTenant(data?.tenant ?? null));
  }, []);

  if (tenant === undefined) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your organization&rsquo;s basic details.</p>
      </div>

      <dl className="space-y-2.5 rounded-xl border border-border bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Organization</dt>
          <dd className="text-right text-foreground">{tenant?.display_name ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Support phone</dt>
          <dd className="text-right text-foreground">{tenant?.support_phone ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="text-right capitalize text-foreground">{tenant?.status ?? "—"}</dd>
        </div>
      </dl>

      <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        Branding, custom domain, payment details and notification templates are being built next — this
        week&rsquo;s dashboard covers creating and publishing events only.
      </p>
    </div>
  );
}
