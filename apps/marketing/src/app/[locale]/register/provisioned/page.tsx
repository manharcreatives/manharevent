"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { TenantApplication } from "@manhar-garba/domain";
import { Button, Skeleton } from "@manhar-garba/ui";
import { Globe2, LayoutDashboard, ScanLine } from "lucide-react";
import { useRegistrationStore } from "@/lib/registration-store";
import { useRouter } from "@/i18n/navigation";
import { getApplicationAction } from "@/app/actions/registration";

// Dev-environment links — apps/web and apps/dashboard run as separate
// Next.js apps in this monorepo. A real deployment would resolve these to
// the organizer's actual provisioned subdomain instead.
const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";
const DASHBOARD_APP_URL = process.env.NEXT_PUBLIC_DASHBOARD_APP_URL ?? "http://localhost:3001";

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
        <Skeleton className="h-8 w-2/3" />
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
      href: `${WEB_APP_URL}?tenant=${application.desiredDomain}`,
    },
    {
      icon: LayoutDashboard,
      title: t("adminTitle"),
      desc: t("adminDesc"),
      cta: t("adminCta"),
      href: DASHBOARD_APP_URL,
    },
    {
      icon: ScanLine,
      title: t("scannerTitle"),
      desc: t("scannerDesc"),
      cta: t("scannerCta"),
      href: `${DASHBOARD_APP_URL}/team/gate-staff`,
    },
  ];

  return (
    <div className="mx-auto max-w-[560px] px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8 space-y-4">
        {links.map(({ icon: Icon, title, desc, cta, href }) => (
          <div key={title} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
            <Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
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
