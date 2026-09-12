"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@manhar-garba/ui";
import { Ticket, Wallet, LogOut, User, ChevronRight } from "lucide-react";

// The 4th bottom-tab destination (Explore · My Passes · Wallet · Account —
// manharevents-screen-specs.md §1.6). Kept deliberately shallow — "this
// surface is too shallow to earn" its own sidebar, per that same spec —
// just an identity card and links out to the two things there are to link
// to on mock data (My Passes, Wallet). Closes a real gap: this route was
// linked from the bottom nav and from auth/profile's redirect, but never
// existed (FE-11).
export default function AccountPage() {
  const t = useTranslations("Me");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const { phone, name, isAuthenticated, signOut } = useAuthStore();

  if (!isAuthenticated || !phone) {
    return (
      <div className="mx-auto max-w-[400px] px-4 py-16 text-center sm:px-6">
        <User className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">{tAuth("signInTitle")}</h1>
        <Button asChild className="mt-6 w-full">
          <Link href="/auth/start">{t("title")}</Link>
        </Button>
      </div>
    );
  }

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
          {(name ?? phone).slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{name ?? tAuth("signedInAs", { phone })}</p>
          {name && <p className="text-xs text-muted-foreground">{phone}</p>}
        </div>
      </div>

      <nav className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface" aria-label="Account">
        <Link href="/me/passes" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-raised">
          <Ticket className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-sm font-medium text-foreground">{t("passes")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Link>
        <Link href="/me/wallet" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-raised">
          <Wallet className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-sm font-medium text-foreground">{t("wallet")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      </nav>

      <button
        onClick={handleSignOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {t("signOut")}
      </button>
    </div>
  );
}
