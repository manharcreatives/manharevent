"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { TenantApplication } from "@manhar-garba/domain";
import { Button, Skeleton } from "@manhar-garba/ui";
import { Globe2, LayoutDashboard, ScanLine } from "lucide-react";
import { useRegistrationStore } from "@/lib/registration-store";
import { useRouter } from "@/i18n/navigation";
import { getApplicationAction } from "@/app/actions/registration";

// Each surface is a separate app. In production these resolve to the
// organizer's own subdomain; locally they fall back to the dev ports. One
// variable name per app, shared with the other apps' .env.example.
const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
const DASHBOARD_APP_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";
const SCANNER_APP_URL = process.env.NEXT_PUBLIC_SCANNER_URL ?? "http://localhost:3002";
const ROOT_DOMAIN = "manharevent.com";

export default function RegisterProvisionedPage() {
  const t = useTranslations("RegisterProvisioned");
  const router = useRouter();
  const { applicationId } = useRegistrationStore();

  const [application, setApplication] = useState<TenantApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) {
      router.replace("/register/status");
      return;
    }
    getApplicationAction(applicationId).then((result) => {
      if (cancelled) return;
      const isReady = result?.status === "approved" && Boolean(result.provisionedAt);
      if (!isReady) {
        router.replace("/register/status");
        return;
      }
      setApplication(result);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [applicationId, router]);

  if (loading || !application) {
    return (
      <div className="mx-auto max-w-[560px] space-y-4 px-4 py-16 sm:px-6">
        {/* Real heading, not a grey bar — the page keeps its identity while it loads. */}
        <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const links = [
    {
      icon: Globe2,
      title: t("websiteTitle"),
      desc: t("websiteDesc"),
      cta: t("websiteCta"),
      // The subdomain the organizer asked for, shown as it will be live — the
      // link itself opens the demo site, which serves the seeded organizer.
      address: `${application.desiredDomain}.${ROOT_DOMAIN}`,
      href: `${WEB_APP_URL}/en`,
    },
    {
      icon: LayoutDashboard,
      title: t("adminTitle"),
      desc: t("adminDesc"),
      cta: t("adminCta"),
      // ADM-16 fix: this used to link straight into the dashboard with no
      // sign-in at all — anyone with the URL saw the shell. Now it's the
      // same login every return visit uses, phone prefilled from the
      // application so it's still a one-click hand-off.
      address: `${application.desiredDomain}.${ROOT_DOMAIN}/dashboard`,
      href: `/login?phone=${application.phone.replace(/\D/g, "").slice(-10)}`,
    },
    {
      icon: ScanLine,
      title: t("scannerTitle"),
      desc: t("scannerDesc"),
      cta: t("scannerCta"),
      // This used to point at `/team/gate-staff` on the dashboard, a route that
      // doesn't exist. Scanner access is issued from the Team page; the gate
      // phones themselves open the scanner app.
      address: SCANNER_APP_URL.replace(/^https?:\/\//, ""),
      href: `${DASHBOARD_APP_URL}/dashboard/team/gate-staff`,
    },
  ];

  return (
    <div className="mx-auto max-w-[560px] px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8 space-y-4">
        {links.map(({ icon: Icon, title, desc, cta, href, address }) => (
          <div key={title} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
            <Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              <p className="mt-1 font-mono text-xs text-foreground">{address}</p>
              <Button asChild size="sm" className="mt-3">
                <a href={href} target="_blank" rel="noreferrer">{cta}</a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
