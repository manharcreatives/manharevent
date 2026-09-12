import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PartyPopper } from "lucide-react";
import { getTenantBySlug } from "@manhar-garba/mock-data";

// Footer keeps the small "Powered by ManharEvent" credit line — the one
// place the ManharEvent brand still appears on an organizer's own site
// (2026-09-12 pivot, manharevents-screen-specs.md §1.1).
export async function SiteFooter() {
  const t = await getTranslations("Common");
  const tenant = await getTenantBySlug("manhar");

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background pb-20 md:pb-0">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-display text-base font-bold text-primary">
              <PartyPopper className="h-4 w-4" aria-hidden="true" />
              <span>{tenant?.display_name ?? ""}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("tagline")}</p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Footer navigation">
            <Link href="/auth/start" className="hover:text-foreground">{t("supportWhatsapp")}</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">{t("privacyPolicy")}</Link>
            <Link href="/legal/terms" className="hover:text-foreground">{t("termsOfService")}</Link>
            <Link href="/legal/refund-policy" className="hover:text-foreground">{t("refundPolicy")}</Link>
          </nav>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {t("orgCopyright", { year, orgName: tenant?.display_name ?? "", appName: t("appName") })}
        </p>
      </div>
    </footer>
  );
}
