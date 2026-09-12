import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@manhar-garba/ui";
import { Landmark, CreditCard } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pricing" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Pricing");

  return (
    <section className="mx-auto max-w-[720px] px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-center font-display text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-center text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-10 space-y-4">
        {/* Two-line-item fee template — kept visually consistent with <FeeBreakdown> on apps/web (FE-09) */}
        <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
          <Landmark className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-bold text-foreground">{t("platformFeeTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("platformFeeDesc")}</p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
          <CreditCard className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-bold text-foreground">{t("gatewayFeeTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("gatewayFeeDesc")}</p>
          </div>
        </div>
      </div>

      <p className="mt-6 rounded-lg bg-surface/60 p-4 text-sm text-muted-foreground">{t("comparisonNote")}</p>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href="/register">{t("cta")}</Link>
        </Button>
      </div>
    </section>
  );
}
