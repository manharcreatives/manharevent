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
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          <Image
            src="/brand/manharevent-icon-transparent-1024.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-auto"
            priority
          />
          <span>{tCommon("appName")}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Button asChild size="sm">
            <Link href="/register">{t("registerCta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
