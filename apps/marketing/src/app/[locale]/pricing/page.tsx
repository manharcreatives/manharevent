import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Button,
  Money,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@manhar-garba/ui";
import {
  computeFees,
  bpsToPercent,
  PLATFORM_FEE_BPS,
  GATEWAY_FEE_BPS,
  paise,
} from "@manhar-garba/domain";
import { Landmark, CreditCard, Check, X, ArrowRight } from "lucide-react";
import { localeAlternates } from "@/lib/seo";
import {
  graph,
  jsonLdHtml,
  organizationNode,
  softwareApplicationNode,
  faqPageNode,
  breadcrumbNode,
} from "@/lib/structured-data";

// A ₹1,000 pass, run through the exact same `computeFees` the buyer's
// checkout uses. Prose alone let an organizer leave this page without ever
// seeing a number; this makes the promise checkable.
const EXAMPLE_TICKET_PAISE = paise(100000);

// The three prices a Garba organizer actually argues about: a weeknight
// general pass, a weekend pass, and a VIP season pass.
const SCALE_TICKETS_PAISE = [paise(30000), paise(100000), paise(250000)];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Pricing" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: localeAlternates("/pricing", locale),
    openGraph: { title, description, url: localeAlternates("/pricing", locale).canonical },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Pricing");
  const tNav = await getTranslations("MarketingNav");
  const example = computeFees(EXAMPLE_TICKET_PAISE);
  const scale = SCALE_TICKETS_PAISE.map((p) => computeFees(p));
  const platformRate = bpsToPercent(PLATFORM_FEE_BPS);
  const gatewayRate = bpsToPercent(GATEWAY_FEE_BPS);

  const noFees = [t("noFee1"), t("noFee2"), t("noFee3"), t("noFee4")];
  const faqs = [1, 2, 3, 4].map((n) => ({ q: t(`pfaq${n}Q`), a: t(`pfaq${n}A`) }));

  const structuredData = graph([
    organizationNode(locale),
    softwareApplicationNode({
      locale,
      name: "ManharEvent",
      description: t("metaDescription"),
      platformFeePercent: platformRate,
    }),
    faqPageNode(faqs),
    breadcrumbNode([
      { name: tNav("home"), path: "/" },
      { name: t("title"), path: "/pricing" },
    ]),
  ]);

  return (
    <section className="mx-auto max-w-[760px] px-4 py-16 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(structuredData) }}
      />

      <h1 className="text-center font-display text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-center text-muted-foreground">{t("subtitle")}</p>

      {/* The headline number, stated before any prose. An organizer comparing
          us with a bundled-fee incumbent needs the two rates in one glance. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <Landmark className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-3 font-display text-3xl font-bold text-foreground">{platformRate}</p>
          <h2 className="mt-1 font-display text-sm font-bold text-foreground">{t("platformFeeTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("platformFeeDesc")}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <CreditCard className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-display text-3xl font-bold text-foreground">{gatewayRate}</p>
          <h2 className="mt-1 font-display text-sm font-bold text-foreground">{t("gatewayFeeTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("gatewayFeeDesc")}</p>
        </div>
      </div>

      {/* Worked example — the same numbers the buyer sees at checkout */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-base font-bold text-foreground">{t("exampleTitle")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("ticketPrice")}</dt>
            <dd className="tabular shrink-0 text-foreground">
              <Money paise={example.subtotalPaise} />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("platformFeeLine", { rate: platformRate })}</dt>
            <dd className="tabular shrink-0 text-foreground">
              <Money paise={example.platformFeePaise} />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("gatewayFeeLine", { rate: gatewayRate })}</dt>
            <dd className="tabular shrink-0 text-foreground">
              <Money paise={example.gatewayFeePaise} />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("gstLine")}</dt>
            <dd className="tabular shrink-0 text-foreground">
              <Money paise={example.gstPaise} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-bold">
            <dt className="text-foreground">{t("buyerPays")}</dt>
            <dd className="tabular shrink-0 text-foreground">
              <Money paise={example.totalPaise} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 font-bold text-success">
            <dt>{t("youReceive")}</dt>
            <dd className="tabular shrink-0">
              <Money paise={example.organizerNetPaise} />
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">{t("exampleNote")}</p>
      </div>

      {/* Scale table — one price point is an anecdote, three is a rule. */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-base font-bold text-foreground">{t("scaleTitle")}</h2>
        {/* Narrow phones get a scrolling table rather than a squeezed one; the
            page itself must never scroll sideways. */}
        <div className="-mx-5 mt-4 overflow-x-auto px-5">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="pb-2 pr-3 font-semibold">{t("colPassPrice")}</th>
                <th scope="col" className="pb-2 pr-3 text-right font-semibold">{t("colOurFee")}</th>
                <th scope="col" className="pb-2 pr-3 text-right font-semibold">{t("colBuyerPays")}</th>
                <th scope="col" className="pb-2 text-right font-semibold">{t("colYouReceive")}</th>
              </tr>
            </thead>
            <tbody>
              {scale.map((row) => (
                <tr key={row.subtotalPaise} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="py-2.5 pr-3 text-left font-medium text-foreground">
                    <Money paise={row.subtotalPaise} />
                  </th>
                  <td className="tabular py-2.5 pr-3 text-right text-muted-foreground">
                    <Money paise={row.platformFeePaise} />
                  </td>
                  <td className="tabular py-2.5 pr-3 text-right text-foreground">
                    <Money paise={row.totalPaise} />
                  </td>
                  <td className="tabular py-2.5 text-right font-semibold text-success">
                    <Money paise={row.organizerNetPaise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("scaleNote")}</p>
      </div>

      {/* What you never pay — the incumbent's setup fee and monthly minimum are
          the objections this page exists to remove. */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-base font-bold text-foreground">{t("noFeesTitle")}</h2>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {noFees.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                <Check className="h-3 w-3 text-success" aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-surface/60 p-4 text-sm text-muted-foreground">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
        <span>{t("comparisonNote")}</span>
      </p>

      <div className="mt-10">
        <h2 className="text-center font-display text-2xl font-bold text-foreground">{t("faqTitle")}</h2>
        <Accordion type="single" collapsible className="mt-6 w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`pfaq-${i}`}>
              <AccordionTrigger className="min-h-[56px] text-left text-sm font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-10 flex flex-col items-center rounded-2xl border border-primary/30 bg-primary/5 px-6 py-10 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">{t("ctaSubtitle")}</p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/register">
            {t("cta")} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
