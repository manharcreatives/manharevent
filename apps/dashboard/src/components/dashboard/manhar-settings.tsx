"use client";

import Link from "next/link";
import { Palette, Globe, Landmark, Bell, ScrollText, ArrowRight, type LucideIcon } from "lucide-react";
import { useDashboardStore, maskedAccountNumber } from "@/lib/dashboard-store";

interface Section {
  href: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
}

const SECTIONS: Section[] = [
  { href: "/dashboard/settings/branding", label: "Branding", desc: "Your colours and logo on the public booking page", Icon: Palette },
  { href: "/dashboard/settings/domain", label: "Domain", desc: "Your subdomain, or a custom domain you own", Icon: Globe },
  { href: "/dashboard/settings/payments", label: "Payments & payouts", desc: "The bank account the money lands in", Icon: Landmark },
  { href: "/dashboard/settings/notifications", label: "Notifications", desc: "Which WhatsApp, SMS and email templates send", Icon: Bell },
  { href: "/dashboard/settings/audit", label: "Audit log", desc: "Every change, who made it, and when", Icon: ScrollText },
];

/**
 * A landing page for Settings.
 *
 * The sidebar's Settings entry used to jump straight to Branding, which made
 * "where do I change my bank account?" a matter of guessing which of five
 * sub-items it lives under. This says what each one holds and what it is
 * currently set to.
 */
export function ManharSettings() {
  const branding = useDashboardStore((s) => s.branding);
  const domain = useDashboardStore((s) => s.domainSettings);
  const bank = useDashboardStore((s) => s.bankAccount);
  const notifications = useDashboardStore((s) => s.notifications);
  const auditLog = useDashboardStore((s) => s.auditLog);

  const notificationsOn = Object.values(notifications).filter(Boolean).length;
  const notificationsTotal = Object.values(notifications).length;

  const status: Record<string, string> = {
    "/dashboard/settings/branding": branding.logoUrl ? "Logo uploaded" : "Using the default mark",
    "/dashboard/settings/domain":
      domain.status === "verified"
        ? `${domain.customDomain || `${domain.subdomain}.manharevent.com`} · verified`
        : domain.status === "pending_dns"
          ? `${domain.customDomain} · waiting on DNS`
          : `${domain.subdomain}.manharevent.com`,
    "/dashboard/settings/payments": bank.accountNumber
      ? `${maskedAccountNumber(bank.accountNumber)} · ${bank.ifsc}`
      : "No account on file",
    "/dashboard/settings/notifications": `${notificationsOn} of ${notificationsTotal} templates sending`,
    "/dashboard/settings/audit": `${auditLog.length.toLocaleString("en-IN")} entries`,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How your booking page looks, where the money goes, and what your buyers hear from you.
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {SECTIONS.map(({ href, label, desc, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-raised"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">{desc}</span>
                <span className="mt-0.5 block truncate text-xs text-placeholder">{status[href]}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
