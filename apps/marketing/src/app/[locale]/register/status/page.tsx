"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { TenantApplication } from "@manhar-garba/domain";
import { Button, EmptyState, ErrorState, Skeleton } from "@manhar-garba/ui";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { useRegistrationStore } from "@/lib/registration-store";
import { useRouter } from "@/i18n/navigation";
import { getApplicationAction } from "@/app/actions/registration";

export default function RegisterStatusPage() {
  const t = useTranslations("RegisterStatus");
  const router = useRouter();
  const { applicationId } = useRegistrationStore();

  const [application, setApplication] = useState<TenantApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    getApplicationAction(applicationId)
      .then((result) => { if (!cancelled) setApplication(result); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [applicationId]);

  // Live refresh (2026-09-15 shared-store track): an internal-ops approval
  // now lands in the shared file store within ~300ms (see packages/
  // mock-data/src/storage.ts) — this picks it up instead of asking the
  // organizer to sit here hitting refresh. Stops once the status is one this
  // page has nothing further to say about.
  useEffect(() => {
    if (!applicationId) return;
    const isSettled =
      application?.status === "rejected" ||
      application?.status === "more_info_needed" ||
      (application?.status === "approved" && Boolean(application.provisionedAt));
    if (isSettled) return;

    const id = setInterval(() => {
      getApplicationAction(applicationId).then(setApplication).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [applicationId, application?.status, application?.provisionedAt]);

  // The heading sits above every branch: a screen reader (and a crawler) should
  // find one <h1> whether the application is still loading, missing, or ready.
  const header = (
    <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-[480px] space-y-4 px-4 py-16 sm:px-6">
        {header}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loading")}
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[480px] space-y-8 px-4 py-16 sm:px-6">
        {header}
        <ErrorState
          action={<Button onClick={() => router.refresh()}>{t("loading")}</Button>}
        />
      </div>
    );
  }

  if (!applicationId || !application) {
    return (
      <div className="mx-auto max-w-[480px] space-y-8 px-4 py-16 sm:px-6">
        {header}
        <EmptyState
          title={t("notFound")}
          action={<Button onClick={() => router.push("/register")}>{t("notFoundCta")}</Button>}
        />
      </div>
    );
  }

  const isProvisioned = application.status === "approved" && Boolean(application.provisionedAt);

  return (
    <div className="mx-auto max-w-[480px] px-4 py-16 sm:px-6">
      {header}

      <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-center">
        {(application.status === "submitted" || application.status === "under_review") && (
          <>
            <Clock className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">{t("underReviewTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("underReviewDesc")}</p>
          </>
        )}

        {application.status === "approved" && !isProvisioned && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">{t("approvedProvisioningTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("approvedProvisioningDesc")}</p>
          </>
        )}

        {isProvisioned && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">{t("approvedReadyTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("approvedReadyDesc")}</p>
            <Button className="mt-6" onClick={() => router.push("/register/provisioned")}>
              {t("approvedReadyCta")}
            </Button>
          </>
        )}

        {application.status === "more_info_needed" && (
          <>
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">{t("moreInfoTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("moreInfoReason", { reason: application.rejectionReason ?? "" })}
            </p>
            <Button className="mt-6" onClick={() => router.push("/register/verify")}>
              {t("moreInfoCta")}
            </Button>
          </>
        )}

        {application.status === "rejected" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">{t("rejectedTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("rejectedReason", { reason: application.rejectionReason ?? "" })}
            </p>
            <Button asChild className="mt-6" variant="outline">
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">{t("rejectedCta")}</a>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
