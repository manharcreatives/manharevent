import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Button,
  PassCard,
  QrCode,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@manhar-garba/ui";
import {
  event as demoEvent,
  eventNights,
  zones,
  passes,
  venue,
} from "@manhar-garba/mock-data";
import {
  Globe,
  WifiOff,
  ShieldCheck,
  Globe2,
  LayoutDashboard,
  ScanLine,
  ArrowRight,
  UserPlus,
  BadgeCheck,
  Rocket,
  MapPin,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });
  return { description: t("heroSubtitle") };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  const values = [
    { icon: Globe, title: t("value1Title"), desc: t("value1Desc") },
    { icon: WifiOff, title: t("value2Title"), desc: t("value2Desc") },
    { icon: ShieldCheck, title: t("value3Title"), desc: t("value3Desc") },
  ];
  const whatYouGet = [
    { icon: Globe2, title: t("whatYouGet1Title"), desc: t("whatYouGet1Desc") },
    { icon: LayoutDashboard, title: t("whatYouGet2Title"), desc: t("whatYouGet2Desc") },
    { icon: ScanLine, title: t("whatYouGet3Title"), desc: t("whatYouGet3Desc") },
  ];
  // Product facts, not traction numbers — every one of these is true of the
  // build and checkable in it. No invented "10,000 organizers".
  const proof = [1, 2, 3, 4].map((n) => ({ value: t(`proof${n}Value`), label: t(`proof${n}Label`) }));
  const steps = [
    { icon: UserPlus, title: t("how1Title"), desc: t("how1Desc") },
    { icon: BadgeCheck, title: t("how2Title"), desc: t("how2Desc") },
    { icon: Rocket, title: t("how3Title"), desc: t("how3Desc") },
  ];
  const faqs = [1, 2, 3, 4].map((n) => ({ q: t(`faq${n}Q`), a: t(`faq${n}A`) }));

  // The hero visual is rendered from the real demo event and a real pass, so
  // the QR on this page is the same scannable code the gate scanner accepts.
  const samplePass = passes.find((p) => p.admits === 2 && p.status === "active") ?? passes[0]!;
  const sampleZone = zones.find((z) => z.id === samplePass.zone_id);
  const firstNights = eventNights.slice(0, 5);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, hsl(var(--primary)/0.35) 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, hsl(var(--accent)/0.3) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-24">
          <div className="text-center lg:text-left">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">{t("heroEyebrow")}</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("heroTitle")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("heroSubtitle")}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="shadow-[var(--shadow-glow)]">
                <Link href="/register">
                  {t("heroCta")} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">{t("heroSecondaryCta")}</Link>
              </Button>
            </div>
          </div>

          {/* Product visual: a booking-site card and the pass a buyer receives */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-border bg-surface/80 p-4 shadow-2xl backdrop-blur">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-2 truncate rounded bg-surface-raised px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  yourgarba.manharevent.com
                </span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("previewSiteLabel")}</p>
              <p className="mt-1 font-display text-lg font-bold text-foreground">{demoEvent.title}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {venue.name}, {venue.city}
              </p>
              <div className="mt-3 flex gap-1.5 overflow-hidden">
                {firstNights.map((n) => (
                  <div
                    key={n.id}
                    className="flex h-16 w-14 shrink-0 flex-col justify-between rounded-lg border border-border p-1.5"
                    style={{ background: `linear-gradient(135deg, ${n.theme_color ?? "#F55B2A"}33, ${n.theme_color ?? "#F55B2A"}88)` }}
                  >
                    <span className="text-lg font-black leading-none text-white">{n.night_number}</span>
                    <span className="truncate text-[8px] font-medium text-white">{n.theme}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative -mt-6 ml-auto w-[78%] rounded-2xl border border-border bg-background p-3 shadow-2xl sm:-mr-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("previewPassLabel")}</p>
              <PassCard
                state="valid"
                holderName="Rina & Kaushik"
                zoneName={sampleZone?.name ?? "Gold Zone"}
                zoneColor={sampleZone?.color ?? "#F5B82E"}
                admits={samplePass.admits}
                nightRange={`All ${samplePass.night_ids.length} nights`}
                passCode={samplePass.pass_code}
              />
              <div className="mt-3 flex justify-center">
                <QrCode value={samplePass.qr_payload} size={112} level="M" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Proof band ───────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("proofTitle")}</p>
          <dl className="mt-6 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {proof.map((p) => (
              <div key={p.label}>
                <dt className="font-display text-3xl font-bold text-foreground">{p.value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{p.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">{t("howTitle")}</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <li key={title} className="relative rounded-xl border border-border bg-surface p-6">
              <span className="absolute right-5 top-5 font-display text-4xl font-black text-border">{i + 1}</span>
              <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Value props ──────────────────────────────────────────────── */}
      <section className="bg-surface/40 py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">{t("valueTitle")}</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-background p-6 transition-colors hover:border-primary/40">
                <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you get ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">{t("whatYouGetTitle")}</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {whatYouGet.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center rounded-xl border border-border bg-surface p-6 text-center">
              <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-display text-base font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[760px] px-4 pb-8 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">{t("faqTitle")}</h2>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center rounded-2xl border border-primary/30 bg-primary/5 px-6 py-12 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t("finalCtaTitle")}</h2>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                {t("finalCta")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">{t("heroSecondaryCta")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
