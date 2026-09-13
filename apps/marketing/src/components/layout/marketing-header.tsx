import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@manhar-garba/ui";

export async function MarketingHeader() {
  const t = await getTranslations("MarketingNav");
  const tCommon = await getTranslations("Common");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        {/* min-w-0 + truncate: at 390px the wordmark used to run underneath the
            language switcher instead of shortening. */}
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 py-2 font-display text-lg font-bold text-primary"
        >
          <Image
            src="/brand/manharevent-icon-transparent-1024.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-auto shrink-0"
            priority
          />
          <span className="truncate">{tCommon("appName")}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Main navigation">
          <Link
            href="/#how-it-works"
            className="py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("howItWorks")}
          </Link>
          <Link
            href="/pricing"
            className="py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("pricing")}
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0 md:gap-3">
          <LocaleSwitcher />
          <Button asChild className="h-11 px-3 text-sm sm:px-4">
            <Link href="/register">
              {/* The Gujarati label is three words long; the short form keeps the
                  header on one line on a 360px phone. */}
              <span className="sm:hidden">{t("registerShort")}</span>
              <span className="hidden sm:inline">{t("registerCta")}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
