import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, Money } from "@manhar-garba/ui";
import {
  computeFees,
  bpsToPercent,
  PLATFORM_FEE_BPS,
  GATEWAY_FEE_BPS,
  paise,
} from "@manhar-garba/domain";
import { Landmark, CreditCard } from "lucide-react";

// A ₹1,000 pass, run through the exact same `computeFees` the buyer's
// checkout uses. Prose alone let an organizer leave this page without ever
// seeing a number; this makes the promise checkable.
const EXAMPLE_TICKET_PAISE = paise(100000);

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
  const example = computeFees(EXAMPLE_TICKET_PAISE);

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

      {/* Worked example — the same numbers the buyer sees at checkout */}
      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-base font-bold text-foreground">{t("exampleTitle")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("ticketPrice")}</dt>
            <dd className="tabular text-foreground">
              <Money paise={example.subtotalPaise} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {t("platformFeeLine", { rate: bpsToPercent(PLATFORM_FEE_BPS) })}
            </dt>
            <dd className="tabular text-foreground">
              <Money paise={example.platformFeePaise} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {t("gatewayFeeLine", { rate: bpsToPercent(GATEWAY_FEE_BPS) })}
            </dt>
            <dd className="tabular text-foreground">
              <Money paise={example.gatewayFeePaise} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("gstLine")}</dt>
            <dd className="tabular text-foreground">
              <Money paise={example.gstPaise} />
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-bold">
            <dt className="text-foreground">{t("buyerPays")}</dt>
            <dd className="tabular text-foreground">
              <Money paise={example.totalPaise} />
            </dd>
          </div>
          <div className="flex justify-between font-bold text-success">
            <dt>{t("youReceive")}</dt>
            <dd className="tabular">
              <Money paise={example.organizerNetPaise} />
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">{t("exampleNote")}</p>
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
