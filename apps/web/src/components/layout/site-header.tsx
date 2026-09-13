import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@manhar-garba/ui";
import { PartyPopper } from "lucide-react";
import { getTenantBySlug } from "@manhar-garba/mock-data";

// This is the ORGANIZER's own site, not ManharEvent's — the header shows
// their brand, not ours (2026-09-12 pivot). ManharEvent only appears as a
// small "Powered by" credit in the footer.
export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const tenant = await getTenantBySlug("manhar");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2 font-display text-lg font-bold text-primary">
          <PartyPopper className="h-5 w-5" aria-hidden="true" />
          <span>{tenant?.display_name ?? "Loading…"}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          <Link href="/me/passes" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("myPasses")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/auth/start">{t("signIn")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
