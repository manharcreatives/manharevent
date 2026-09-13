import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

/** Sales line printed on the register funnel too — one number, one place. */
export const SUPPORT_WHATSAPP = "https://wa.me/919876543210";

export async function MarketingFooter() {
  const t = await getTranslations("Common");
  const tNav = await getTranslations("MarketingNav");
  const year = new Date().getFullYear();

  // `inline-flex min-h-11 items-center` on every link: these were 20px-high tap
  // targets, which is half the 44px minimum on a phone.
  const linkClass = "inline-flex min-h-11 items-center hover:text-foreground";

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
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t("supportWhatsapp")}
            </a>
          </div>

          <nav
            className="flex flex-wrap gap-x-6 text-sm text-muted-foreground"
            aria-label="Footer navigation"
          >
            <Link href="/pricing" className={linkClass}>{tNav("pricing")}</Link>
            <Link href="/register" className={linkClass}>{tNav("registerCta")}</Link>
            {/* The legal pages live on the booking site and apply to every organizer on ManharEvent. */}
            <a href={`${WEB_URL}/en/legal/terms`} className={linkClass}>{t("termsOfService")}</a>
            <a href={`${WEB_URL}/en/legal/privacy`} className={linkClass}>{t("privacyPolicy")}</a>
            <a href={`${WEB_URL}/en/legal/refund-policy`} className={linkClass}>{t("refundPolicy")}</a>
          </nav>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
