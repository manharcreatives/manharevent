"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Button, Switch, toast } from "@manhar-garba/ui";
import { useDashboardStore, type NotificationPrefs } from "@/lib/dashboard-store";

const TEMPLATES: {
  key: keyof NotificationPrefs;
  label: string;
  channel: string;
  detail: string;
}[] = [
  {
    key: "whatsappTickets",
    label: "Pass delivery (with QR)",
    channel: "WhatsApp",
    detail: "Sent the moment payment is confirmed. Turning this off means buyers only get their pass in My Passes.",
  },
  {
    key: "whatsappReminders",
    label: "Night reminder",
    channel: "WhatsApp",
    detail: "24 hours before each night the pass covers, with gate and dress-code details.",
  },
  {
    key: "smsFallback",
    label: "SMS fallback",
    channel: "SMS (DLT-registered)",
    detail: "Sends by SMS when WhatsApp delivery fails — the usual cause is a number with no WhatsApp.",
  },
  {
    key: "emailInvoices",
    label: "GST invoice",
    channel: "Email",
    detail: "Emails the tax invoice after purchase. Buyers who gave no email always get it in My Orders.",
  },
  {
    key: "dailySalesDigest",
    label: "Daily sales digest",
    channel: "WhatsApp — to you",
    detail: "One message at 9am: yesterday's sales, refunds, and remaining stock per zone.",
  },
  {
    key: "lowStockAlerts",
    label: "Low stock alert",
    channel: "WhatsApp — to you",
    detail: "Tells you when any pass type drops below 10% remaining, so you can re-price or release more.",
  },
];

export default function NotificationsPage() {
  const saved = useDashboardStore((s) => s.notifications);
  const updateNotifications = useDashboardStore((s) => s.updateNotifications);

  // A local draft so toggling six switches is one save, not six audit entries.
  const [draft, setDraft] = useState<NotificationPrefs>(saved);
  useEffect(() => setDraft(saved), [saved]);

  const dirty = (Object.keys(saved) as (keyof NotificationPrefs)[]).some(
    (k) => saved[k] !== draft[k]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every template is pre-approved for WhatsApp and DLT-registered for SMS. You control which
          ones send — contact support to change the wording.
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {TEMPLATES.map((t) => (
          <li key={t.key} className="flex items-start gap-4 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <label htmlFor={t.key} className="cursor-pointer font-medium text-foreground">
                {t.label}
              </label>
              <p className="text-xs text-muted-foreground">{t.channel}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">{t.detail}</p>
            </div>
            <Switch
              id={t.key}
              checked={draft[t.key]}
              onCheckedChange={(checked) => setDraft((d) => ({ ...d, [t.key]: checked }))}
            />
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() => {
            updateNotifications(draft);
            toast.success("Notification preferences saved");
          }}
        >
          <Save className="mr-1.5 h-4 w-4" />
          Save preferences
        </Button>
        {dirty && (
          <Button size="sm" variant="ghost" onClick={() => setDraft(saved)}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Discard changes
          </Button>
        )}
        {!dirty && <span className="text-xs text-muted-foreground">All changes saved</span>}
      </div>
    </div>
  );
}
