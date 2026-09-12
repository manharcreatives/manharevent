"use client";

import { useState } from "react";
import { Button } from "@manhar-garba/ui";

const TEMPLATES = [
  { key: "booking_confirmation", label: "Booking confirmation", channel: "WhatsApp + SMS", status: "active" },
  { key: "pass_delivery", label: "Pass delivery (with QR)", channel: "WhatsApp", status: "active" },
  { key: "night_reminder", label: "Night reminder (24h before)", channel: "WhatsApp", status: "active" },
  { key: "refund_processed", label: "Refund processed", channel: "WhatsApp + SMS", status: "active" },
  { key: "waitlist_available", label: "Waitlist — passes available", channel: "SMS + Email", status: "inactive" },
];

export default function NotificationsPage() {
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(TEMPLATES.map((t) => [t.key, t.status === "active"]))
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">Notification Templates</h1>
      <p className="text-sm text-muted-foreground">All templates are pre-approved for WhatsApp and DLT-registered for SMS. Contact support to modify copy.</p>

      <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
        {TEMPLATES.map((t) => (
          <li key={t.key} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.channel}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active[t.key] ?? false}
                onChange={(e) => setActive((s) => ({ ...s, [t.key]: e.target.checked }))}
                className="sr-only"
              />
              <div className={`relative h-5 w-9 rounded-full transition-colors ${active[t.key] ? "bg-primary" : "bg-border"}`}>
                <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${active[t.key] ? "translate-x-4" : ""}`} />
              </div>
            </label>
          </li>
        ))}
      </ul>
      <Button size="sm">Save preferences</Button>
    </div>
  );
}
