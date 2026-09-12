"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Button, EmptyState, Money } from "@manhar-garba/ui";
import { Wallet } from "lucide-react";

// The 3rd bottom-tab destination. The F&B wallet feature itself is P-13 in
// the main phase table (⏭️ deferred — no top-up flow, no vendor spend, no
// balance ever set above zero anywhere in the mock data), so this is
// deliberately a real empty state rather than a fabricated balance/topup
// UI: it uses exactly the "walletEmpty"/"walletTopUp" copy the "Me" i18n
// namespace already had waiting for it, and nothing more. Closes the 404
// gap without pretending P-13 is built (FE-11).
export default function WalletPage() {
  const t = useTranslations("Me");
  const tAuth = useTranslations("Auth");
  const { phone, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !phone) {
    return (
      <div className="mx-auto max-w-[400px] px-4 py-16 text-center sm:px-6">
        <Wallet className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">{tAuth("signInTitle")}</h1>
        <Button asChild className="mt-6 w-full">
          <Link href="/auth/start">{t("title")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("wallet")}</h1>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-xs text-muted-foreground">{t("walletBalance")}</p>
        <p className="mt-1 font-display text-3xl font-bold text-foreground">
          <Money paise={0} />
        </p>
      </div>

      <div className="mt-4">
        <EmptyState
          icon={<Wallet />}
          title={t("walletEmpty")}
          description={t("walletTopUp")}
        />
      </div>
    </div>
  );
}
