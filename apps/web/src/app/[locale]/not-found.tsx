import { getTranslations } from "next-intl/server";
import { Compass, Ticket } from "lucide-react";
import { buttonVariants } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";

/**
 * Localised 404, rendered inside the site chrome (header/footer stay put) so a
 * visitor who mistypes a URL can keep browsing instead of hitting a dead end.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations("Common");
  const tNav = await getTranslations("Nav");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="relative">
        <span
          aria-hidden
          className="font-display text-[7rem] font-bold leading-none text-transparent [-webkit-text-stroke:2px_hsl(var(--border-strong))] sm:text-[9rem]"
        >
          404
        </span>
        <Compass className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 text-primary" />
      </div>

      <h1 className="mt-2 font-display text-2xl font-bold text-foreground">{t("notFound")}</h1>
      <p className="mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
        {t("notFoundDesc")}
      </p>

      <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          {t("goHome")}
        </Link>
        <Link href="/me/passes" className={buttonVariants({ variant: "outline", size: "lg" })}>
          <Ticket className="mr-2 h-4 w-4" />
          {tNav("myPasses")}
        </Link>
      </div>
    </div>
  );
}
