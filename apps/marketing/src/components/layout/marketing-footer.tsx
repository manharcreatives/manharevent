import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export async function MarketingFooter() {
  const t = await getTranslations("Common");
  const tNav = await getTranslations("MarketingNav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-display text-base font-bold text-primary">
              <Image
                src="/brand/manharevent-icon-transparent-1024.png"
                alt=""
                width={24}
                height={24}
                className="h-6 w-auto"
              />
              <span>{t("appName")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{tNav("poweredBy")}</p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Footer navigation">
            <Link href="/pricing" className="hover:text-foreground">{tNav("pricing")}</Link>
            <Link href="/register" className="hover:text-foreground">{tNav("registerCta")}</Link>
            {/* The legal pages live on the booking site and apply to every organizer on ManharEvent. */}
            <a href={`${WEB_URL}/en/legal/terms`} className="hover:text-foreground">{t("termsOfService")}</a>
            <a href={`${WEB_URL}/en/legal/privacy`} className="hover:text-foreground">{t("privacyPolicy")}</a>
            <a href={`${WEB_URL}/en/legal/refund-policy`} className="hover:text-foreground">{t("refundPolicy")}</a>
          </nav>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
